package controllers

import (
	"backend/internal/models"
	"backend/internal/repository"
	"encoding/json"           
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gorilla/mux"   
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}

type ChatHandler struct {
	Repo *repository.MessageRepo

	mu              sync.RWMutex
	CustomerClients map[uint]*websocket.Conn
	AdminClients    map[*websocket.Conn]bool
}

func NewChatHandler(repo *repository.MessageRepo) *ChatHandler {
	return &ChatHandler{
		Repo:            repo,
		CustomerClients: make(map[uint]*websocket.Conn),
		AdminClients:    make(map[*websocket.Conn]bool),
	}
}

func (h *ChatHandler) HandleWS(w http.ResponseWriter, r *http.Request) {
	role := r.URL.Query().Get("role")
	customerIDStr := r.URL.Query().Get("customer_id")

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}

	var customerID uint
	if role == "customer" {
		id, err := strconv.Atoi(customerIDStr)
		if err != nil {
			log.Println("Invalid customer_id:", err)
			conn.Close()
			return
		}
		customerID = uint(id)

		h.mu.Lock()
		h.CustomerClients[customerID] = conn
		h.mu.Unlock()

		// Send the message history.
		msgs, _ := h.Repo.GetMessagesByCustomer(customerID)
		conn.WriteJSON(struct {
			Type     string           `json:"type"`
			Messages []models.Message `json:"messages"`
		}{
			Type:     "history",
			Messages: msgs,
		})
	} else if role == "admin" {
		h.mu.Lock()
		h.AdminClients[conn] = true
		h.mu.Unlock()

		// Send recent messages
		recentMsgs, _ := h.Repo.GetRecentMessages(200)
		conn.WriteJSON(struct {
			Type     string           `json:"type"`
			Messages []models.Message `json:"messages"`
		}{
			Type:     "recent",
			Messages: recentMsgs,
		})

		// Send unread summary
		if summary, err := h.Repo.GetUnreadSummary(); err == nil {
			conn.WriteJSON(struct {
				Type    string                     `json:"type"`
				Summary []repository.UnreadSummary `json:"unread_summary"`
			}{
				Type:    "unread_summary",
				Summary: summary,
			})
		}
	}

	// Ping/Pong giữ connection
	conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(appData string) error {
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})
	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()
		for range ticker.C {
			if err := conn.WriteMessage(websocket.PingMessage, []byte{}); err != nil {
				return
			}
		}
	}()

	// Message read loop
	for {
		var msg models.Message
		if err := conn.ReadJSON(&msg); err != nil {
			log.Println("WebSocket read error:", err)
			break
		}

		// Assign role and customerID
		if role == "customer" {
			msg.CustomerID = customerID
			msg.SenderRole = "customer"
		} else if role == "admin" {
			msg.SenderRole = "admin"
		}

		if msg.CreatedAt.IsZero() {
			msg.CreatedAt = time.Now()
		}

		// Save to DB
		if err := h.Repo.SaveMessage(&msg); err != nil {
			log.Println("Save message error:", err)
		}

		// If admin sends -> mark customer as read
		if role == "admin" && msg.CustomerID != 0 {
			if err := h.Repo.MarkAsRead(msg.CustomerID); err != nil {
				log.Println("MarkAsRead error:", err)
			}
		}

		// Broadcast to other admins (does not send back to itself)
		h.mu.RLock()
		for c := range h.AdminClients {
			if err := c.WriteJSON(msg); err != nil {
				h.mu.RUnlock()
				h.mu.Lock()
				delete(h.AdminClients, c)
				h.mu.Unlock()
				h.mu.RLock()
			}
		}
		h.mu.RUnlock()

		// If admin sends -> sends to the correct corresponding customer
		if role == "admin" && msg.CustomerID != 0 {
			h.mu.RLock()
			custConn, ok := h.CustomerClients[msg.CustomerID]
			h.mu.RUnlock()
			if ok {
				if err := custConn.WriteJSON(msg); err != nil {
					log.Println("Error sending to customer:", err)
					h.mu.Lock()
					delete(h.CustomerClients, msg.CustomerID)
					h.mu.Unlock()
				}
			}
		}

		if role == "customer" {
			h.mu.RLock()
			for c := range h.AdminClients {
				if err := c.WriteJSON(msg); err != nil {
					h.mu.RUnlock()
					h.mu.Lock()
					delete(h.AdminClients, c)
					h.mu.Unlock()
					h.mu.RLock()
				}
			}
			h.mu.RUnlock()
			// Echo back to itself
			if err := conn.WriteJSON(msg); err != nil {
				log.Println("Echo to customer error:", err)
			}
		}
	}

	// Cleanup on disconnect
	h.mu.Lock()
	if role == "customer" {
		delete(h.CustomerClients, customerID)
	} else if role == "admin" {
		delete(h.AdminClients, conn)
	}
	h.mu.Unlock()
	conn.Close()
}

type MessageController struct {
	Repo *repository.MessageRepo
}

func NewMessageController(repo *repository.MessageRepo) *MessageController {
	return &MessageController{Repo: repo}
}

func (c *MessageController) GetMessagesByCustomer(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    idStr := vars["customerId"]
    id, err := strconv.Atoi(idStr)
    if err != nil {
        http.Error(w, "Invalid customer ID", http.StatusBadRequest)
        return
    }

    msgs, err := c.Repo.GetMessagesByCustomer(uint(id))
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(msgs)
}


func (c *MessageController) MarkAsRead(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["customerId"]
	id, _ := strconv.Atoi(idStr)

	c.Repo.MarkAsRead(uint(id))
	w.WriteHeader(http.StatusOK)
}

func (c *MessageController) GetUnreadSummary(w http.ResponseWriter, r *http.Request) {
	summary, _ := c.Repo.GetUnreadSummary()
	json.NewEncoder(w).Encode(summary)
}

func (c *MessageController) GetRecentMessages(w http.ResponseWriter, r *http.Request) {
	msgs, _ := c.Repo.GetRecentMessages(200)
	json.NewEncoder(w).Encode(msgs)
}
func (c *MessageController) GetCustomerList(w http.ResponseWriter, r *http.Request) {
	customers, err := c.Repo.GetCustomersWithMessages()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(customers)
}
