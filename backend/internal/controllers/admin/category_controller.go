package admin

import (
	"backend/internal/models"
	admin "backend/internal/repository/admin"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

// GET /api/admin/categories
func GetAllCategories(w http.ResponseWriter, r *http.Request) {
	cats, err := admin.GetAllCategories()
	if err != nil {
		http.Error(w, "Failed to fetch categories", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"data": cats})
}

// GET /api/admin/categories/{id}
func GetCategoryDetail(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid category ID", http.StatusBadRequest)
		return
	}

	cat, err := admin.GetCategoryDetail(uint(id))
	if err != nil {
		http.Error(w, "Category not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cat)
}

// POST /api/admin/categories
func CreateCategory(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name      string `json:"name"`
		GroupName string `json:"group_name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	category := models.Category{
		Name:      req.Name,
		GroupName: req.GroupName,
	}
	created, err := admin.CreateCategory(&category)
	if err != nil {
		http.Error(w, "Failed to create category", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(created)
}


// PUT /api/admin/categories/{id}
func EditCategory(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid category ID", http.StatusBadRequest)
		return
	}

	var req struct {
		Name      string `json:"name"`
		GroupName string `json:"group_name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	updated, err := admin.UpdateCategory(uint(id), &models.Category{
		Name:      req.Name,
		GroupName: req.GroupName,
	})
	if err != nil {
		http.Error(w, "Failed to update category", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updated)
}


// DELETE /api/admin/categories/{id}
func DeleteCategory(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid category ID", http.StatusBadRequest)
		return
	}

	if err := admin.DeleteCategory(uint(id)); err != nil {
		http.Error(w, "Failed to delete category", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Category deleted successfully"})
}
