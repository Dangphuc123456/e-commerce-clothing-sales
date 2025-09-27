package models

type ProductVariant struct {
	ID        uint    `gorm:"primaryKey" json:"id"`
	ProductID uint    `json:"product_id"`
	Size      string  `json:"size"`
	Color     string  `json:"color"`
	Price     float64 `json:"price"`
	Stock     int     `json:"stock"`
	SKU       string  `json:"sku"`
    Image       string    `json:"image"`
	Product Product `gorm:"foreignKey:ProductID"`
	OrderItems    []OrderItem    `gorm:"foreignKey:VariantID"`
	Purchases     []Purchase     `gorm:"foreignKey:VariantID"`
	InventoryLogs []InventoryLog `gorm:"foreignKey:VariantID"`

}
