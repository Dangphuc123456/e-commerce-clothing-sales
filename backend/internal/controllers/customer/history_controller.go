package customer

import (
	"encoding/json"
	"net/http"
	"strconv"            
	"github.com/gorilla/mux"
	customerRepo "backend/internal/repository/customer"
	"backend/internal/middlewares"
)

// GET /api/customer/orders/processing
func GetProcessingOrdersHandler(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	statuses := []string{"pending", "confirmed", "shipped"}
	orders, err := customerRepo.GetCustomerOrdersByStatus(claims.UserID, statuses)
	if err != nil {
		http.Error(w, "Failed to fetch orders: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"orders": orders,
	})
}

// GET /api/customer/orders/history
func GetOrderHistoryHandler(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	statuses := []string{"completed", "cancelled"}
	orders, err := customerRepo.GetCustomerOrdersByStatus(claims.UserID, statuses)
	if err != nil {
		http.Error(w, "Failed to fetch order history: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"orders": orders,
	})
}
func CancelOrderHandler(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	vars := mux.Vars(r)
	orderID, err := strconv.ParseUint(vars["id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid order ID", http.StatusBadRequest)
		return
	}
	var req struct {
		Reason string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Reason == "" {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := customerRepo.CancelOrder(uint(orderID), claims.UserID, req.Reason); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Order cancelled successfully",
	})
}