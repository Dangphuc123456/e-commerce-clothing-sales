package models

import "time"

type Order struct {
	ID            uint        `gorm:"primaryKey" json:"id"`
	CustomerID    uint        `json:"customer_id"`
	StaffID       *uint       `json:"staff_id"` 
	Status        string      `gorm:"type:enum('pending','confirmed','shipped','completed','cancelled');default:'pending'" json:"status"`
	PaymentMethod string      `gorm:"type:enum('cod','vnpay');default:'cod'" json:"payment_method"`
	TxnRef        string      `json:"txn_ref"`  
	Total         float64     `json:"total"`
	CreatedAt     time.Time   `json:"created_at"`

	Customer User         `gorm:"foreignKey:CustomerID"` 
	Staff    *User        `gorm:"foreignKey:StaffID"`    
	Items    []OrderItem  `gorm:"foreignKey:OrderID"`   
	CustomerAddress *CustomerAddress `gorm:"-" json:"customer_address,omitempty"` 
}
