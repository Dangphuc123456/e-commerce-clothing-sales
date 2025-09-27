package customer

import (
	"backend/configs"
	"backend/internal/models"
)

// Gợi ý sản phẩm (autocomplete)
func SearchSuggestions(query string, limit int) ([]models.Product, error) {
	var products []models.Product
	err := configs.DB.
		Where("name LIKE ?", "%"+query+"%").
		Select("id, name, slug, image, price, discount").
		Limit(limit).
		Find(&products).Error
	return products, err
}

// Tìm kiếm toàn bộ sản phẩm (SearchPage)
func SearchProducts(query string) ([]models.Product, error) {
	var products []models.Product
	err := configs.DB.Preload("Category").Preload("Variants").
		Where("name LIKE ?", "%"+query+"%").
		Find(&products).Error
	return products, err
}
