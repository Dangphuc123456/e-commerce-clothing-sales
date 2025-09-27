import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import { formatCurrency } from "../../../utils/format";
import { FaEye, FaShoppingCart } from "react-icons/fa"

interface Product {
    id: number;
    name: string;
    price: number;
    discounted_price?: number;
    image?: string;
    discount: number;
    slug: string;
}

const ThankYouPage: React.FC = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get("/api/customer/products-random", { params: { limit: 8 } });
                setProducts(res.data);
            } catch (err) {
                console.error("❌ Lỗi khi fetch sản phẩm:", err);
            }
        };
        fetchProducts();
    }, []);

    return (
        <Container className="my-5 text-center">
            <h1 className="display-4 mb-3 fs-3">Thank you for buying!</h1>
            <p className="lead mb-4">
                Cảm ơn bạn đã đặt hàng tại cửa hàng chúng tôi. <br />
                Chúc bạn có những trải nghiệm mua sắm tuyệt vời!
            </p>
            <div className="mb-5">
                <Button variant="primary" size="lg" className="me-3 fs-5" onClick={() => navigate("/")}>
                    🏠 Trang chủ
                </Button>
                <Button variant="outline-secondary" className="me-3 fs-5" size="lg" onClick={() => navigate("/orders")}>
                    📦 Xem đơn hàng
                </Button>
            </div>
            <h2 className="mb-4 fs-3">Sản phẩm bạn có thể thích</h2>
            <Row className="g-4 justify-content-start">
                {products.map((p) => (
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
                                    {[
                                        { icon: <FaEye />, action: () => navigate(`/product/${p.slug}`) },
                                        { icon: <FaShoppingCart />, action: () => console.log("Add to cart", p.id) },
                                    ].map((btn, i) => (
                                        <Button
                                            key={i}
                                            variant="light"
                                            size="sm"
                                            className="icon-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                btn.action();
                                            }} >
                                            {btn.icon}
                                        </Button>
                                    ))}
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
        </Container>
    );
};

export default ThankYouPage;
