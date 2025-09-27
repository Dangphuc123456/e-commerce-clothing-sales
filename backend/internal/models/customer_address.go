package models

import "time"

type CustomerAddress struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	UserID    uint   `json:"user_id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	Address   string `json:"address"`
	IsDefault bool   `gorm:"default:false" json:"is_default"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	User User `gorm:"foreignKey:UserID"`
}
