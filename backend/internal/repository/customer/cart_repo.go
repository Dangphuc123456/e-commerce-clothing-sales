package customer

import (
    "backend/configs"
    "backend/internal/models"
    "errors"
	"gorm.io/gorm"
)

// Lấy giỏ hàng theo user_id
func GetCartByUser(userID uint) ([]models.CartItem, error) {
    var items []models.CartItem
    err := configs.DB.
        Where("user_id = ?", userID).
        Find(&items).Error
    return items, err
}

// Thêm sản phẩm vào giỏ + trừ stock
func AddToCart(item *models.CartItem) error {
    var variant models.ProductVariant

    // ✅ Nếu VariantID = 0 thì tìm variant đầu tiên theo ProductName
    if item.VariantID == 0 {
        if err := configs.DB.
            Joins("JOIN products ON products.id = product_variants.product_id").
            Where("products.name = ?", item.ProductName).
            Order("product_variants.id ASC").
            First(&variant).Error; err != nil {
            return errors.New("Không tìm thấy variant cho sản phẩm: " + item.ProductName)
        }
        item.VariantID = uint64(variant.ID)
        item.SKU = &variant.SKU
        item.Color = &variant.Color
        item.Size = &variant.Size
    } else {
        if err := configs.DB.First(&variant, item.VariantID).Error; err != nil {
            return errors.New("Variant không tồn tại")
        }
    }

    // ✅ Kiểm tra stock
    if variant.Stock < item.Quantity {
        return errors.New("Số lượng trong kho không đủ")
    }

    // ✅ Kiểm tra xem user đã có variant này trong giỏ chưa
    var existing models.CartItem
    if err := configs.DB.
        Where("user_id = ? AND variant_id = ?", item.UserID, item.VariantID).
        First(&existing).Error; err == nil {
        // đã tồn tại → cộng dồn số lượng
        delta := item.Quantity
        if variant.Stock < delta {
            return errors.New("Số lượng trong kho không đủ")
        }
        existing.Quantity += delta
        variant.Stock -= delta

        if err := configs.DB.Save(&variant).Error; err != nil {
            return err
        }
        return configs.DB.Save(&existing).Error
    }

    // chưa có trong giỏ → tạo mới
    variant.Stock -= item.Quantity
    if err := configs.DB.Save(&variant).Error; err != nil {
        return err
    }
    return configs.DB.Create(item).Error
}


// Cập nhật số lượng + sync stock
func UpdateCartItem(userID, variantID uint64, newQuantity int) error {
    var cartItem models.CartItem
    if err := configs.DB.
        Where("user_id = ? AND variant_id = ?", userID, variantID).
        First(&cartItem).Error; err != nil {
        return errors.New("Item không tồn tại trong giỏ")
    }

    var variant models.ProductVariant
    if err := configs.DB.First(&variant, variantID).Error; err != nil {
        return errors.New("Variant không tồn tại")
    }

    delta := newQuantity - cartItem.Quantity
    if delta > 0 {
        // tăng số lượng giỏ → trừ stock
        if variant.Stock < delta {
            return errors.New("Số lượng trong kho không đủ")
        }
        variant.Stock -= delta
    } else if delta < 0 {
        // giảm số lượng giỏ → trả lại stock
        variant.Stock += -delta
    }

    if err := configs.DB.Save(&variant).Error; err != nil {
        return err
    }

    cartItem.Quantity = newQuantity
    return configs.DB.Save(&cartItem).Error
}

func RemoveCartItem(userID, variantID uint64) error {
    return configs.DB.Transaction(func(tx *gorm.DB) error {
        var cartItem models.CartItem
        if err := tx.Where("user_id = ? AND variant_id = ?", userID, variantID).
            Take(&cartItem).Error; err != nil {
            if err == gorm.ErrRecordNotFound {
                return nil // item không tồn tại, không báo lỗi
            }
            return err
        }

        // Trả stock
        if err := tx.Model(&models.ProductVariant{}).
            Where("id = ?", variantID).
            UpdateColumn("stock", gorm.Expr("stock + ?", cartItem.Quantity)).Error; err != nil {
            return err
        }

        // Xóa cart item
        if err := tx.Where("user_id = ? AND variant_id = ?", userID, variantID).
            Delete(&models.CartItem{}).Error; err != nil {
            return err
        }

        return nil
    })
}

// Xoá hết giỏ hàng → trả stock tất cả, dùng transaction
func ClearCart(userID uint64) error {
    return configs.DB.Transaction(func(tx *gorm.DB) error {
        var items []models.CartItem
        if err := tx.Where("user_id = ?", userID).Find(&items).Error; err != nil {
            return err
        }

        for _, item := range items {
            if err := tx.Model(&models.ProductVariant{}).
                Where("id = ?", item.VariantID).
                UpdateColumn("stock", gorm.Expr("stock + ?", item.Quantity)).Error; err != nil {
                return err
            }
        }

        if err := tx.Where("user_id = ?", userID).Delete(&models.CartItem{}).Error; err != nil {
            return err
        }

        return nil
    })
}