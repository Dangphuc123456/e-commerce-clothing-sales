import React from "react";
import "./Footer.css";

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-col">
          <h5>Về Chúng Tôi</h5>
          <p>
            Shop Clothes - Thời trang nam nữ, trẻ em, thể thao & phụ kiện.
            Cam kết sản phẩm chất lượng, giá cả hợp lý.
          </p>
        </div>

        <div className="footer-col">
          <h5>Liên Hệ</h5>
          <ul className="footer-links">
            <li>📍 123 Đường ABC, Hà Nội</li>
            <li>📞 0123 456 789</li>
            <li>✉️ contact@shopclothes.com</li>
          </ul>
        </div>

        <div className="footer-col">
          <h5>Theo Dõi Chúng Tôi</h5>
          <ul className="footer-social">
            <li><a href="#">Facebook</a></li>
            <li><a href="#">Instagram</a></li>
            <li><a href="#">TikTok</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Shop Clothes. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;