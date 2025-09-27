package service

import (
	"fmt"
	"log"
	"net/smtp"
	"os"
)

func SendConfirmationEmail(toEmail, confirmLink string) error {
	from := os.Getenv("EMAIL_USER")
	pass := os.Getenv("EMAIL_PASS")
	host := os.Getenv("EMAIL_HOST")
	port := os.Getenv("EMAIL_PORT")

	auth := smtp.PlainAuth("", from, pass, host)

	// Tiêu đề email
	subject := "Subject: ✅ Xác nhận đăng ký tài khoản\n"

	// Nội dung email HTML
	body := fmt.Sprintf(`
	<html>
		<body style="font-family: Arial, sans-serif; line-height: 1.5;">
			<h2>Chào mừng bạn đến với cửa hàng của chúng tôi!</h2>
			<p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng nhấn nút dưới đây để xác nhận email và kích hoạt tài khoản:</p>
			<p style="text-align:center;">
				<a href="%s" style="
					background-color: #28a745;
					color: white;
					padding: 12px 24px;
					text-decoration: none;
					border-radius: 6px;
					font-weight: bold;
				">Xác nhận tài khoản</a>
			</p>
			<p>Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này.</p>
			<hr>
			<p style="font-size:12px; color: gray;">© 2025 Cửa hàng của chúng tôi. Bảo lưu mọi quyền.</p>
		</body>
	</html>
	`, confirmLink)

	// Gộp header + body
	msg := []byte(
		"From: " + from + "\n" +
			"To: " + toEmail + "\n" +
			subject +
			"MIME-Version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n" +
			body,
	)

	addr := fmt.Sprintf("%s:%s", host, port)
	if err := smtp.SendMail(addr, auth, from, []string{toEmail}, msg); err != nil {
		log.Println("Email error:", err)
		return err
	}

	return nil
}
