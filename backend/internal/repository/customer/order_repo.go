// internal/repository/customer/order_repo.go
package customer

import (
    "backend/configs"
    "backend/internal/models"
    "gorm.io/gorm"
    "log"
)

// CreateOrder: lưu order + items + address mới
func CreateOrder(order *models.Order, address *models.CustomerAddress, userID uint, clearCart bool) error {
    return configs.DB.Transaction(func(tx *gorm.DB) error {
        // 1. Tạo order
        if err := tx.Omit("Items").Create(order).Error; err != nil {
            return err
        }

        // 2. Tạo items
        for i := range order.Items {
            order.Items[i].ID = 0
            order.Items[i].OrderID = order.ID
            if err := tx.Create(&order.Items[i]).Error; err != nil {
                return err
            }
        }

        // 3. Lưu address mới (dùng user_id)
        address.UserID = order.CustomerID
        address.IsDefault = true
        if err := tx.Create(address).Error; err != nil {
            return err
        }

        // 4. Clear cart nếu COD
        if clearCart {
            if err := tx.Exec("DELETE FROM cart_items WHERE user_id = ?", userID).Error; err != nil {
                return err
            }
        }

        return nil
    })
}

// GetOrderByTxnRef: lấy order + items + customer, gắn thêm address
func GetOrderByTxnRef(txnRef string) (*models.Order, error) {
    var order models.Order
    if err := configs.DB.
        Preload("Items").
        Preload("Customer").
        Where("txn_ref = ?", txnRef).
        First(&order).Error; err != nil {
        return nil, err
    }

    // lấy address mới nhất của customer
    var addr models.CustomerAddress
    if err := configs.DB.
        Where("user_id = ?", order.CustomerID).
        Order("created_at DESC").
        First(&addr).Error; err == nil {
        order.CustomerAddress= &addr 
    }

    return &order, nil
}

// GetOrdersByCustomer: list orders + gắn address thủ công
func GetOrdersByCustomer(customerID uint) ([]models.Order, error) {
    var orders []models.Order
    if err := configs.DB.
        Preload("Items").
        Where("customer_id = ?", customerID).
        Order("created_at desc").
        Find(&orders).Error; err != nil {
        log.Println("Failed to get customer orders:", err)
        return nil, err
    }

    // lấy address mới nhất và gắn cho từng order
    var addr models.CustomerAddress
    if err := configs.DB.
        Where("user_id = ?", customerID).
        Order("created_at DESC").
        First(&addr).Error; err == nil {
        for i := range orders {
            orders[i].CustomerAddress= &addr 
        }
    }

    return orders, nil
}
// UpdateOrderStatus: cập nhật trạng thái đơn hàng
func UpdateOrderStatus(orderID uint, status string) error {
    return configs.DB.Model(&models.Order{}).
        Where("id = ?", orderID).
        Update("status", status).Error
}

// ClearCartAfterPayment: xoá cart sau khi thanh toán thành công
func ClearCartAfterPayment(userID uint) (int64, error) {
    res := configs.DB.Exec("DELETE FROM cart_items WHERE user_id = ?", userID)
    return res.RowsAffected, res.Error
}
