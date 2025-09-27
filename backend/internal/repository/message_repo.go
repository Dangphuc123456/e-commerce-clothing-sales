package repository

import (
	"backend/internal/models"
	"gorm.io/gorm"
)

type MessageRepo struct {
	DB *gorm.DB
}

func NewMessageRepo(db *gorm.DB) *MessageRepo {
	return &MessageRepo{DB: db}
}

func (r *MessageRepo) SaveMessage(msg *models.Message) error {
	return r.DB.Create(msg).Error
}

func (r *MessageRepo) GetMessagesByCustomer(customerID uint) ([]models.Message, error) {
	var msgs []models.Message
	err := r.DB.Where("customer_id = ?", customerID).Order("created_at asc").Find(&msgs).Error
	return msgs, err
}

func (r *MessageRepo) GetRecentMessages(limit int) ([]models.Message, error) {
	var msgs []models.Message
	if limit <= 0 {
		limit = 200
	}
	err := r.DB.Order("created_at desc").Limit(limit).Find(&msgs).Error
	if err == nil {
		for i, j := 0, len(msgs)-1; i < j; i, j = i+1, j-1 {
			msgs[i], msgs[j] = msgs[j], msgs[i]
		}
	}
	return msgs, err
}

type UnreadSummary struct {
	CustomerID  uint `json:"customer_id"`
	UnreadCount int  `json:"unread_count"`
}

func (r *MessageRepo) GetUnreadSummary() ([]UnreadSummary, error) {
	var result []UnreadSummary
	err := r.DB.Model(&models.Message{}).
		Select("customer_id, COUNT(*) as unread_count").
		Where("is_read = ? AND sender_role = ?", false, "customer").
		Group("customer_id").
		Scan(&result).Error
	return result, err
}

func (r *MessageRepo) MarkAsRead(customerID uint) error {
	return r.DB.Model(&models.Message{}).
		Where("customer_id = ? AND sender_role = ? AND is_read = ?", customerID, "customer", false).
		Update("is_read", true).Error
}
// CustomerMessageSummary dùng để map dữ liệu query
type CustomerMessageSummary struct {
	CustomerID    uint   `json:"customer_id"`
	CustomerName  string `json:"customer_name"`
	UnreadCount   int    `json:"unread_count"`
	LastMessage   string `json:"last_message"`
	LastMessageAt string `json:"last_message_at"`
}

// Lấy danh sách khách hàng có tin nhắn, ưu tiên unread trước rồi theo thời gian
func (r *MessageRepo) GetCustomersWithMessages() ([]CustomerMessageSummary, error) {
	var results []CustomerMessageSummary

	sql := `
		SELECT 
			m.customer_id,
			u.username AS customer_name,
			SUM(CASE WHEN m.sender_role = 'customer' AND m.is_read = false THEN 1 ELSE 0 END) AS unread_count,
			MAX(m.created_at) AS last_message_at,
			SUBSTRING_INDEX(
				MAX(CONCAT(m.created_at, '||',
					CASE 
						WHEN m.message_text IS NOT NULL AND m.message_text <> '' 
							THEN m.message_text
						ELSE CONCAT('[Image]: ', m.image_url)
					END
				)), '||', -1
			) AS last_message
		FROM messages m
		JOIN users u ON u.id = m.customer_id
		GROUP BY m.customer_id, u.username
		ORDER BY unread_count DESC, last_message_at DESC
	`

	err := r.DB.Raw(sql).Scan(&results).Error
	return results, err
}


