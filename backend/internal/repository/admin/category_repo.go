package admin

import (
	"backend/configs"
	"backend/internal/models"
	 "github.com/gosimple/slug"
)

// GetAllCategories trả về danh sách (không include soft-deleted)
func GetAllCategories() ([]models.Category, error) {
	var categories []models.Category
	if err := configs.DB.Find(&categories).Error; err != nil {
		return nil, err
	}
	return categories, nil
}

// GetCategoryDetail lấy 1 category kèm products (nếu cần)
func GetCategoryDetail(id uint) (*models.Category, error) {
	var category models.Category
	if err := configs.DB.Preload("Products").First(&category, id).Error; err != nil {
		return nil, err
	}
	return &category, nil
}

// CreateCategory tạo mới
func CreateCategory(c *models.Category) (*models.Category, error) {
    c.Slug = slug.Make(c.Name) // Tự động tạo slug từ name
    if err := configs.DB.Create(c).Error; err != nil {
        return nil, err
    }
    return c, nil
}

// UpdateCategory cập nhật tên (hoặc các trường khác)
func UpdateCategory(id uint, newData *models.Category) (*models.Category, error) {
	var category models.Category
	if err := configs.DB.First(&category, id).Error; err != nil {
		return nil, err
	}

	// Cập nhật những field cho phép
	category.Name = newData.Name
	category.GroupName = newData.GroupName
    category.Slug = slug.Make(newData.Name)
	if err := configs.DB.Save(&category).Error; err != nil {
		return nil, err
	}
	return &category, nil
}


// DeleteCategory xóa (soft-delete). Nếu muốn hard-delete dùng Unscoped().Delete(...)
func DeleteCategory(id uint) error {
	return configs.DB.Delete(&models.Category{}, id).Error
}
