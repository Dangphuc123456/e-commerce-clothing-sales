package service

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	openai "github.com/sashabaranov/go-openai"
	"backend/internal/models"
	repo "backend/internal/repository/customer"
)

// --- DTOs ---
type ChatRequest struct {
	Message string `json:"message"`
	// optional: you can add History []Message if you want context later
}

type ChatResponse struct {
	Reply    string           `json:"reply"`
	Products []models.Product `json:"products,omitempty"`
}

type IntentResult struct {
	Intent   string   `json:"intent"`
	Category string   `json:"category,omitempty"`
	Keywords []string `json:"keywords,omitempty"`
	PriceMin float64  `json:"price_min,omitempty"`
	PriceMax float64  `json:"price_max,omitempty"`
}

// --- Service struct ---
type ChatService struct {
	repo     *repo.ChatRepository
	aiClient *openai.Client
	model    string
}

// NewChatService khởi tạo ChatService. Nếu CHATBOT_API_KEY rỗng -> aiClient = nil (offline/fallback)
func NewChatService(r *repo.ChatRepository) *ChatService {
	apiKey := strings.TrimSpace(os.Getenv("CHATBOT_API_KEY"))
	model := strings.TrimSpace(os.Getenv("CHATBOT_API_MODEL"))
	if model == "" {
		model = "gpt-3.5-turbo"
	}
	var client *openai.Client
	if apiKey != "" {
		client = openai.NewClient(apiKey)
	} else {
		fmt.Println("DEBUG: CHATBOT_API_KEY empty, running in local-only mode")
		client = nil
	}
	return &ChatService{repo: r, aiClient: client, model: model}
}

// --- Main handler ---
// Thiết kế: gọi model 1 lần để trả natural (model có thể hỏi). Nếu model kèm JSON thì parse và thực hiện action.
// Nếu không có JSON, gọi extractor deterministic để thử trích xuất JSON. Nếu vẫn không có -> trả natural text.
func (s *ChatService) HandleChat(req ChatRequest) (*ChatResponse, error) {
	if strings.TrimSpace(req.Message) == "" {
		return &ChatResponse{Reply: "Vui lòng nhập câu hỏi."}, nil
	}

	// Nếu không có OpenAI client -> fallback nhẹ nhàng
	if s.aiClient == nil {
		// fallback: rule-light để ít nhất trả store hours hoặc tìm nhanh
		return s.handleLocally(req)
	}

	// 1) Primary conversational call (model có thể trả câu hỏi làm rõ hoặc trả JSON + natural)
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	resp, err := s.aiClient.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: s.model,
		Messages: []openai.ChatCompletionMessage{
			{Role: "system", Content: s.systemPromptConversational()},
			{Role: "user", Content: s.buildPromptForConversational(req.Message)},
		},
		MaxTokens:   600,
		Temperature: 0.3,
	})
	if err != nil {
		fmt.Printf("DEBUG: OpenAI primary error: %v\n", err)
		return &ChatResponse{Reply: "Xin lỗi, chatbot đang tạm thời gặp sự cố. Bạn thử lại sau nhé."}, nil
	}

	raw := strings.TrimSpace(resp.Choices[0].Message.Content)
	fmt.Printf("DEBUG: primary raw: %s\n", raw)

	// thử tách JSON nếu model đã kèm
	jsonStr := extractFirstJSON(raw)
	natural := strings.TrimSpace(strings.Replace(raw, jsonStr, "", 1))

	var intent IntentResult
	parsed := false
	if jsonStr != "" {
		if err := json.Unmarshal([]byte(jsonStr), &intent); err == nil {
			parsed = true
		} else {
			fmt.Printf("DEBUG: parse json from primary failed: %v json=%s\n", err, jsonStr)
		}
	}

	// nếu chưa parse được JSON, gọi extractor deterministically
	if !parsed {
		extracted, err := s.tryExtractJSONWithAssistant(ctx, raw)
		if err != nil {
			fmt.Printf("DEBUG: extractor error: %v\n", err)
			// trả natural nếu extractor lỗi
			return &ChatResponse{Reply: raw}, nil
		}
		if strings.TrimSpace(extracted) == "NO_JSON" {
			// assistant không cung cấp JSON — giữ nguyên câu tự nhiên
			return &ChatResponse{Reply: raw}, nil
		}
		if extracted != "" {
			js := extractFirstJSON(extracted)
			if js != "" {
				if err := json.Unmarshal([]byte(js), &intent); err == nil {
					parsed = true
					// natural giữ raw
				} else {
					fmt.Printf("DEBUG: parse json from extractor failed: %v json=%s\n", err, js)
				}
			}
		}
	}

	// nếu parse được intent -> thực hiện hành động
	if parsed {
		// validate & fallback
		intent.Keywords = s.validateKeywords(intent.Keywords, req.Message)
		if len(intent.Keywords) == 0 {
			intent.Keywords = extractKeywords(req.Message)
		}
		if intent.Category == "" {
			intent.Category = detectCategory(req.Message)
		}
		if intent.PriceMin == 0 && intent.PriceMax == 0 {
			pm, px := detectPriceRange(req.Message)
			if pm > 0 || px > 0 {
				intent.PriceMin = pm
				intent.PriceMax = px
			}
		}

		switch intent.Intent {
		case "ask_hours":
			reply := s.repo.GetStoreHours()
			if natural != "" {
				reply = natural
			}
			return &ChatResponse{Reply: reply}, nil
		case "search":
			products, _ := s.repo.FindProducts(intent.Category, intent.Keywords, intent.PriceMin, intent.PriceMax)
			reply := natural
			if reply == "" {
				reply = generateNaturalReply(intent, products)
			}
			return &ChatResponse{Reply: reply, Products: products}, nil
		default:
			return &ChatResponse{Reply: raw}, nil
		}
	}

	// không parse được JSON -> trả nguyên câu tự nhiên (có thể là câu hỏi làm rõ)
	return &ChatResponse{Reply: raw}, nil
}

// --- Extractor: cố gắng trích xuất JSON từ reply của assistant ---
func (s *ChatService) tryExtractJSONWithAssistant(ctx context.Context, rawReply string) (string, error) {
	extractorSys := `You are an extractor. Given the assistant's previous message, OUTPUT ONLY a single JSON object that matches this schema:\n{"intent":"ask_hours"|"search","category": string|null,"keywords": [string]|null,"price_min": number|null,"price_max": number|null}\nIf you cannot produce such JSON (the assistant's message was a clarifying question or unrelated), output exactly:\nNO_JSON\nDo NOT output any other text.`

	ctx2, cancel2 := context.WithTimeout(ctx, 8*time.Second)
	defer cancel2()

	resp, err := s.aiClient.CreateChatCompletion(ctx2, openai.ChatCompletionRequest{
		Model: s.model,
		Messages: []openai.ChatCompletionMessage{
			{Role: "system", Content: extractorSys},
			{Role: "user", Content: rawReply},
		},
		MaxTokens:   300,
		Temperature: 0.0,
	})
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(resp.Choices[0].Message.Content), nil
}

// --- System/prompts ---
func (s *ChatService) systemPromptConversational() string {
	return `Bạn là trợ lý AI thân thiện cho shop quần áo. Bạn có thể:
- Trả lời trực tiếp nếu đã đủ thông tin.
- Hoặc hỏi một câu ngắn để làm rõ nếu cần thêm thông tin (vd: "Bạn muốn tầm giá bao nhiêu?" hoặc "Bạn thích màu gì?").
Nếu bạn đã có đủ thông tin và muốn hệ thống thực hiện tìm sản phẩm, bạn *có thể* kèm một khối JSON (không bắt buộc) với schema:
{"intent":"search"|"ask_hours","category":string|null,"keywords":[string]|null,"price_min":number|null,"price_max":number|null}
Nhưng KHÔNG bắt buộc — hãy ưu tiên trả lời tự nhiên, thân thiện, và hỏi làm rõ nếu cần.`
}

func (s *ChatService) buildPromptForConversational(message string) string {
	return fmt.Sprintf("User: %s\n\nHãy trả lời ngắn gọn, thân thiện bằng tiếng Việt. Nếu cần, hỏi 1 câu để làm rõ.", escapeForPrompt(message))
}

// --- Helper: validateKeywords ---
func (s *ChatService) validateKeywords(keywords []string, message string) []string {
	msg := strings.ToLower(message)
	out := []string{}
	seen := map[string]bool{}
	for _, kw := range keywords {
		kw = strings.TrimSpace(strings.ToLower(kw))
		if kw == "" {
			continue
		}
		if len([]rune(kw)) <= 1 {
			continue
		}
		if strings.Contains(msg, kw) && !seen[kw] {
			out = append(out, kw)
			seen[kw] = true
		}
	}
	return out
}

// --- Natural reply generator (dự phòng) ---
func generateNaturalReply(intent IntentResult, products []models.Product) string {
	rand.Seed(time.Now().UnixNano())
	if intent.Intent == "ask_hours" {
		cands := []string{
			"Shop mình mở từ 8h sáng đến 22h tối hàng ngày nhé 🙂",
			"Mình mở cửa từ 8:00 - 22:00 mỗi ngày.",
		}
		return cands[rand.Intn(len(cands))]
	}

	if intent.Intent == "search" {
		if len(products) == 0 {
			c := []string{
				"Mình chưa tìm thấy sản phẩm đúng như bạn mô tả — bạn có thể nói rõ thêm về mức giá hoặc kiểu dáng không?",
				"Chưa rõ lắm ạ. Bạn muốn tầm giá bao nhiêu hoặc ưu tiên màu/nhãn hiệu nào không?",
			}
			return c[rand.Intn(len(c))]
		}

		if len(products) == 1 {
			p := products[0]
			return fmt.Sprintf("Mình tìm được 1 mẫu phù hợp: %s. Bạn muốn xem chi tiết (link, ảnh, size) không?", p.Name)
		}

		n := len(products)
		if n > 3 {
			n = 3
		}
		names := []string{}
		for i := 0; i < n; i++ {
			names = append(names, products[i].Name)
		}
		return fmt.Sprintf("Mình tìm được %d sản phẩm phù hợp, ví dụ: %s... Bạn muốn xem chi tiết mẫu nào?", len(products), strings.Join(names, ", "))
	}

	return "Mình chưa hiểu lắm — bạn có thể mô tả lại được không?"
}

// --- Light local fallback (nếu không có OpenAI hoặc lỗi) ---
func (s *ChatService) handleLocally(req ChatRequest) (*ChatResponse, error) {
	msg := strings.ToLower(req.Message)

	if strings.Contains(msg, "giờ") || strings.Contains(msg, "mấy giờ") || strings.Contains(msg, "mở") {
		return &ChatResponse{Reply: s.repo.GetStoreHours()}, nil
	}

	min, max := detectPriceRange(req.Message)
	category := detectCategory(req.Message)
	keywords := extractKeywords(req.Message)

	products, _ := s.repo.FindProducts(category, keywords, min, max)
	if len(products) > 0 {
		reply := generateNaturalReply(IntentResult{Intent: "search", Category: category, Keywords: keywords, PriceMin: min, PriceMax: max}, products)
		return &ChatResponse{Reply: reply, Products: products}, nil
	}

	return &ChatResponse{Reply: "Mình chưa hiểu rõ câu hỏi. Bạn có thể hỏi về giờ mở cửa hoặc tìm sản phẩm theo tên, loại, giá."}, nil
}

// --- Price detection ---
func detectPriceRange(msg string) (float64, float64) {
	re := regexp.MustCompile(`([0-9]+(?:[\.,][0-9]+)?)\s?(k|nghìn|tr|triệu|m)?`)
	matches := re.FindAllStringSubmatch(strings.ToLower(msg), -1)
	vals := []float64{}
	for _, m := range matches {
		numStr := strings.ReplaceAll(m[1], ",", "")
		v, err := strconv.ParseFloat(numStr, 64)
		if err != nil {
			continue
		}
		unit := strings.ToLower(m[2])
		mult := 1.0
		switch unit {
		case "k", "nghìn":
			mult = 1000
		case "tr", "triệu", "m":
			mult = 1000000
		}
		vals = append(vals, v*mult)
	}
	if len(vals) == 0 {
		return 0, 0
	}

	lmsg := strings.ToLower(msg)
	if strings.Contains(lmsg, "tầm") || strings.Contains(lmsg, "khoảng") {
		base := vals[0]
		return base * 0.8, base * 1.2
	}
	if strings.Contains(lmsg, "dưới") || strings.Contains(lmsg, "không quá") {
		return 0, vals[0]
	}
	if strings.Contains(lmsg, "trên") || strings.Contains(lmsg, "hơn") {
		return vals[0], 0
	}
	if len(vals) >= 2 {
		if vals[0] < vals[1] {
			return vals[0], vals[1]
		}
		return vals[1], vals[0]
	}
	return 0, vals[0]
}

// --- Category detection ---
func detectCategory(msg string) string {
	catMap := map[string]string{
		"áo polo":      "ao-polo",
		"polo":         "ao-polo",
		"áo sơ mi":     "ao-so-mi",
		"sơ mi":        "ao-so-mi",
		"áo thun":      "ao-thun",
		"thun":         "ao-thun",
		"áo len":       "ao-len",
		"áo khoác gió": "ao-khoac-gio",
		"áo khoác":     "ao-khoac",
		"áo hoodie":    "ao-hoodie",
		"quần jean":    "quan-jeans",
		"jean":         "quan-jeans",
		"giày":         "giay-dep",
		"ví":           "vi",
		"túi":          "tui-sach",
		"váy":          "vay",
		"phụ kiện":     "phu-kien",
	}

	l := strings.ToLower(msg)
	keys := make([]string, 0, len(catMap))
	for k := range catMap {
		keys = append(keys, k)
	}
	// sắp theo độ dài giảm dần
	for i := 0; i < len(keys); i++ {
		for j := i + 1; j < len(keys); j++ {
			if len(keys[j]) > len(keys[i]) {
				keys[i], keys[j] = keys[j], keys[i]
			}
		}
	}
	for _, k := range keys {
		if strings.Contains(l, k) {
			return catMap[k]
		}
	}
	return ""
}

// --- Extract keywords ---
func extractKeywords(msg string) []string {
	msg = strings.ToLower(msg)
	words := strings.Fields(msg)

	stopwords := map[string]bool{
		"có": true, "bán": true, "không": true, "mua": true, "muốn": true,
		"mình": true, "shop": true, "cửa": true, "hàng": true, "tầm": true,
		"dưới": true, "trên": true, "khoảng": true, "bao": true, "nào": true,
		"nghìn": true, "k": true, "tr": true, "triệu": true, "m": true,
		"vnđ": true, "vnd": true,
	}
	seen := map[string]bool{}
	result := []string{}

	reNum := regexp.MustCompile(`^[0-9]+([.,][0-9]+)?(k|nghìn|tr|triệu|m)?$`)
	for i, w := range words {
		w = strings.Trim(w, ",.?!;\"'()")
		if w == "" || stopwords[w] || reNum.MatchString(w) || len([]rune(w)) <= 1 {
			continue
		}
		if i+1 < len(words) {
			next := strings.Trim(words[i+1], ",.?!;\"'()")
			mw := w + " " + next
			if mw == "sơ mi" {
				if !seen[mw] {
					result = append(result, mw)
					seen[mw] = true
				}
				continue
			}
		}
		if !seen[w] {
			seen[w] = true
			result = append(result, w)
		}
	}
	return result
}

// --- Extract first JSON block ---
func extractFirstJSON(s string) string {
	s = strings.TrimSpace(s)
	start := strings.Index(s, "{")
	if start == -1 {
		return ""
	}
	count := 0
	for i := start; i < len(s); i++ {
		if s[i] == '{' {
			count++
		}
		if s[i] == '}' {
			count--
			if count == 0 {
				return s[start : i+1]
			}
		}
	}
	return ""
}

func escapeForPrompt(s string) string {
	return strings.ReplaceAll(s, "\n", " ")
}

// --- Optional cosine (unused) ---
func cosine(a, b []float64) float64 {
	var dot, na, nb float64
	for i := range a {
		dot += a[i] * b[i]
		na += a[i] * a[i]
		nb += b[i] * b[i]
	}
	return dot / (math.Sqrt(na)*math.Sqrt(nb) + 1e-9)
}
