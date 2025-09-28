package routes

import (
	customerCtrl "backend/internal/controllers/customer"
	"backend/internal/middlewares"
	"github.com/gorilla/mux"
)

func SetupCustomerRoutes(r *mux.Router) {
	custRouter := r.PathPrefix("/api/customer").Subrouter()
	custRouter.Use(middlewares.JWTMiddleware) 
	
	custRouter.HandleFunc("/categories", customerCtrl.GetCategoriesByGroup).Methods("GET")
	custRouter.HandleFunc("/products", customerCtrl.GetProductsByCategory).Methods("GET")
	
	custRouter.HandleFunc("/products-all", customerCtrl.GetAllProducts).Methods("GET")
	custRouter.HandleFunc("/products-latest", customerCtrl.GetLatestProducts).Methods("GET")
	custRouter.HandleFunc("/products-random", customerCtrl.GetRandomProducts).Methods("GET")
	custRouter.HandleFunc("/product/{slug}", customerCtrl.GetProductDetail).Methods("GET")
	custRouter.HandleFunc("/products-best-sellers", customerCtrl.GetBestSellersHandler).Methods("GET")
	custRouter.HandleFunc("/products-discounted", customerCtrl.GetDiscountedProductsHandler).Methods("GET")

	custRouter.HandleFunc("/search/suggest", customerCtrl.SearchSuggestions).Methods("GET")
	custRouter.HandleFunc("/search", customerCtrl.SearchProducts).Methods("GET")
	custRouter.HandleFunc("/cart/{userId}", customerCtrl.GetCart).Methods("GET")

	custRouter.HandleFunc("/cart/add", customerCtrl.AddToCart).Methods("POST")
	custRouter.HandleFunc("/cart/update", customerCtrl.UpdateCartItem).Methods("PUT")
	custRouter.HandleFunc("/cart/remove/{userId}/{variantId}", customerCtrl.RemoveCartItem).Methods("DELETE")
	custRouter.HandleFunc("/cart/clear/{userId}", customerCtrl.ClearCart).Methods("DELETE")

	custRouter.HandleFunc("/orders", customerCtrl.PlaceOrderHandler).Methods("POST")

	custRouter.HandleFunc("/orders/processing", customerCtrl.GetProcessingOrdersHandler).Methods("GET")
    custRouter.HandleFunc("/orders/history", customerCtrl.GetOrderHistoryHandler).Methods("GET")
	custRouter.HandleFunc("/orders/{id:[0-9]+}/cancel", customerCtrl.CancelOrderHandler).Methods("POST")
  
	r.HandleFunc("/api/vnpay-return", customerCtrl.VnpayReturnHandler).Methods("GET")
	custRouter.HandleFunc("/chat", customerCtrl.ChatHandler).Methods("POST")
}
