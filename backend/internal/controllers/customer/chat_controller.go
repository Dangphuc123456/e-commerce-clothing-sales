

// FILE: internal/controllers/chat_controller.go
package customer

import (
	"backend/internal/service"
	repo "backend/internal/repository/customer"
	"encoding/json"
	"net/http"
)

var chatService = service.NewChatService(repo.NewChatRepository())

func ChatHandler(w http.ResponseWriter, r *http.Request) {
	var req service.ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	resp, err := chatService.HandleChat(req)
	if err != nil {
		http.Error(w, "chatbot error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

