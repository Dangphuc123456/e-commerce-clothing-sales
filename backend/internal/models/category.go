package models

import "time"

type Category struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"unique;not null" json:"name"`
	Slug      string    `gorm:"unique;not null" json:"slug"`
	GroupName string    `gorm:"type:enum('Quần Nam','Áo Nam','Đồ Thể Thao','Đồ Bộ','Phụ Kiện');not null;default:'Đồ nam'" json:"group_name"`
	CreatedAt time.Time `json:"created_at"`

	Products []Product `gorm:"foreignKey:CategoryID"`
}
