package admin

import (
	"backend/configs"
	"backend/internal/models"
	"errors"
)

// GET ALL INVENTORY LOGS
func GetAllInventoryLogs() ([]models.InventoryLog, error) {
	var logs []models.InventoryLog
	err := configs.DB.Preload("Variant").Find(&logs).Error
	return logs, err
}

// GET INVENTORY LOG DETAIL
func GetInventoryLogDetail(id uint) (*models.InventoryLog, error) {
	var log models.InventoryLog
	err := configs.DB.Preload("Variant").First(&log, id).Error
	return &log, err
}

// CREATE INVENTORY LOG + UPDATE STOCK
func CreateInventoryLog(log *models.InventoryLog) (*models.InventoryLog, error) {
	// 1. Lấy variant
	var variant models.ProductVariant
	if err := configs.DB.First(&variant, log.VariantID).Error; err != nil {
		return nil, errors.New("variant not found")
	}

	// 2. Cập nhật stock dựa trên change_type
	switch log.ChangeType {
	case "import", "return":
		variant.Stock += log.Quantity
	case "sale":
		if variant.Stock < log.Quantity {
			return nil, errors.New("insufficient stock")
		}
		variant.Stock -= log.Quantity
	case "adjust":
		variant.Stock = log.Quantity
	default:
		return nil, errors.New("invalid change type")
	}

	// 3. Lưu log và cập nhật variant
	if err := configs.DB.Save(&variant).Error; err != nil {
		return nil, err
	}
	if err := configs.DB.Create(log).Error; err != nil {
		return nil, err
	}
	return log, nil
}

// UPDATE INVENTORY LOG (chỉ note, không thay đổi stock)
func UpdateInventoryLog(id uint, newData *models.InventoryLog) (*models.InventoryLog, error) {
	var log models.InventoryLog
	if err := configs.DB.First(&log, id).Error; err != nil {
		return nil, err
	}
	log.Note = newData.Note
	if err := configs.DB.Save(&log).Error; err != nil {
		return nil, err
	}
	return &log, nil
}

// DELETE INVENTORY LOG (không tự động rollback stock)
func DeleteInventoryLog(id uint) error {
	return configs.DB.Delete(&models.InventoryLog{}, id).Error
}
