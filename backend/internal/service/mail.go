package service

import (
	"fmt"
	"log"
	"net/smtp"
	"os"
	"strings"
)

func SendOrderEmail(toEmail string, orderItems []map[string]interface{}) error {
	from := os.Getenv("EMAIL_USER")
	pass := os.Getenv("EMAIL_PASS")
	host := os.Getenv("EMAIL_HOST")
	port := os.Getenv("EMAIL_PORT")

	auth := smtp.PlainAuth("", from, pass, host)

	var rows []string
	for _, item := range orderItems {
		rows = append(rows, fmt.Sprintf(
			"<tr><td>%s</td><td>%d</td><td>%.2f</td><td>%s</td><td>%s</td></tr>",
			item["name"], item["quantity"], item["price"], item["size"], item["color"],
		))
	}

	body := fmt.Sprintf(`
		<html>
		<body>
			<h3>Đơn hàng của bạn</h3>
			<table border="1" cellpadding="5" cellspacing="0">
				<tr>
					<th>Tên SP</th>
					<th>Số lượng</th>
					<th>Giá</th>
					<th>Size</th>
					<th>Màu</th>
				</tr>
				%s
			</table>
			<p>❤️ Cảm ơn quý khách đã mua hàng tại cửa hàng của chúng tôi!</p>
		</body>
		</html>
	`, strings.Join(rows, "\n"))

	subject := "Subject: 🛒 Đơn hàng mới\n"
	msg := []byte("From: " + from + "\n" +
		"To: " + toEmail + "\n" +
		subject +
		"MIME-Version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n" +
		body)

	addr := fmt.Sprintf("%s:%s", host, port)
	if err := smtp.SendMail(addr, auth, from, []string{toEmail}, msg); err != nil {
		log.Println("Email error:", err)
		return err
	}
	return nil
}
