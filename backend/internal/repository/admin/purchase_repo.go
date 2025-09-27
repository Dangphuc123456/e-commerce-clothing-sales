package admin

import (
	"backend/configs"
	"backend/internal/models"
	"errors"
    "strconv"
	
)

// Get all purchases (global)
func GetAllPurchases() ([]models.Purchase, error) {
	var purchases []models.Purchase
	err := configs.DB.Preload("Supplier").Preload("Staff").Preload("Variant").Find(&purchases).Error
	return purchases, err
}

// Get purchases by supplier
func GetPurchasesBySupplier(supplierID uint) ([]models.Purchase, error) {
	var purchases []models.Purchase
	err := configs.DB.Preload("Variant").Preload("Staff").Where("supplier_id = ?", supplierID).Find(&purchases).Error
	return purchases, err
}

func CreatePurchase(p *models.Purchase) (*models.Purchase, error) {
    // KHÔNG set hoặc truyền p.Total khi tạo purchase
    if err := configs.DB.Omit("Total").Create(p).Error; err != nil {
        return nil, err
    }

    // Lấy variant
    var variant models.ProductVariant
    if err := configs.DB.First(&variant, p.VariantID).Error; err != nil {
        return nil, errors.New("variant not found")
    }

    // Cập nhật stock
    variant.Stock += p.Quantity
    if err := configs.DB.Save(&variant).Error; err != nil {
        return nil, err
    }

    // Tạo InventoryLog
    log := models.InventoryLog{
        VariantID:  p.VariantID,
        ChangeType: "import",
        Quantity:   p.Quantity,
        Note:       "Auto created from purchase #" + strconv.Itoa(int(p.ID)),
    }
    if err := configs.DB.Create(&log).Error; err != nil {
        return nil, err
    }

    return p, nil
}


func UpdatePurchase(id uint, newData *models.Purchase) (*models.Purchase, error) {
    var p models.Purchase
    if err := configs.DB.First(&p, id).Error; err != nil {
        return nil, err
    }

    // Lấy variant cũ
    var variant models.ProductVariant
    if err := configs.DB.First(&variant, p.VariantID).Error; err != nil {
        return nil, errors.New("variant not found")
    }

    oldQuantity := p.Quantity

    // Nếu variantID thay đổi, rollback stock của variant cũ
    if p.VariantID != newData.VariantID {
        variant.Stock -= oldQuantity
        if err := configs.DB.Save(&variant).Error; err != nil {
            return nil, err
        }

        // Ghi log rollback
        logRollback := models.InventoryLog{
            VariantID:  variant.ID,
            ChangeType: "adjust",
            Quantity:   variant.Stock,
            Note:       "Rollback stock from purchase update #" + strconv.Itoa(int(p.ID)),
        }
        configs.DB.Create(&logRollback)

        // Update variant mới
        var newVariant models.ProductVariant
        if err := configs.DB.First(&newVariant, newData.VariantID).Error; err != nil {
            return nil, errors.New("new variant not found")
        }
        newVariant.Stock += newData.Quantity
        if err := configs.DB.Save(&newVariant).Error; err != nil {
            return nil, err
        }

        // Log update
        logNew := models.InventoryLog{
            VariantID:  newVariant.ID,
            ChangeType: "import",
            Quantity:   newData.Quantity,
            Note:       "Update purchase #" + strconv.Itoa(int(p.ID)),
        }
        configs.DB.Create(&logNew)
    } else {
        // Variant giữ nguyên, chỉ tính chênh lệch
        diff := int(newData.Quantity) - int(oldQuantity)
        variant.Stock += diff
        if err := configs.DB.Save(&variant).Error; err != nil {
            return nil, err
        }

        log := models.InventoryLog{
            VariantID:  variant.ID,
            ChangeType: "adjust",
            Quantity:   diff,
            Note:       "Update purchase #" + strconv.Itoa(int(p.ID)),
        }
        configs.DB.Create(&log)
    }

    // Update các field khác
    p.VariantID = newData.VariantID
    p.Quantity = newData.Quantity
    p.CostPrice = newData.CostPrice
    p.StaffID = newData.StaffID
    if err := configs.DB.Omit("Total").Save(&p).Error; err != nil {
        return nil, err
    }

    return &p, nil
}

func DeletePurchase(id uint) error {
    var p models.Purchase
    if err := configs.DB.First(&p, id).Error; err != nil {
        return err
    }

    // Lấy variant
    var variant models.ProductVariant
    if err := configs.DB.First(&variant, p.VariantID).Error; err != nil {
        return errors.New("variant not found")
    }

    // Trừ stock
    variant.Stock -= p.Quantity
    if variant.Stock < 0 {
        variant.Stock = 0 // tránh âm
    }
    if err := configs.DB.Save(&variant).Error; err != nil {
        return err
    }

    // Ghi log
    log := models.InventoryLog{
        VariantID:  variant.ID,
        ChangeType: "adjust",
        Quantity:   -p.Quantity,
        Note:       "Deleted purchase #" + strconv.Itoa(int(p.ID)),
    }
    configs.DB.Create(&log)

    // Xóa purchase
    return configs.DB.Delete(&models.Purchase{}, id).Error
}
