package customer

import (
	"encoding/json"
	"net/http"
	"strconv"

	repo "backend/internal/repository/customer"
)

// GET /api/customer/search/suggest?q=...
func SearchSuggestions(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if q == "" {
		http.Error(w, "Missing query", http.StatusBadRequest)
		return
	}

	limitStr := r.URL.Query().Get("limit")
	limit := 5
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			limit = l
		}
	}

	products, err := repo.SearchSuggestions(q, limit)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

// GET /api/customer/search?q=...
func SearchProducts(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if q == "" {
		http.Error(w, "Missing query", http.StatusBadRequest)
		return
	}

	products, err := repo.SearchProducts(q)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}
