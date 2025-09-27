package customer

import (
	"backend/configs"
	"backend/internal/models"
	"errors"          
	"gorm.io/gorm" 
)

// Lấy đơn hàng của khách hàng theo trạng thái
func GetCustomerOrdersByStatus(customerID uint, statuses []string) ([]models.Order, error) {
	var orders []models.Order
	err := configs.DB.
		Where("customer_id = ? AND status IN ?", customerID, statuses).
		Preload("Items").
		Preload("Customer").
		Preload("Staff").
		Order("created_at desc").
		Find(&orders).Error
	if err != nil {
		return nil, err
	}

	// Gán địa chỉ mặc định cho mỗi đơn
	for i := range orders {
		var address models.CustomerAddress
		if err := configs.DB.Where("user_id = ? AND is_default = ?", orders[i].CustomerID, true).First(&address).Error; err == nil {
			orders[i].CustomerAddress = &address
		}
	}

	return orders, nil
}
func CancelOrder(orderID, customerID uint, reason string) error {
	var order models.Order

	// Kiểm tra đơn có tồn tại và thuộc khách này
	if err := configs.DB.Preload("Items").Where("id = ? AND customer_id = ?", orderID, customerID).First(&order).Error; err != nil {
		return errors.New("order not found")
	}

	// Chỉ cho hủy khi pending hoặc confirmed
	if order.Status != "pending" && order.Status != "confirmed" {
		return errors.New("cannot cancel this order")
	}

	// Transaction: update order + lưu lý do hủy + trả lại stock
	return configs.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Update trạng thái đơn
		if err := tx.Model(&order).Update("status", "cancelled").Error; err != nil {
			return err
		}

		// 2. Lưu lý do hủy
		cancel := models.OrderCancellation{
			OrderID:    order.ID,
			CustomerID: customerID,
			Reason:     reason,
		}
		if err := tx.Create(&cancel).Error; err != nil {
			return err
		}

		// 3. Trả lại stock cho ProductVariant
		for _, item := range order.Items {
			if err := tx.Model(&models.ProductVariant{}).
				Where("id = ?", item.VariantID).
				Update("stock", gorm.Expr("stock + ?", item.Quantity)).Error; err != nil {
				return err
			}
		}

		return nil
	})
}