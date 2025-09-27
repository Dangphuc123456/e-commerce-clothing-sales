package main

import (
	"backend/configs"
	"backend/internal/models"
	"backend/internal/routes"
	"backend/internal/controllers"
	"backend/internal/repository"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/rs/cors"
	"github.com/gorilla/mux"
)

func main() {
	
	configs.ConnectDatabase()

	if err := configs.DB.AutoMigrate(&models.User{}); err != nil {
		log.Fatal("Migration failed:", err)
	}


	msgRepo := repository.NewMessageRepo(configs.DB)
	chatHandler := controllers.NewChatHandler(msgRepo)
	msgController := controllers.NewMessageController(msgRepo)

	r := mux.NewRouter()

	routes.SetupRoutes(r, chatHandler, msgController)
	routes.SetupAdminRoutes(r)
    routes.SetupCustomerRoutes(r)
	
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"}, 
		AllowedMethods:   []string{"GET", "POST", "PUT","PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Origin", "Content-Type", "Authorization"},
		ExposedHeaders:   []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           int((12 * time.Hour).Seconds()),
	})

	handler := c.Handler(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Println("🚀 Server running on port", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatal(err)
	}
}
