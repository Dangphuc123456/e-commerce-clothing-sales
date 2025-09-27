package models

type OrderItem struct {
	ID        uint    `gorm:"primaryKey" json:"id"`
	OrderID   uint    `json:"order_id"`
	ProductName string  `json:"product_name"`
	VariantID uint    `json:"variant_id"`
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`

	SKU   string `json:"sku"`
	Image string `json:"image"`
	Color string `json:"color"`
	Size  string `json:"size"`

	Order   Order          `gorm:"foreignKey:OrderID"`
	Variant ProductVariant `gorm:"foreignKey:VariantID"`
}
