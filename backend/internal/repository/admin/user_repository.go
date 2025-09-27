package admin

import (
	"backend/configs"
	"backend/internal/models"
)

// ================= GET ALL USERS =================
func GetAllUsers() ([]models.User, error) {
	var users []models.User
	err := configs.DB.Find(&users).Error
	return users, err
}

// ================= UPDATE USER =================
func UpdateUser(id uint, newData *models.User) (*models.User, error) {
	var user models.User
	if err := configs.DB.First(&user, id).Error; err != nil {
		return nil, err
	}
	user.Username = newData.Username
	user.Email = newData.Email
	user.Phone = newData.Phone
	user.Address = newData.Address
	user.Role = newData.Role
	user.UpdatedAt = configs.DB.NowFunc() 

	if err := configs.DB.Model(&user).Updates(map[string]interface{}{
		"username":   user.Username,
		"email":      user.Email,
		"phone":      user.Phone,
		"address":    user.Address,
		"role":       user.Role,
		"updated_at": user.UpdatedAt,
	}).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

// ================= DELETE USER =================
func DeleteUser(id uint) error {
	return configs.DB.Delete(&models.User{}, id).Error
}
func GetAllLoginLogs() ([]models.LoginLog, error) {
	var logs []models.LoginLog
	err := configs.DB.Order("created_at desc").Find(&logs).Error
	return logs, err
}

// Lấy log theo user_id (cho staff/customer)
func GetLoginLogsByUserID(userID uint) ([]models.LoginLog, error) {
	var logs []models.LoginLog
	err := configs.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&logs).Error
	return logs, err
}