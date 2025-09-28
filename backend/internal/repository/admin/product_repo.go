package admin

import (
	"backend/configs"
	"backend/internal/models"
	"errors"
	"github.com/gosimple/slug"
)

// PRODUCTS
func GetAllProducts() ([]models.Product, error) {
	var products []models.Product
	err := configs.DB.Preload("Variants").Find(&products).Error
	return products, err
}

func GetProductDetail(id uint) (*models.Product, error) {
	var product models.Product
	err := configs.DB.Preload("Variants").First(&product, id).Error
	return &product, err
}

func CreateProduct(p *models.Product) (*models.Product, error) {
    p.Slug = slug.Make(p.Name)
    if err := configs.DB.Create(p).Error; err != nil {
        return nil, err
    }
    return p, nil
}


func UpdateProduct(id uint, newData *models.Product) (*models.Product, error) {
	var p models.Product
	if err := configs.DB.First(&p, id).Error; err != nil {
		return nil, err
	}
	p.Name = newData.Name
	p.Description = newData.Description
	p.CategoryID = newData.CategoryID
	p.Image = newData.Image
	p.Price = newData.Price
	p.Discount = newData.Discount
	p.Slug = slug.Make(newData.Name)
	if err := configs.DB.Save(&p).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func DeleteProduct(id uint) error {
	return configs.DB.Delete(&models.Product{}, id).Error
}

// VARIANTS
func GetVariantsByProduct(productID uint) ([]models.ProductVariant, error) {
	var variants []models.ProductVariant
	err := configs.DB.
		Where("product_id = ?", productID).
		Preload("Product").
		Find(&variants).Error
	return variants, err
}

func GetAllVariants() ([]models.ProductVariant, error) {
	var variants []models.ProductVariant
	err := configs.DB.Preload("Product").Find(&variants).Error
	return variants, err
}
func CreateVariant(v *models.ProductVariant) (*models.ProductVariant, error) {
	var count int64
	configs.DB.Model(&models.ProductVariant{}).Where("sku = ?", v.SKU).Count(&count)
	if count > 0 {
		return nil, errors.New("SKU already exists")
	}
	if err := configs.DB.Create(v).Error; err != nil {
		return nil, err
	}
	return v, nil
}

func UpdateVariant(id uint, newData *models.ProductVariant) (*models.ProductVariant, error) {
	var v models.ProductVariant
	if err := configs.DB.First(&v, id).Error; err != nil {
		return nil, err
	}
	var count int64
	configs.DB.Model(&models.ProductVariant{}).
		Where("sku = ? AND id <> ?", newData.SKU, id).
		Count(&count)
	if count > 0 {
		return nil, errors.New("SKU already exists")
	}
	v.Size = newData.Size
	v.Color = newData.Color
	v.Price = newData.Price
	v.Stock = newData.Stock
	v.SKU = newData.SKU
	v.Image = newData.Image
	if err := configs.DB.Save(&v).Error; err != nil {
		return nil, err
	}
	return &v, nil
}

func DeleteVariant(id uint) error {
	return configs.DB.Unscoped().Delete(&models.ProductVariant{}, id).Error
}

