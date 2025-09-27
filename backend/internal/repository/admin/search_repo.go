package admin

import (
    "backend/configs"
    "backend/internal/models"
    "fmt"
)

func SearchAll(keyword string) ([]models.SearchResult, error) {
    var results []models.SearchResult

    // Sản phẩm
    var products []struct{ ID int; Name string; Slug string }
    configs.DB.Raw("SELECT id, name,slug FROM products WHERE name LIKE ?", "%"+keyword+"%").Scan(&products)
    for _, p := range products {
        results = append(results, models.SearchResult{ID: p.ID, Name: p.Name,Slug: p.Slug, Type: "product"})
    }

    // Nhà cung cấp
    var suppliers []struct{ ID int; Name string; Slug string }
    configs.DB.Raw("SELECT id, name,slug FROM suppliers WHERE name LIKE ?", "%"+keyword+"%").Scan(&suppliers)
    for _, s := range suppliers {
        results = append(results, models.SearchResult{ID: s.ID, Name: s.Name,Slug: s.Slug, Type: "supplier"})
    }

    // Loại (category)
    var categories []struct{ ID int; Name string; Slug string }
    configs.DB.Raw("SELECT id, name,slug FROM categories WHERE name LIKE ?", "%"+keyword+"%").Scan(&categories)
    for _, c := range categories {
        results = append(results, models.SearchResult{ID: c.ID, Name: c.Name,Slug: c.Slug, Type: "category"})
    }

    // Đơn hàng (order)
    var orders []struct{ ID int }
    configs.DB.Raw("SELECT id FROM orders WHERE id LIKE ?", "%"+keyword+"%").Scan(&orders)
    for _, o := range orders {
        results = append(results, models.SearchResult{ID: o.ID, Name: fmt.Sprintf("Order #%d", o.ID), Type: "order"})
    }

    // Phiếu nhập (purchase)
    var purchases []struct{ ID int }
    configs.DB.Raw("SELECT id FROM purchases WHERE id LIKE ?", "%"+keyword+"%").Scan(&purchases)
    for _, p := range purchases {
        results = append(results, models.SearchResult{ID: p.ID, Name: fmt.Sprintf("Purchase #%d", p.ID), Type: "purchase"})
    }

    return results, nil
}