package models

import "time"

type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Username     string    `gorm:"type:varchar(255);unique;not null" json:"username"`
	PasswordHash string    `gorm:"column:password_hash;not null" json:"-"`
	Role         string    `gorm:"type:enum('admin','staff','customer');default:'customer'" json:"role"`
	Email        string    `gorm:"type:varchar(255);unique;not null" json:"email"`
	Phone        string    `gorm:"type:varchar(20)" json:"phone"`
	Address      string    `gorm:"type:varchar(255)" json:"address"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	CustomerAddresses []CustomerAddress `gorm:"foreignKey:UserID"`
}
