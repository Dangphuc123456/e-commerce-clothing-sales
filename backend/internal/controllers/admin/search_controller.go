package admin

import (
    "encoding/json"
    "net/http"
    "backend/internal/repository/admin"
)

func SearchAll(w http.ResponseWriter, r *http.Request) {
    keyword := r.URL.Query().Get("q")
    if len(keyword) == 0 {
        json.NewEncoder(w).Encode([]interface{}{}) // trả về mảng rỗng nếu không có keyword
        return
    }
    results, err := admin.SearchAll(keyword)
    if err != nil {
        http.Error(w, "Search failed", http.StatusInternalServerError)
        return
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(results)
}