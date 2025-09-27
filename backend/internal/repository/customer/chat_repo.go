package customer

import (
	"fmt"
	"strings"

	"backend/configs"
	"backend/internal/models"
)

type ChatRepository struct{}

func NewChatRepository() *ChatRepository {
	return &ChatRepository{}
}

func (r *ChatRepository) GetStoreHours() string {
	return "Cửa hàng mở cửa từ 8h sáng đến 22h tối hàng ngày."
}

// FindProducts: improved search using OR between keywords and optional category/price filters.
// Added a relevance score so sản phẩm có keyword trong name được ưu tiên hơn description.
func (r *ChatRepository) FindProducts(category string, keywords []string, minPrice, maxPrice float64) ([]models.Product, error) {
	var products []models.Product
	query := configs.DB.Model(&models.Product{})

	// join category only if category filter supplied
	if category != "" {
		// Nếu truyền slug (ví dụ "ao-polo") thì match slug; vẫn giữ fallback name LIKE cho những category khác
		query = query.Joins("JOIN categories ON categories.id = products.category_id").
			Where("categories.slug = ? OR categories.name LIKE ?", category, "%"+category+"%")
	}

	// price filter
	if minPrice > 0 {
		query = query.Where("products.price >= ?", minPrice)
	}
	if maxPrice > 0 {
		query = query.Where("products.price <= ?", maxPrice)
	}

	// if keywords -> build OR clauses across name and description and compute relevance
	if len(keywords) > 0 {
		clauses := []string{}
		args := []interface{}{}
		// for relevance expression, we will build CASE WHEN blocks; escape single quotes in keywords
		scoreParts := []string{}
		for _, kw := range keywords {
			kw = strings.TrimSpace(kw)
			if kw == "" {
				continue
			}
			kf := "%" + kw + "%"
			// where clause OR parts
			clauses = append(clauses, "(products.name LIKE ? OR products.description LIKE ?)")
			args = append(args, kf, kf)
			// score: name match => +3, description match => +1
			escaped := strings.ReplaceAll(kw, "'", "''")
			scoreParts = append(scoreParts, fmt.Sprintf("(CASE WHEN products.name LIKE '%%%s%%' THEN 3 WHEN products.description LIKE '%%%s%%' THEN 1 ELSE 0 END)", escaped, escaped))
		}
		if len(clauses) > 0 {
			whereExpr := strings.Join(clauses, " OR ")
			query = query.Where(whereExpr, args...)
			// build score expr
			scoreExpr := strings.Join(scoreParts, " + ")
			query = query.Select("products.*, ("+scoreExpr+") as relevance")
			query = query.Order("relevance DESC")
		}
	} else {
		// no keywords: fallback order by created_at desc
		query = query.Order("products.created_at DESC")
	}

	// limit results
	err := query.Limit(20).Find(&products).Error
	if err != nil {
		return nil, fmt.Errorf("search error: %w", err)
	}
	return products, nil
}
