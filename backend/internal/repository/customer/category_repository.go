package customer

import (
	"backend/configs"
	"backend/internal/models"
)

// Lấy tất cả category theo group_name
func GetCategoriesByGroup(groupName string) ([]models.Category, error) {
	var categories []models.Category
	if err := configs.DB.Where("group_name = ?", groupName).Find(&categories).Error; err != nil {
		return nil, err
	}
	return categories, nil
}

// Lấy tất cả sản phẩm theo category_slug
func GetProductsByCategorySlug(slug string) ([]models.Product, error) {
	var category models.Category
	if err := configs.DB.Where("slug = ?", slug).First(&category).Error; err != nil {
		return nil, err
	}

	var products []models.Product
	if err := configs.DB.Where("category_id = ?", category.ID).Find(&products).Error; err != nil {
		return nil, err
	}
	return products, nil
}

