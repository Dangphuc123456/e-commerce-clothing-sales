package routes

import (
	adminCtrl "backend/internal/controllers/admin"
	"backend/internal/middlewares"
	"github.com/gorilla/mux"
	
)

func SetupAdminRoutes(r *mux.Router) {
	
	adminRouter := r.PathPrefix("/api/admin").Subrouter()
	adminRouter.Use(middlewares.JWTMiddleware) 
	// Users
	adminRouter.HandleFunc("/users", adminCtrl.GetAllUsers).Methods("GET")
	adminRouter.HandleFunc("/users/{id:[0-9]+}", adminCtrl.EditUser).Methods("PUT")
	adminRouter.HandleFunc("/users/{id:[0-9]+}", adminCtrl.DeleteUser).Methods("DELETE")
	adminRouter.HandleFunc("/logs", adminCtrl.GetUserLogsHandler).Methods("GET")
	
	adminRouter.HandleFunc("/suppliers", adminCtrl.GetAllSuppliers).Methods("GET")
	adminRouter.HandleFunc("/suppliers", adminCtrl.CreateSupplier).Methods("POST")
	adminRouter.HandleFunc("/suppliers/{id:[0-9]+}", adminCtrl.GetSupplierDetail).Methods("GET")
	adminRouter.HandleFunc("/suppliers/{id:[0-9]+}", adminCtrl.EditSupplier).Methods("PUT")
	adminRouter.HandleFunc("/suppliers/{id:[0-9]+}", adminCtrl.DeleteSupplier).Methods("DELETE")

	// Supplier-scoped purchases
	adminRouter.HandleFunc("/suppliers/{id:[0-9]+}/purchases", adminCtrl.GetPurchasesBySupplier).Methods("GET")
	adminRouter.HandleFunc("/suppliers/{id:[0-9]+}/purchases", adminCtrl.CreatePurchaseForSupplier).Methods("POST")
	adminRouter.HandleFunc("/suppliers/{id:[0-9]+}/purchases/{purchaseId:[0-9]+}", adminCtrl.EditPurchaseForSupplier).Methods("PUT")
	adminRouter.HandleFunc("/suppliers/{id:[0-9]+}/purchases/{purchaseId:[0-9]+}", adminCtrl.DeletePurchaseForSupplier).Methods("DELETE")


	// Global purchases (optional)
	adminRouter.HandleFunc("/purchases", adminCtrl.GetAllPurchasesGlobal).Methods("GET")
	adminRouter.HandleFunc("/purchases", adminCtrl.CreatePurchaseGlobal).Methods("POST")
	adminRouter.HandleFunc("/purchases/{id:[0-9]+}", adminCtrl.EditPurchaseGlobal).Methods("PUT")
	adminRouter.HandleFunc("/purchases/{id:[0-9]+}", adminCtrl.DeletePurchaseGlobal).Methods("DELETE")
    // Categories & Products
	adminRouter.HandleFunc("/categories", adminCtrl.GetAllCategories).Methods("GET")
	adminRouter.HandleFunc("/categories", adminCtrl.CreateCategory).Methods("POST")
	adminRouter.HandleFunc("/categories/{id:[0-9]+}", adminCtrl.EditCategory).Methods("PUT")
	adminRouter.HandleFunc("/categories/{id:[0-9]+}", adminCtrl.DeleteCategory).Methods("DELETE")
	adminRouter.HandleFunc("/categories/{id:[0-9]+}", adminCtrl.GetCategoryDetail).Methods("GET")

	adminRouter.HandleFunc("/products", adminCtrl.GetAllProducts).Methods("GET")
	adminRouter.HandleFunc("/products/{id:[0-9]+}", adminCtrl.GetProductDetail).Methods("GET")
	adminRouter.HandleFunc("/products", adminCtrl.CreateProduct).Methods("POST")
	adminRouter.HandleFunc("/products/{id:[0-9]+}", adminCtrl.EditProduct).Methods("PUT")
	adminRouter.HandleFunc("/products/{id:[0-9]+}", adminCtrl.DeleteProduct).Methods("DELETE")

	// Variants
	adminRouter.HandleFunc("/products/{id:[0-9]+}/variants", adminCtrl.GetVariantsByProduct).Methods("GET")
	adminRouter.HandleFunc("/variants", adminCtrl.GetAllVariants).Methods("GET")
	adminRouter.HandleFunc("/products/{id:[0-9]+}/variants", adminCtrl.CreateVariant).Methods("POST")
	adminRouter.HandleFunc("/products/{id:[0-9]+}/variants/{variantId:[0-9]+}", adminCtrl.EditVariant).Methods("PUT")
	adminRouter.HandleFunc("/products/{id:[0-9]+}/variants/{variantId:[0-9]+}", adminCtrl.DeleteVariant).Methods("DELETE")

	// Inventory Logs
	adminRouter.HandleFunc("/inventory_logs", adminCtrl.GetAllInventoryLogs).Methods("GET")
	adminRouter.HandleFunc("/inventory_logs/{id:[0-9]+}", adminCtrl.GetInventoryLogDetail).Methods("GET")
	adminRouter.HandleFunc("/inventory_logs", adminCtrl.CreateInventoryLog).Methods("POST")
	adminRouter.HandleFunc("/inventory_logs/{id:[0-9]+}", adminCtrl.EditInventoryLog).Methods("PUT")
	adminRouter.HandleFunc("/inventory_logs/{id:[0-9]+}", adminCtrl.DeleteInventoryLog).Methods("DELETE")
    // Orders
	adminRouter.HandleFunc("/orders", adminCtrl.GetAllOrders).Methods("GET")
	adminRouter.HandleFunc("/orders/{id:[0-9]+}", adminCtrl.GetOrderDetail).Methods("GET")
	adminRouter.HandleFunc("/orders/{id:[0-9]+}/status", adminCtrl.UpdateOrderStatus).Methods("PATCH")

	adminRouter.HandleFunc("/search", adminCtrl.SearchAll).Methods("GET")
}