package customer

import (
    "encoding/json"
    "net/http"
    "strconv"

    "github.com/gorilla/mux"
    repo "backend/internal/repository/customer"
    "backend/internal/models"
)

func GetCart(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    uid, _ := strconv.Atoi(vars["userId"])

    items, err := repo.GetCartByUser(uint(uid))
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    json.NewEncoder(w).Encode(items)
}

func AddToCart(w http.ResponseWriter, r *http.Request) {
    var item models.CartItem
    if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
        http.Error(w, "Invalid body", http.StatusBadRequest)
        return
    }
    if err := repo.AddToCart(&item); err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    json.NewEncoder(w).Encode(item)
}

func UpdateCartItem(w http.ResponseWriter, r *http.Request) {
    var body struct {
        UserID    uint64 `json:"user_id"`
        VariantID uint64 `json:"variantId"`
        Quantity  int    `json:"quantity"`
    }
    if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
        http.Error(w, "Invalid body", http.StatusBadRequest)
        return
    }
    if err := repo.UpdateCartItem(body.UserID, body.VariantID, body.Quantity); err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    w.WriteHeader(http.StatusOK)
}

func RemoveCartItem(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    uid, _ := strconv.ParseUint(vars["userId"], 10, 64)
    variantID, _ := strconv.ParseUint(vars["variantId"], 10, 64)

    if err := repo.RemoveCartItem(uid, variantID); err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    w.WriteHeader(http.StatusOK)
}

func ClearCart(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    uid, _ := strconv.ParseUint(vars["userId"], 10, 64)

    if err := repo.ClearCart(uid); err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    w.WriteHeader(http.StatusOK)
}
