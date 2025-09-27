package utils

import (
	"crypto/hmac"
	"crypto/sha512"
	"encoding/hex"
	"fmt"
	"log"
	"net/url"
	"sort"
	"strings"
)

// HmacSHA512 tạo hash HMAC-SHA512 của data với secret
func HmacSHA512(data, secret string) string {
	h := hmac.New(sha512.New, []byte(secret))
	h.Write([]byte(data))
	return hex.EncodeToString(h.Sum(nil))
}

// CreateVnpayUrl: tạo URL VNPay chuẩn
// - Hash được tạo trên payload: các key A-Z, value được URL-escaped (QueryEscape), nối bằng &
// - Khi gửi, query string sẽ được encode bằng url.Values.Encode()
// - Thêm vnp_SecureHashType=SHA512 và vnp_SecureHash
func CreateVnpayUrl(params map[string]string, secret, baseUrl string) string {
	// 1. Sắp xếp key
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	// 2. Build payload for HMAC: use url.QueryEscape on values
	var parts []string
	for _, k := range keys {
		v := strings.TrimSpace(params[k])
		if v == "" {
			continue
		}
		// IMPORTANT: use QueryEscape for HMAC payload
		escaped := url.QueryEscape(v)
		parts = append(parts, fmt.Sprintf("%s=%s", k, escaped))
	}
	payload := strings.Join(parts, "&")

	// 3. compute secure hash
	secureHash := HmacSHA512(payload, secret)

	// 4. build query string to send (use original values; url.Values.Encode will encode)
	values := url.Values{}
	for _, k := range keys {
		v := strings.TrimSpace(params[k])
		if v == "" {
			continue
		}
		values.Set(k, v)
	}
	// append hash type and hash
	values.Set("vnp_SecureHashType", "SHA512")
	values.Set("vnp_SecureHash", secureHash)

	// debug logs (remove in production)
	log.Println("VNPay - payload for HMAC:", payload)
	log.Println("VNPay - secureHash:", secureHash)

	return baseUrl + "?" + values.Encode()
}

// ValidateVnpayHash: validate chữ ký trả về từ VNPay
// The data passed in should NOT contain vnp_SecureHash or vnp_SecureHashType
func ValidateVnpayHash(data map[string]string, secret, hash string) bool {
	// sort keys
	var keys []string
	for k := range data {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	// build payload with QueryEscape (same as CreateVnpayUrl)
	var parts []string
	for _, k := range keys {
		v := strings.TrimSpace(data[k])
		if v == "" {
			continue
		}
		escaped := url.QueryEscape(v)
		parts = append(parts, fmt.Sprintf("%s=%s", k, escaped))
	}
	payload := strings.Join(parts, "&")
	computed := HmacSHA512(payload, secret)
	return strings.EqualFold(computed, hash)
}
