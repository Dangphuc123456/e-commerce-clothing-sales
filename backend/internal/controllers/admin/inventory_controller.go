package admin

import (
	"backend/internal/models"
	admin "backend/internal/repository/admin"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

// GET ALL LOGS
func GetAllInventoryLogs(w http.ResponseWriter, r *http.Request) {
	logs, err := admin.GetAllInventoryLogs()
	if err != nil {
		http.Error(w, "Failed to fetch inventory logs", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]interface{}{"data": logs})
}

// GET LOG DETAIL
func GetInventoryLogDetail(w http.ResponseWriter, r *http.Request) {
	idParam := mux.Vars(r)["id"]
	id, _ := strconv.Atoi(idParam)
	log, err := admin.GetInventoryLogDetail(uint(id))
	if err != nil {
		http.Error(w, "Inventory log not found", http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(log)
}

// CREATE LOG
func CreateInventoryLog(w http.ResponseWriter, r *http.Request) {
	var req models.InventoryLog
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	log, err := admin.CreateInventoryLog(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	json.NewEncoder(w).Encode(log)
}

// UPDATE LOG (chỉ note)
func EditInventoryLog(w http.ResponseWriter, r *http.Request) {
	idParam := mux.Vars(r)["id"]
	id, _ := strconv.Atoi(idParam)
	var req models.InventoryLog
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	log, err := admin.UpdateInventoryLog(uint(id), &req)
	if err != nil {
		http.Error(w, "Failed to update inventory log", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(log)
}

// DELETE LOG
func DeleteInventoryLog(w http.ResponseWriter, r *http.Request) {
	idParam := mux.Vars(r)["id"]
	id, _ := strconv.Atoi(idParam)
	if err := admin.DeleteInventoryLog(uint(id)); err != nil {
		http.Error(w, "Failed to delete inventory log", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"message": "Inventory log deleted successfully"})
}
