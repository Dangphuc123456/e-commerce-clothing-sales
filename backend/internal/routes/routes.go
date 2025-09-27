// internal/routes/routes.go
package routes

import (
    "backend/internal/controllers"
    "github.com/gorilla/mux"
)

func SetupRoutes(r *mux.Router, chatHandler *controllers.ChatHandler, msgController *controllers.MessageController) {
    api := r.PathPrefix("/api").Subrouter()

    // Auth routes
    auth := api.PathPrefix("/auth").Subrouter()
    auth.HandleFunc("/register", controllers.RegisterHandler).Methods("POST")
    auth.HandleFunc("/confirm", controllers.ConfirmRegisterHandler).Methods("GET")
    auth.HandleFunc("/login", controllers.LoginHandler).Methods("POST")

    // WebSocket
    api.HandleFunc("/ws", chatHandler.HandleWS)

    admin := api.PathPrefix("/admin").Subrouter()
    admin.HandleFunc("/messages/customers", msgController.GetCustomerList).Methods("GET")
	admin.HandleFunc("/messages/unread", msgController.GetUnreadSummary).Methods("GET")
	admin.HandleFunc("/messages/{customerId}", msgController.GetMessagesByCustomer).Methods("GET")
	admin.HandleFunc("/messages/{customerId}/read", msgController.MarkAsRead).Methods("PATCH")
	admin.HandleFunc("/messages/recent", msgController.GetRecentMessages).Methods("GET")
}
