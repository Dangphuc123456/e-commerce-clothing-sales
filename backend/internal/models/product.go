package models

import "time"

type Product struct {
	ID              uint    `gorm:"primaryKey" json:"id"`
	Name            string  `gorm:"not null" json:"name"`
	Description     string  `json:"description"`
	CategoryID      uint    `json:"category_id"`
	Image           string  `json:"image"`
	Price           float64 `json:"price"`
	Discount        float64 `json:"discount"`
	Slug            string  `gorm:"unique;not null" json:"slug"`
	DiscountedPrice float64 `json:"discounted_price" gorm:"->"`

	CreatedAt time.Time `json:"created_at"`

	Category Category         `gorm:"foreignKey:CategoryID"`
	Variants []ProductVariant `gorm:"foreignKey:ProductID"`
}
