package customer

import (
	"encoding/json"
	"net/http"
	"strconv"
    "github.com/gorilla/mux"

	repo "backend/internal/repository/customer"
)

func GetAllProducts(w http.ResponseWriter, r *http.Request) {
	products, err := repo.GetAllProducts()
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	json.NewEncoder(w).Encode(products)
}

func GetLatestProducts(w http.ResponseWriter, r *http.Request) {
	limitStr := r.URL.Query().Get("limit")
	limit, _ := strconv.Atoi(limitStr)
	if limit == 0 {
		limit = 10
	}
	products, err := repo.GetLatestProducts(limit)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	json.NewEncoder(w).Encode(products)
}


func GetRandomProducts(w http.ResponseWriter, r *http.Request) {
	group := r.URL.Query().Get("group")
	products, err := repo.GetRandomProducts(group)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	json.NewEncoder(w).Encode(products)
}
func GetProductDetail(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	slug := vars["slug"]
	if slug == "" {
		http.Error(w, "Missing slug", http.StatusBadRequest)
		return
	}

	product, err := repo.GetProductBySlug(slug)
	if err != nil {
		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}
func GetBestSellersHandler(w http.ResponseWriter, r *http.Request) {
    limitStr := r.URL.Query().Get("limit")
    limit := 6
    if limitStr != "" {
        if val, err := strconv.Atoi(limitStr); err == nil && val > 0 {
            limit = val
        }
    }
    bestSellers, err := repo.GetBestSellers(limit) 

    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "best_sellers": bestSellers,
    })
}
func GetDiscountedProductsHandler(w http.ResponseWriter, r *http.Request) {
	products, err := repo.GetDiscountedProducts()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"discounted_products": products,
	})
}
