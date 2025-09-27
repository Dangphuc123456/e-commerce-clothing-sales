package models

import "time"

type CartItem struct {
    ID              uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
    UserID          uint64    `gorm:"index;not null" json:"userId"`          
    ProductName     string    `gorm:"not null" json:"productName"`    
	VariantID  uint64    `gorm:"not null" json:"variantId"`        
    Quantity        int       `gorm:"not null;default:1" json:"quantity"`
    Price           float64   `gorm:"not null" json:"price"`
    DiscountedPrice *float64  `json:"discountedPrice"`
    SKU             *string   `json:"sku"`
    Color           *string   `json:"color"`
    Size            *string   `json:"size"`
    Image           *string   `json:"image"`
    CreatedAt       time.Time `json:"created_at"`
    UpdatedAt       time.Time `json:"updated_at"`
}

