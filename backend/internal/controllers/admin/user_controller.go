package admin

import (
	"backend/configs"
	"backend/internal/middlewares"
	"backend/internal/models"
	adminRepo "backend/internal/repository/admin"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

// GET ALL USERS
func GetAllUsers(w http.ResponseWriter, r *http.Request) {
	users, err := adminRepo.GetAllUsers()
	if err != nil {
		http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

// EDIT USER
func EditUser(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id, err := strconv.Atoi(params["id"])
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	var req models.User
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	user, err := adminRepo.UpdateUser(uint(id), &req)
	if err != nil {
		http.Error(w, "Failed to update user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// DELETE USER
func DeleteUser(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id, err := strconv.Atoi(params["id"])
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	if err := adminRepo.DeleteUser(uint(id)); err != nil {
		http.Error(w, "Failed to delete user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "User deleted successfully"})
}
// Lấy log đăng nhập của chính user
func GetUserLogsHandler(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var logs []models.LoginLog
	var err error

	if claims.Role == "admin" {
		// Admin xem được tất cả log
		err = configs.DB.Order("created_at desc").Find(&logs).Error
	} else {
		// Staff, customer chỉ xem log của chính mình
		logs, err = adminRepo.GetLoginLogsByUserID(claims.UserID)
	}

	if err != nil {
		http.Error(w, "Failed to fetch logs", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}
