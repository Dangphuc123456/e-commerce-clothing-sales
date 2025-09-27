package models

import "time"

type InventoryLog struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	VariantID uint      `json:"variant_id"`
	ChangeType string   `gorm:"type:enum('import','sale','return','adjust')" json:"change_type"`
	Quantity  int       `json:"quantity"`
	Note      string    `json:"note"`
	CreatedAt time.Time `json:"created_at"`

	Variant ProductVariant `gorm:"foreignKey:VariantID"`
}
