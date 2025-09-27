package customer

import (
	"backend/internal/repository/customer"
	"encoding/json"
	"net/http"
	
)

// GET /api/customer/categories?group_name=Đồ nam
func GetCategoriesByGroup(w http.ResponseWriter, r *http.Request) {
	groupName := r.URL.Query().Get("group_name")
	if groupName == "" {
		http.Error(w, "Missing group_name param", http.StatusBadRequest)
		return
	}

	cats, err := customer.GetCategoriesByGroup(groupName)
	if err != nil {
		http.Error(w, "Failed to fetch categories", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"group_name": groupName,
		"categories": cats,
	})
}

// GET /api/customer/categories/products?slug=bo-vest
func GetProductsByCategory(w http.ResponseWriter, r *http.Request) {
	slug := r.URL.Query().Get("slug")
	if slug == "" {
		http.Error(w, "Missing slug param", http.StatusBadRequest)
		return
	}

	products, err := customer.GetProductsByCategorySlug(slug)
	if err != nil {
		http.Error(w, "Failed to fetch products", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

