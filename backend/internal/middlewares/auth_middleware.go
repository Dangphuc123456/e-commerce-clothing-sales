package middlewares

import (
	"backend/internal/service"
	"context"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
)

type contextKey string

const userContextKey = contextKey("user")


func GetUserFromContext(r *http.Request) *service.Claims {
	claims, ok := r.Context().Value(userContextKey).(*service.Claims)
	if !ok {
		return nil
	}
	return claims
}

func JWTMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error":"Missing token"}`, http.StatusUnauthorized)
			return
		}
		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

		claims, err := service.ParseToken(tokenStr)
		if err != nil {
			http.Error(w, `{"error":"Invalid token"}`, http.StatusUnauthorized)
			return
		}

		// Gắn claims vào context
		ctx := context.WithValue(r.Context(), userContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func RoleMiddleware(roles ...string) mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims := GetUserFromContext(r)
			if claims == nil {
				http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
				return
			}
			for _, role := range roles {
				if claims.Role == role {
					next.ServeHTTP(w, r)
					return
				}
			}
			http.Error(w, `{"error":"Forbidden"}`, http.StatusForbidden)
		})
	}
}
