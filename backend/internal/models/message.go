package models

import "time"

type Message struct {
    ID          uint      `gorm:"primaryKey" json:"id"`
    CustomerID  uint      `json:"customer_id"`
    SenderRole  string    `gorm:"type:enum('admin','staff','customer')" json:"sender_role"`
    MessageText string    `json:"message_text"`
    ImageURL    string    `json:"image_url"`
    IsRead      bool      `json:"is_read"`
    CreatedAt   time.Time `json:"created_at"`
}
