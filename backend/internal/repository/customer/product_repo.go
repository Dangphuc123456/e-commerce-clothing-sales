package customer

import (
	"math/rand"
	"time"

	"backend/configs"
	"backend/internal/models"
)

func GetAllProducts() ([]models.Product, error) {
	var products []models.Product
	err := configs.DB.Preload("Variants").Find(&products).Error
	return products, err
}

func GetLatestProducts(limit int) ([]models.Product, error) {
	var products []models.Product
	err := configs.DB.Preload("Variants").
		Order("products.created_at DESC").
		Limit(limit).
		Find(&products).Error
	return products, err
}

func GetRandomProducts(group string) ([]models.Product, error) {
    var products []models.Product

    query := configs.DB.Preload("Variants").
        Joins("JOIN categories ON categories.id = products.category_id")

    if group == "vest" {
        query = query.Where("categories.name LIKE ?", "%Bộ Vest%")
    } else if group == "phu-kien" {
        query = query.Where("categories.group_name LIKE ?", "%Phụ Kiện%")
    }

    if err := query.Find(&products).Error; err != nil {
        return nil, err
    }

    if len(products) > 8 {
        rand.Seed(time.Now().UnixNano())
        rand.Shuffle(len(products), func(i, j int) {
            products[i], products[j] = products[j], products[i]
        })
        return products[:8], nil
    }

    return products, nil
}

func GetProductBySlug(slug string) (models.Product, error) {
	var product models.Product
	err := configs.DB.Preload("Variants").Preload("Category").
		Where("slug = ?", slug).
		First(&product).Error
	return product, err
}

type BestSeller struct {
    ProductID   uint    `json:"product_id"`
    ProductName string  `json:"product_name"`
    Slug        string  `json:"slug"`
    TotalSold   int     `json:"total_sold"`
    Image       string  `json:"image"`
    Price       float64 `json:"price"`             
    SoldPrice   float64 `json:"sold_price"`        
}

func GetBestSellers(limit int) ([]BestSeller, error) {
    var bestSellers []BestSeller

    err := configs.DB.Table("order_items").
        Select(`
            products.id as product_id,
            products.name as product_name,
            products.slug as slug,
            products.image as image,
            products.price as price,          -- Giá gốc từ bảng products
            MAX(order_items.price) as sold_price, -- Giá khách mua (đã giảm nếu có)
            SUM(order_items.quantity) as total_sold
        `).
        Joins("JOIN products ON products.name = order_items.product_name").
        Group("products.id, products.name, products.slug, products.image, products.price").
        Order("total_sold DESC").
        Limit(limit).
        Scan(&bestSellers).Error

    return bestSellers, err
}

func GetDiscountedProducts() ([]models.Product, error) {
	var products []models.Product

	err := configs.DB.Preload("Variants").Preload("Category").
		Where("discount > ?", 0).  
		Order("discount DESC").     
		Find(&products).Error      

	return products, err
}
