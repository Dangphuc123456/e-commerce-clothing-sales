package admin

import (
	"backend/internal/models"
	admin "backend/internal/repository/admin"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

// GET ALL SUPPLIERS
func GetAllSuppliers(w http.ResponseWriter, r *http.Request) {
	suppliers, err := admin.GetAllSuppliers()
	if err != nil {
		http.Error(w, "Failed to fetch suppliers", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]interface{}{"data": suppliers})
}

// GET SUPPLIER DETAIL (kèm theo purchases)
func GetSupplierDetail(w http.ResponseWriter, r *http.Request) {
	idParam := mux.Vars(r)["id"]
	id, err := strconv.Atoi(idParam)
	if err != nil {
		http.Error(w, "Invalid supplier ID", http.StatusBadRequest)
		return
	}
	supplier, err := admin.GetSupplierDetail(uint(id))
	if err != nil {
		http.Error(w, "Supplier not found", http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(supplier)
}

// CREATE SUPPLIER
func CreateSupplier(w http.ResponseWriter, r *http.Request) {
	var req models.Supplier
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	supplier, err := admin.CreateSupplier(&req)
	if err != nil {
		http.Error(w, "Failed to create supplier", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(supplier)
}

// UPDATE SUPPLIER
func EditSupplier(w http.ResponseWriter, r *http.Request) {
	idParam := mux.Vars(r)["id"]
	id, err := strconv.Atoi(idParam)
	if err != nil {
		http.Error(w, "Invalid supplier ID", http.StatusBadRequest)
		return
	}
	var req models.Supplier
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	supplier, err := admin.UpdateSupplier(uint(id), &req)
	if err != nil {
		http.Error(w, "Failed to update supplier", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(supplier)
}

// DELETE SUPPLIER
func DeleteSupplier(w http.ResponseWriter, r *http.Request) {
	idParam := mux.Vars(r)["id"]
	id, err := strconv.Atoi(idParam)
	if err != nil {
		http.Error(w, "Invalid supplier ID", http.StatusBadRequest)
		return
	}
	if err := admin.DeleteSupplier(uint(id)); err != nil {
		http.Error(w, "Failed to delete supplier", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"message": "Supplier deleted successfully"})
}
