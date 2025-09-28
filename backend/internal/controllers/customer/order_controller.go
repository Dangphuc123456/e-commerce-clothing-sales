package customer

import (
	"backend/internal/models"
	customerRepo "backend/internal/repository/customer"
	"backend/internal/service"
	"backend/internal/utils"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net"
	"net/http"
	"os"
	"strings"
	"time"
)

// Lấy địa chỉ IP của client từ request
func getClientIP(r *http.Request) string {
	xff := strings.TrimSpace(r.Header.Get("X-Forwarded-For"))
	if xff != "" {
		parts := strings.Split(xff, ",")
		ip := strings.TrimSpace(parts[0])
		if ip == "::1" {
			return "127.0.0.1"
		}
		return ip
	}
	hostPort := strings.TrimSpace(r.RemoteAddr)
	if hostPort == "" {
		return "127.0.0.1"
	}
	if host, _, err := net.SplitHostPort(hostPort); err == nil {
		host = strings.TrimSpace(host)
		if host == "::1" {
			return "127.0.0.1"
		}
		return host
	}
	h := hostPort
	if strings.HasPrefix(h, "[") && strings.Contains(h, "]") {
		h = h[1:strings.Index(h, "]")]
	}
	if strings.Contains(h, ":") {
		h = strings.Split(h, ":")[0]
	}
	if h == "::1" || h == "" {
		return "127.0.0.1"
	}
	return h
}

// PlaceOrderRequest giống kiểu bạn đang dùng
type PlaceOrderRequest struct {
	CustomerID    uint                   `json:"customer_id"`
	PaymentMethod string                 `json:"payment_method"` 
	Total         float64                `json:"total"`
	Items         []models.OrderItem     `json:"items"`
	Address       models.CustomerAddress `json:"address"`
}

// POST /api/customer/orders
func PlaceOrderHandler(w http.ResponseWriter, r *http.Request) {
	var req PlaceOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.CustomerID == 0 || len(req.Items) == 0 {
		http.Error(w, "Missing customer_id or items", http.StatusBadRequest)
		return
	}

	txnRef := fmt.Sprintf("%d-%d", time.Now().UnixNano(), req.CustomerID)

	order := models.Order{
		CustomerID:    req.CustomerID,
		PaymentMethod: req.PaymentMethod,
		Total:         req.Total,
		Status:        "pending",
		TxnRef:        txnRef,
		Items:         req.Items,
	}

	address := &req.Address

	//For COD: always create and delete the cart.
    //For VNPAY: create the order but do not delete the cart — it will be deleted when the VNPay callback succeeds.
	clearCart := false
	if strings.ToLower(req.PaymentMethod) == "cod" {
		clearCart = true
	}

	if err := customerRepo.CreateOrder(&order, address, req.CustomerID, clearCart); err != nil {
		http.Error(w, "Failed to create order: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// For COD: send a confirmation email and return the order.
	if strings.ToLower(order.PaymentMethod) == "cod" {
		var emailItems []map[string]interface{}
		for _, item := range order.Items {
			emailItems = append(emailItems, map[string]interface{}{
				"name":     item.ProductName,
				"sku":      item.SKU,
				"quantity": item.Quantity,
				"price":    item.Price,
				"size":     item.Size,
				"color":    item.Color,
			})
		}
		// Send email 
		if err := service.SendOrderEmail(address.Email, emailItems); err != nil {
			log.Println("Failed to send order email:", err)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"order":   order,
			"address": address,
		})
		return
	}

	// For VNPay: create the payment URL and return it to the frontend (frontend redirect).
	if strings.ToLower(order.PaymentMethod) == "vnpay" {
		amount := int(math.Round(req.Total * 100)) 
		orderInfo := fmt.Sprintf("Thanh toán đơn hàng -%s", order.TxnRef)

		params := map[string]string{
			"vnp_Version":    "2.1.0",
			"vnp_Command":    "pay",
			"vnp_TmnCode":    os.Getenv("VNP_TMN_CODE"),
			"vnp_Amount":     fmt.Sprintf("%d", amount),
			"vnp_CurrCode":   "VND",
			"vnp_TxnRef":     order.TxnRef,
			"vnp_OrderInfo":  orderInfo,
			"vnp_OrderType":  "other",
			"vnp_Locale":     "vn",
			"vnp_ReturnUrl":  os.Getenv("VNP_RETURN_URL"),
			"vnp_CreateDate": time.Now().Format("20060102150405"),
			"vnp_IpAddr":     getClientIP(r),
		}

		paymentUrl := utils.CreateVnpayUrl(params, os.Getenv("VNP_HASH_SECRET"), os.Getenv("VNP_URL"))
		log.Println("VNPay URL:", paymentUrl)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"order": order,
			"url":   paymentUrl,
		})
		return
	}

	http.Error(w, "Invalid payment method", http.StatusBadRequest)
}

func VnpayReturnHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	vnpData := make(map[string]string)
	for key := range query {
		vnpData[key] = query.Get(key)
	}

	vnpSecureHash := vnpData["vnp_SecureHash"]
	delete(vnpData, "vnp_SecureHash")
	delete(vnpData, "vnp_SecureHashType")

	if !utils.ValidateVnpayHash(vnpData, os.Getenv("VNP_HASH_SECRET"), vnpSecureHash) {
		http.Error(w, "Invalid checksum", http.StatusBadRequest)
		return
	}

	order, err := customerRepo.GetOrderByTxnRef(vnpData["vnp_TxnRef"])
	if err != nil || order == nil {
		http.Error(w, "Order not found", http.StatusNotFound)
		return
	}

	newStatus := "pending"
	if vnpData["vnp_ResponseCode"] == "00" {
		newStatus = "confirmed"
	} else {
		newStatus = "cancelled"
	}

	if err := customerRepo.UpdateOrderStatus(order.ID, newStatus); err != nil {
		log.Println("Failed to update order status:", err)
	}
	if newStatus == "confirmed" {
    rows, err := customerRepo.ClearCartAfterPayment(uint(order.CustomerID))
    if err != nil {
        log.Printf("VNPay clear cart failed: %v", err)
    } else {
        log.Printf("VNPay clear cart success: user=%d rows=%d", order.CustomerID, rows)
    }
}

	frontend := strings.TrimRight(os.Getenv("FRONTEND_URL"), "/")
	redirectUrl := fmt.Sprintf("%s/thankyou?status=%s&amount=%s",
		frontend, newStatus, vnpData["vnp_Amount"])
	http.Redirect(w, r, redirectUrl, http.StatusSeeOther)
}


// GET /api/customer/orders (customer)
func GetCustomerOrdersHandler(w http.ResponseWriter, r *http.Request) {
	uidVal := r.Context().Value("userID")
	if uidVal == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	userID, ok := uidVal.(uint)
	if !ok {
		http.Error(w, "Invalid user id type in context", http.StatusInternalServerError)
		return
	}
	orders, err := customerRepo.GetOrdersByCustomer(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orders)
}
