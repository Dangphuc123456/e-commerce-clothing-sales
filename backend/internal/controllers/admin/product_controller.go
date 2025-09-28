package admin

import (
	"backend/internal/models"
	admin "backend/internal/repository/admin"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

// ================= PRODUCTS ==================

// GET ALL PRODUCTS
func GetAllProducts(w http.ResponseWriter, r *http.Request) {
	products, err := admin.GetAllProducts()
	if err != nil {
		http.Error(w, "Failed to fetch products", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]interface{}{"data": products})
}

// GET PRODUCT DETAIL
func GetProductDetail(w http.ResponseWriter, r *http.Request) {
	idParam := mux.Vars(r)["id"]
	id, err := strconv.Atoi(idParam)
	if err != nil {
		http.Error(w, "Invalid product ID", http.StatusBadRequest)
		return
	}
	product, err := admin.GetProductDetail(uint(id))
	if err != nil {
		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(product)
}

// CREATE PRODUCT
func CreateProduct(w http.ResponseWriter, r *http.Request) {
	var req models.Product
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	product, err := admin.CreateProduct(&req)
	if err != nil {
		http.Error(w, "Failed to create product", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(product)
}

// UPDATE PRODUCT
func EditProduct(w http.ResponseWriter, r *http.Request) {
	idParam := mux.Vars(r)["id"]
	id, _ := strconv.Atoi(idParam)
	var req models.Product
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	product, err := admin.UpdateProduct(uint(id), &req)
	if err != nil {
		http.Error(w, "Failed to update product", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(product)
}

// DELETE PRODUCT
func DeleteProduct(w http.ResponseWriter, r *http.Request) {
	idParam := mux.Vars(r)["id"]
	id, _ := strconv.Atoi(idParam)
	if err := admin.DeleteProduct(uint(id)); err != nil {
		http.Error(w, "Failed to delete product", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"message": "Product deleted successfully"})
}

// ================= VARIANTS ==================
func GetVariantsByProduct(w http.ResponseWriter, r *http.Request) {
	idParam := mux.Vars(r)["id"]
	productID, err := strconv.Atoi(idParam)
	if err != nil {
		http.Error(w, "Invalid product ID", http.StatusBadRequest)
		return
	}

	variants, err := admin.GetVariantsByProduct(uint(productID))
	if err != nil {
		http.Error(w, "Failed to fetch variants", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{"data": variants})
}
func GetAllVariants(w http.ResponseWriter, r *http.Request) {
	variants, err := admin.GetAllVariants()
	if err != nil {
		http.Error(w, "Failed to fetch variants", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(variants) 
}

// CREATE VARIANT
func CreateVariant(w http.ResponseWriter, r *http.Request) {
	var req models.ProductVariant
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	variant, err := admin.CreateVariant(&req)
	if err != nil {
		http.Error(w, "Failed to create variant", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(variant)
}

// UPDATE VARIANT
func EditVariant(w http.ResponseWriter, r *http.Request) {
	idParam := mux.Vars(r)["id"]
	id, _ := strconv.Atoi(idParam)
	var req models.ProductVariant
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	variant, err := admin.UpdateVariant(uint(id), &req)
	if err != nil {
		http.Error(w, "Failed to update variant", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(variant)
}

// DELETE VARIANT
func DeleteVariant(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	variantParam := vars["variantId"]
	variantID, err := strconv.Atoi(variantParam)
	if err != nil {
		http.Error(w, "Invalid variant ID", http.StatusBadRequest)
		return
	}

	if err := admin.DeleteVariant(uint(variantID)); err != nil {
		http.Error(w, "Failed to delete variant", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"message": "Variant deleted successfully"})
}

