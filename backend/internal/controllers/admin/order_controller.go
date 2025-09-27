package admin

import (
	"encoding/json"
	"net/http"
	"strconv"

	orderRepo "backend/internal/repository/admin"
	"backend/internal/middlewares"
	"backend/internal/models"

	"github.com/gorilla/mux"
)

// GET ALL ORDERS (có thể lọc theo status)
func GetAllOrders(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")

	orders, err := orderRepo.GetAllOrders()
	if err != nil {
		http.Error(w, "Failed to fetch orders", http.StatusInternalServerError)
		return
	}

	// Lọc theo status nếu có
	if status != "" {
		filtered := []models.Order{}
		for _, o := range orders {
			if o.Status == status {
				filtered = append(filtered, o)
			}
		}
		orders = filtered
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"data": orders})
}

// GET ORDER DETAIL
func GetOrderDetail(w http.ResponseWriter, r *http.Request) {
	idParam := mux.Vars(r)["id"]
	orderID, err := strconv.Atoi(idParam)
	if err != nil {
		http.Error(w, "Invalid order ID", http.StatusBadRequest)
		return
	}

	order, err := orderRepo.GetOrderDetail(uint(orderID))
	if err != nil {
		http.Error(w, "Order not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(order)
}

// UPDATE ORDER STATUS + lưu StaffID từ JWT
func UpdateOrderStatus(w http.ResponseWriter, r *http.Request) {
	// Lấy staffID từ context
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	staffID := claims.UserID

	// Lấy order ID từ URL
	idParam := mux.Vars(r)["id"]
	orderID, err := strconv.Atoi(idParam)
	if err != nil {
		http.Error(w, "Invalid order ID", http.StatusBadRequest)
		return
	}

	// Lấy body
	var body struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Cập nhật trạng thái + staffID
	if err := orderRepo.UpdateOrderStatus(uint(orderID), body.Status, staffID); err != nil {
		http.Error(w, "Failed to update order", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Order status updated"})
}
