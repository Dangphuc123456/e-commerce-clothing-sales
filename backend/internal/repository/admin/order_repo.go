package admin

import (
	"backend/configs"
	"backend/internal/models"
	"gorm.io/gorm"
)

// Lấy tất cả orders, preload Customer, Staff, Items + Variant
func GetAllOrders() ([]models.Order, error) {
	var orders []models.Order
	err := configs.DB.
		Preload("Customer").
		Preload("Staff").
		Preload("Items", func(db *gorm.DB) *gorm.DB {
			return db.Order("id asc").Preload("Variant")
		}).
		Find(&orders).Error
	return orders, err
}

// Lấy chi tiết order theo ID, preload Customer, Staff, Items + Variant
func GetOrderDetail(id uint) (*models.Order, error) {
	var order models.Order
	err := configs.DB.
		Preload("Customer").
		Preload("Staff").
		Preload("Items").
		First(&order, id).Error
	if err != nil {
		return nil, err
	}

	// Lấy địa chỉ của khách hàng
	var address models.CustomerAddress
	err = configs.DB.
		Where("user_id = ? AND is_default = ?", order.CustomerID, true).
		First(&address).Error
	if err == nil {
		order.CustomerAddress = &address 
	}

	return &order, nil
}

// Cập nhật trạng thái + lưu staff_id
func UpdateOrderStatus(id uint, status string, staffID uint) error {
	return configs.DB.Model(&models.Order{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":   status,
			"staff_id": staffID,
		}).Error
}
