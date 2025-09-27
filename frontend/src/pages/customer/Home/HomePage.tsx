import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Carousel, Spinner, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import { formatCurrency } from "../../../utils/format";
import { FaEye, FaShoppingCart,FaTruck, FaClock, FaPhoneAlt } from "react-icons/fa";
import "./Home.css";
import ProductDetailModal from "../../../components/client/ProductDetailModal/ProductDetailModal";

interface Product {
  id: number;
  name: string;
  price: number;
  discounted_price?: number;
  image?: string;
  description?: string;
  discount: number;
  slug: string;
}

const HomePage: React.FC = () => {
  const [latest, setLatest] = useState<Product[]>([]);
  const [doBo, setDoBo] = useState<Product[]>([]);
  const [phuKien, setPhuKien] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [showDetail, setShowDetail] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const latestRes = await api.get("/api/customer/products-latest", { params: { limit: 4 } });
        setLatest(Array.isArray(latestRes.data) ? latestRes.data : []);

        const vestRes = await api.get("/api/customer/products-random", { params: { group: "vest" } });
        setDoBo(Array.isArray(vestRes.data) ? vestRes.data : []);

        const pkRes = await api.get("/api/customer/products-random", { params: { group: "phu-kien" } });
        setPhuKien(Array.isArray(pkRes.data) ? pkRes.data : []);
      } catch (err) {
        console.error("API error:", err);
        setLatest([]);
        setDoBo([]);
        setPhuKien([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openModalFor = (slug: string) => {
    setSelectedSlug(slug);
    setShowDetail(true);
  };

  const closeModal = () => {
    setShowDetail(false);
    setSelectedSlug(null);
  };
  if (loading)
    return (
      <div className="text-center my-5">
        <Spinner animation="border" /> Đang tải...
      </div>
    );

  return (
    <main>
      {/* Slideshow */}
      <section aria-label="Banner chính" className="homepage-slider mb-0">
        <Carousel fade>
          <Carousel.Item>
            <img className="d-block w-100" src="/assets/sls2.jpg" alt="Vest sang trọng" />
            <Carousel.Caption className="caption-bg">
              <h2>Vest Lịch Lãm</h2>
              <p>Khẳng định phong cách quý ông hiện đại</p>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <img className="d-block w-100" src="/assets/sls3.jpg" alt="Bộ sưu tập mới" />
            <Carousel.Caption className="caption-bg">
              <h2>Phong thái đỉnh cao</h2>
              <p>Phong cách quý ông – Phụ kiện thời thượng</p>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <img className="d-block w-100" src="/assets/sls1.jpg" alt="Bộ sưu tập mới" />
            <Carousel.Caption className="caption-bg">
              <h2>Phong thái lịch lãm</h2>
              <p>Thời trang thể thao kết hợp sự năng động và tinh tế</p>
            </Carousel.Caption>
          </Carousel.Item>
        </Carousel>
      </section>

      <Container className="my-4">
        {/* 4 sản phẩm mới nhất */}
        <section className="my-5">
          <h2 className="text-center fw-bold fs-2">SẢN PHẨM MỚI NHẤT</h2>
          <Row className="g-4 justify-content-start">
            {latest.map((p) => (
              <Col key={p.id} xs={6} sm={4} md={3} style={{ flexGrow: 0 }} >
                <Card className="h-100 d-flex flex-column shadow-sm product-card"
                  onClick={() => navigate(`/product/${p.slug}`)}>
                  <div className="image-wrapper" style={{ position: "relative" }}>
                    {p.image && (
                      <Card.Img variant="top" src={p.image} alt={p.name}
                        style={{
                          width: "100%",
                          height: "auto",
                          maxHeight: "400px",
                          objectFit: "cover",
                        }} />
                    )}
                    <span
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        background: "#28a745",
                        color: "#fff",
                        fontWeight: "bold",
                        padding: "4px 8px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        fontSize: "14px",
                      }}>
                      NEW
                    </span>
                    <div className="overlay">
                      <Button
                        variant="light"
                        size="sm"
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${p.slug}`);
                        }}>
                        <FaEye />
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openModalFor(p.slug);
                        }}>
                        <FaShoppingCart />
                      </Button>
                    </div>
                  </div>
                  <Card.Body>
                    <Card.Title
                      className="text-truncate"
                      style={{ maxWidth: "100%", fontSize: "0.95rem" }}>
                      {p.name}
                    </Card.Title>
                    <div className="d-flex justify-content-center align-items-center mt-2 gap-2">
                      <span className="fw-bold text-danger">
                        {formatCurrency(p.discounted_price || p.price)}
                      </span>
                      {p.discounted_price && p.discounted_price < p.price && (
                        <small className="text-muted text-decoration-line-through">
                          {formatCurrency(p.price)}
                        </small>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          {/* {Đặc biệt} */}
          <section className="special-boxes d-flex justify-content-between flex-wrap mt-5">
            {[
              { key: "polo", img: "/assets/slide-1-trang-chu-slide-1.png", link: "/category/ao-polo", width: "24%" },
              { key: "all", img: "/assets/slide-2-trang-chu-slide-2.png", link: "/products", width: "48%" },
              { key: "shirt", img: "/assets/slide-4-trang-chu-slide-3.png", link: "/category/ao-so-mi", width: "24%" },
            ].map((box, idx) => (
              <div
                key={`${box.key}-${idx}`}
                className="special-box mb-3"
                style={{ width: box.width, height: "350px", position: "relative" }}>
                <Link to={box.link} className="d-block h-100">
                  <img
                    src={box.img}
                    alt={box.key}
                    className="img-fluid rounded shadow-sm"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </Link>
              </div>
            ))}
          </section>
        </section>
        {/* Đồ Bộ */}
        <section className="my-5">
          <h2 className="text-center fw-bold fs-2">BỘ SƯU TẬP VEST</h2>
          <Row className="g-4 justify-content-start">
            {doBo.map((p) => (
              <Col key={p.id} xs={6} sm={4} md={3} style={{ flexGrow: 0 }} >
                <Card className="h-100 d-flex flex-column shadow-sm product-card"
                  onClick={() => navigate(`/product/${p.slug}`)}>
                  <div className="image-wrapper">
                    {p.image && (
                      <Card.Img
                        variant="top"
                        src={p.image}
                        alt={p.name}
                        style={{
                          width: "100%",
                          height: "auto",
                          maxHeight: "400px",
                          objectFit: "cover",
                        }} />
                    )}
                    {p.discount > 0 && (
                      <span className="discount-badge">-{p.discount}%</span>
                    )}
                    <div className="overlay">
                      <Button
                        variant="light"
                        size="sm"
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${p.slug}`);
                        }}>
                        <FaEye />
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openModalFor(p.slug);
                        }}>
                        <FaShoppingCart />
                      </Button>
                    </div>
                  </div>

                  <Card.Body>
                    <Card.Title className="text-truncate">{p.name}</Card.Title>
                    <div className="d-flex justify-content-center align-items-center mt-2 gap-2">
                      <span className="fw-bold text-danger">
                        {formatCurrency(p.discounted_price || p.price)}
                      </span>
                      {p.discounted_price && p.discounted_price < p.price && (
                        <small className="text-muted text-decoration-line-through">
                          {formatCurrency(p.price)}
                        </small>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* Phụ Kiện */}
        <section className="my-5">
          <h2 className="text-center fw-bold fs-2">PHỤ KIỆN THỜI TRANG</h2>
          <Row className="g-4 justify-content-start">
            {phuKien.map((p) => (
              <Col key={p.id} xs={6} sm={4} md={3} style={{ flexGrow: 0 }} >
                <Card className="h-100 d-flex flex-column shadow-sm product-card"
                  onClick={() => navigate(`/product/${p.slug}`)}>
                  <div className="image-wrapper">
                    {p.image && (
                      <Card.Img
                        variant="top"
                        src={p.image}
                        alt={p.name}
                        style={{
                          width: "100%",
                          height: "auto",
                          maxHeight: "400px",
                          objectFit: "cover",
                        }} />
                    )}
                    {p.discount > 0 && (
                      <span className="discount-badge">-{p.discount}%</span>
                    )}
                    <div className="overlay">
                      <Button
                        variant="light"
                        size="sm"
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${p.slug}`);
                        }}>
                        <FaEye />
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openModalFor(p.slug);
                        }}>
                        <FaShoppingCart />
                      </Button>
                    </div>
                  </div>
                  <Card.Body>
                    <Card.Title className="text-truncate">{p.name}</Card.Title>
                    <div className="d-flex justify-content-center align-items-center mt-2 gap-2">
                      <span className="fw-bold text-danger">
                        {formatCurrency(p.discounted_price || p.price)}
                      </span>
                      {p.discounted_price && p.discounted_price < p.price && (
                        <small className="text-muted text-decoration-line-through">
                          {formatCurrency(p.price)}
                        </small>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </section>
        <section className="my-5">
          <Row className="g-4 justify-content-start">
            {/* Thanh Toán & Giao Hàng */}
            <Col md={4} as="article">
              <Card className="h-100 shadow-sm border-0">
                <Card.Body>
                  <h2 className="fs-2 fw-bold">
                    <FaTruck className="me-2 text-primary" />
                    Thanh Toán & Giao Hàng
                  </h2>
                  <p>
                    Miễn phí vận chuyển cho đơn hàng trên{" "}
                    <strong>599.000 VNĐ</strong>
                  </p>
                  <ul className="mb-0">
                    <li>Giao hàng và thu tiền tận nơi</li>
                    <li>Chuyển khoản và giao hàng</li>
                    <li>Mua hàng trực tiếp tại shop</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>

            {/* Giờ Mở Cửa */}
            <Col md={4} as="article">
              <Card className="h-100 shadow-sm border-0">
                <Card.Body>
                  <h2 className="fs-2 fw-bold">
                    <FaClock className="me-2 text-success" />
                    Giờ Mở Cửa
                  </h2>
                  <p>
                    <strong>8h30 - 22h00</strong> (tất cả các ngày trong tuần)
                  </p>
                  <p>
                    Áp dụng cho toàn bộ chi nhánh hệ thống cửa hàng Fashion Clothing.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            {/* Hỗ Trợ */}
            <Col md={4} as="article">
              <Card className="h-100 shadow-sm border-0">
                <Card.Body>
                  <h2 className="fs-2 fw-bold">
                    <FaPhoneAlt className="me-2 text-danger" />
                    Hỗ Trợ 24/7
                  </h2>
                  <p>Gọi ngay cho chúng tôi khi bạn có thắc mắc:</p>
                  <p>
                    <strong>0868.444.644</strong>
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </section>
        <ProductDetailModal
          slug={selectedSlug}
          show={showDetail}
          onHide={closeModal}
        />
      </Container>
    </main>
  );
};

export default HomePage;
