package models

import "time"

type Supplier struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	Phone     string    `json:"phone"`
	Email     string    `json:"email"`
	Address   string    `json:"address"`
	Slug      string    `gorm:"unique;not null" json:"slug"`
	CreatedAt time.Time `json:"created_at"`

	Purchases []Purchase `gorm:"foreignKey:SupplierID"`
}
