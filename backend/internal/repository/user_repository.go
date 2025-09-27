package repository

import (
	"backend/configs"
	"backend/internal/models"
)

func CreateUser(user *models.User) error {
	return configs.DB.Create(user).Error
}

func GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	err := configs.DB.Where("email = ?", email).First(&user).Error
	return &user, err
}
func CreateLoginLog(log *models.LoginLog) error {
	return configs.DB.Create(log).Error
}

// Lấy log theo user_id
func GetLoginLogsByUserID(userID uint) ([]models.LoginLog, error) {
	var logs []models.LoginLog
	err := configs.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&logs).Error
	return logs, err
}