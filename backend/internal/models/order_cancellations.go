package models

import "time"

type OrderCancellation struct {
    ID        uint      `gorm:"primaryKey" json:"id"`
    OrderID   uint      `json:"order_id"`
    CustomerID uint     `json:"customer_id"`  
    Reason    string    `json:"reason"`      
    CreatedAt time.Time `json:"created_at"`

    Order    Order `gorm:"foreignKey:OrderID"`
    Customer User  `gorm:"foreignKey:CustomerID"`
}
