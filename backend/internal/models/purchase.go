package models

import "time"

type Purchase struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	SupplierID uint     `json:"supplier_id"`
	StaffID   uint      `json:"staff_id"`
	VariantID uint      `json:"variant_id"`
	Quantity  int       `json:"quantity"`
	CostPrice float64   `json:"cost_price"`
	Total      float64   `gorm:"->" json:"total"`
	CreatedAt time.Time `json:"created_at"`

	// Quan hệ
	Supplier Supplier       `gorm:"foreignKey:SupplierID" json:"supplier"`
	Staff    User           `gorm:"foreignKey:StaffID" json:"staff"`
	Variant  ProductVariant `gorm:"foreignKey:VariantID" json:"variant"`
}
