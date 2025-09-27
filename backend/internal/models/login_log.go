package models

import "time"

type LoginLog struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `json:"user_id"`
	Role      string    `json:"role"`
	IP        string    `json:"ip"`
	UserAgent string    `json:"user_agent"`
	Status    string    `json:"status"` 
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"created_at"`
}
