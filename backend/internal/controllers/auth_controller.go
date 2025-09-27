package controllers

import (
	"backend/internal/models"
	"backend/internal/repository"
	"backend/internal/service"
	"backend/internal/utils"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// ================= REGISTER =================
type RegisterRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Address  string `json:"address"`
}

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	claims := jwt.MapClaims{
		"username": req.Username,
		"email":    req.Email,
		"phone":    req.Phone,
		"role":     "customer",
		"hash":     hash,
		"address":  req.Address,
		"exp":      time.Now().Add(time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		http.Error(w, "Failed to create token", http.StatusInternalServerError)
		return
	}

	link := fmt.Sprintf("%s/api/auth/confirm?token=%s",
		os.Getenv("BACKEND_URL"), url.QueryEscape(tokenStr))

	if err := service.SendConfirmationEmail(req.Email, link); err != nil {
		http.Error(w, "Failed to send email", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Please check your email to confirm"})
}

// ================= CONFIRM REGISTER =================
func ConfirmRegisterHandler(w http.ResponseWriter, r *http.Request) {
	tokenStr := r.URL.Query().Get("token")
	frontend := os.Getenv("FRONTEND_URL")

	claims := jwt.MapClaims{}
	token, err := jwt.ParseWithClaims(tokenStr, &claims, func(t *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})

	if err != nil || !token.Valid {
		http.Redirect(w, r, frontend+"/register/failpage", http.StatusSeeOther)
		return
	}

	hash, ok := claims["hash"].(string)
	if !ok || hash == "" {
		http.Redirect(w, r, frontend+"/register/failpage", http.StatusSeeOther)
		return
	}

	user := models.User{
		Username:     claims["username"].(string),
		PasswordHash: hash,
		Email:        claims["email"].(string),
		Phone:        claims["phone"].(string),
		Address:      claims["address"].(string),
		Role:         "customer",
	}

	if err := repository.CreateUser(&user); err != nil {
		http.Redirect(w, r, frontend+"/register/failpage", http.StatusSeeOther)
		return
	}

	http.Redirect(w, r, frontend+"/register/complete", http.StatusSeeOther)
}

// ================= LOGIN =================
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	user, err := repository.GetUserByEmail(req.Email)
	if err != nil || !utils.CheckPasswordHash(user.PasswordHash, req.Password) {
		// ❌ Ghi log thất bại
		repository.CreateLoginLog(&models.LoginLog{
			UserID:    0,
			Role:      "unknown",
			IP:        r.RemoteAddr,
			UserAgent: r.UserAgent(),
			Status:    "failed",
			Message:   "Invalid credentials",
			CreatedAt: time.Now(),
		})

		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// ✅ Tạo token với user_id, role, username
	claims := jwt.MapClaims{
		"user_id":  user.ID,
		"role":     user.Role,
		"username": user.Username, // thêm username vào đây
		"exp":      time.Now().Add(time.Hour * 24).Unix(), // thời gian sống token
		"iat":      time.Now().Unix(),
	}

	tokenJWT := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, err := tokenJWT.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// ✅ Ghi log thành công
	repository.CreateLoginLog(&models.LoginLog{
		UserID:    user.ID,
		Role:      user.Role,
		IP:        r.RemoteAddr,
		UserAgent: r.UserAgent(),
		Status:    "success",
		Message:   "Login successful",
		CreatedAt: time.Now(),
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"token": tokenStr,
	})
}

