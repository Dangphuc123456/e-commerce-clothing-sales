package admin

import (
	"backend/internal/models"
	admin "backend/internal/repository/admin"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

// ---------- Global purchases (optional) ----------

// GET /api/admin/purchases
func GetAllPurchasesGlobal(w http.ResponseWriter, r *http.Request) {
    purchases, err := admin.GetAllPurchases()
    if err != nil {
        http.Error(w, "Failed to fetch purchases", http.StatusInternalServerError)
        return
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(purchases) // <-- trả về [] luôn, không bọc "data"
}

// POST /api/admin/purchases  (body must include supplier_id)
func CreatePurchaseGlobal(w http.ResponseWriter, r *http.Request) {
	var req models.Purchase
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	if req.SupplierID == 0 {
		http.Error(w, "supplier_id required", http.StatusBadRequest)
		return
	}
	purchase, err := admin.CreatePurchase(&req)
	if err != nil {
		http.Error(w, "Failed to create purchase", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(purchase)
}

// PUT /api/admin/purchases/{id}
func EditPurchaseGlobal(w http.ResponseWriter, r *http.Request) {
	idStr := mux.Vars(r)["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}
	var req models.Purchase
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	purchase, err := admin.UpdatePurchase(uint(id), &req)
	if err != nil {
		http.Error(w, "Failed to update purchase", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(purchase)
}

// DELETE /api/admin/purchases/{id}
func DeletePurchaseGlobal(w http.ResponseWriter, r *http.Request) {
	idStr := mux.Vars(r)["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}
	if err := admin.DeletePurchase(uint(id)); err != nil {
		http.Error(w, "Failed to delete purchase", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"message": "Purchase deleted"})
}

// ---------- Supplier-scoped purchases ----------

// GET /api/admin/suppliers/{id}/purchases
func GetPurchasesBySupplier(w http.ResponseWriter, r *http.Request) {
	idStr := mux.Vars(r)["id"]
	sid, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid supplier ID", http.StatusBadRequest)
		return
	}
	purchases, err := admin.GetPurchasesBySupplier(uint(sid))
	if err != nil {
		http.Error(w, "Failed to fetch purchases", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"data": purchases})
}

// POST /api/admin/suppliers/{id}/purchases
func CreatePurchaseForSupplier(w http.ResponseWriter, r *http.Request) {
	idStr := mux.Vars(r)["id"]
	sid, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid supplier ID", http.StatusBadRequest)
		return
	}
	var req models.Purchase
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	req.SupplierID = uint(sid)
	purchase, err := admin.CreatePurchase(&req)
	if err != nil {
		http.Error(w, "Failed to create purchase", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(purchase)
}

// PUT /api/admin/suppliers/{id}/purchases/{purchaseId}
func EditPurchaseForSupplier(w http.ResponseWriter, r *http.Request) {
	pidStr := mux.Vars(r)["purchaseId"]
	pid, err := strconv.Atoi(pidStr)
	if err != nil {
		http.Error(w, "Invalid purchase ID", http.StatusBadRequest)
		return
	}
	var req models.Purchase
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	purchase, err := admin.UpdatePurchase(uint(pid), &req)
	if err != nil {
		http.Error(w, "Failed to update purchase", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(purchase)
}

// DELETE /api/admin/suppliers/{id}/purchases/{purchaseId}
func DeletePurchaseForSupplier(w http.ResponseWriter, r *http.Request) {
	pidStr := mux.Vars(r)["purchaseId"]
	pid, err := strconv.Atoi(pidStr)
	if err != nil {
		http.Error(w, "Invalid purchase ID", http.StatusBadRequest)
		return
	}
	if err := admin.DeletePurchase(uint(pid)); err != nil {
		http.Error(w, "Failed to delete purchase", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"message": "Purchase deleted"})
}
