import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../../api/axios";
import { Spinner, Card, Container, Row, Col, Button } from "react-bootstrap";
import { formatCurrency } from "../../../utils/format";
import { FaEye, FaShoppingCart } from "react-icons/fa";
import "./../Categories/Categories.css";
import ProductDetailModal from "../../../components/client/ProductDetailModal/ProductDetailModal";

interface Product {
    id: number;
    name: string;
    price: number;
    discounted_price?: number;
    image?: string;
    discount: number;
    slug: string;
}

const ProductDiscountPage: React.FC = () => {
    const navigate = useNavigate();

    const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);
    const [latestProducts, setLatestProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"discount" | "new">("discount"); // tab active

    // modal state (global for the page)
    const [showDetail, setShowDetail] = useState(false);
    const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const resDiscount = await api.get("/api/customer/products-discounted");
                setDiscountedProducts(Array.isArray(resDiscount.data.discounted_products) ? resDiscount.data.discounted_products : []);

                const resLatest = await api.get("/api/customer/products-latest", { params: { limit: 12 } });
                setLatestProducts(Array.isArray(resLatest.data) ? resLatest.data : []);
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Lỗi khi tải sản phẩm");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="text-center my-5"><Spinner animation="border" /> Đang tải sản phẩm...</div>;
    if (error) return <div className="text-danger text-center my-5">{error}</div>;

    const openModalFor = (slug: string) => {
        setSelectedSlug(slug);
        setShowDetail(true);
    };

    const closeModal = () => {
        setShowDetail(false);
        setSelectedSlug(null);
    };

    return (
        <Container className="my-4">
            <nav aria-label="breadcrumb"
                style={{ backgroundColor: "#f5f5f5", padding: "0.75rem 1rem", borderRadius: "0.25rem", marginBottom: "0.75rem", }}>
                <div className="d-flex justify-content-between align-items-center">
                    <ol className="breadcrumb mb-0">
                        <li className="breadcrumb-item fs-6">
                            <Link to="/">Trang chủ</Link>
                        </li>
                        <li className="breadcrumb-item fs-6">
                            <Link to="/products">Danh mục</Link>
                        </li>
                        <li
                            className="breadcrumb-item active fs-6"
                            aria-current="page">
                            Giảm giá
                        </li>
                    </ol>
                </div>
            </nav>

            <div className="d-flex justify-content-center gap-2 mb-3">
                <Button
                    variant={activeTab === "discount" ? "primary" : "outline-secondary"}
                    onClick={() => setActiveTab("discount")}>
                    Sản phẩm giảm giá
                </Button>
                <Button
                    variant={activeTab === "new" ? "primary" : "outline-secondary"}
                    onClick={() => setActiveTab("new")}>
                    Sản phẩm mới
                </Button>
            </div>

            {/* Nội dung theo tab */}
            {activeTab === "discount" && (
                <Row className="g-4 justify-content-start">
                    {discountedProducts.map((p) => (
                        <Col key={p.id} xs={6} sm={4} md={3} style={{ flexGrow: 0 }}>
                            <Card className="h-100 d-flex flex-column shadow-sm product-card" onClick={() => navigate(`/product/${p.slug}`)}>
                                <div className="image-wrapper">
                                    {p.image && (
                                        <Card.Img
                                            variant="top"
                                            src={p.image}
                                            alt={p.name}
                                            style={{ width: "100%", height: "auto", maxHeight: "400px", objectFit: "cover" }}
                                        />
                                    )}
                                    {p.discount > 0 && <span className="discount-badge">-{p.discount}%</span>}
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
                                        <span className="fw-bold text-danger">{formatCurrency(p.discounted_price || p.price)}</span>
                                        {p.discounted_price && p.discounted_price < p.price && (
                                            <small className="text-muted text-decoration-line-through">{formatCurrency(p.price)}</small>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {activeTab === "new" && (
                <Row className="g-4 justify-content-start">
                    {latestProducts.map((p) => (
                        <Col key={p.id} xs={6} sm={4} md={3} style={{ flexGrow: 0 }}>
                            <Card className="h-100 d-flex flex-column shadow-sm product-card" onClick={() => navigate(`/product/${p.slug}`)}>
                                <div className="image-wrapper">
                                    {p.image && (
                                        <Card.Img
                                            variant="top"
                                            src={p.image}
                                            alt={p.name}
                                            style={{ width: "100%", height: "auto", maxHeight: "400px", objectFit: "cover" }}
                                        />
                                    )}
                                    <span className="discount-badge text-white" style={{ backgroundColor: "green" }}>NEW</span>
                                    <div className="overlay">
                                        <Button
                                            variant="light"
                                            size="sm"
                                            className="icon-btn"
                                            onClick={(e) => { e.stopPropagation(); navigate(`/product/${p.slug}`); }}>
                                            <FaEye />
                                        </Button>
                                        <Button
                                            variant="light"
                                            size="sm"
                                            className="icon-btn"
                                            onClick={(e) => { e.stopPropagation(); openModalFor(p.slug); }}>
                                            <FaShoppingCart />
                                        </Button>
                                    </div>
                                </div>
                                <Card.Body>
                                    <Card.Title className="text-truncate">{p.name}</Card.Title>
                                    <div className="d-flex justify-content-center align-items-center mt-2 gap-2">
                                        <span className="fw-bold text-danger">{formatCurrency(p.discounted_price || p.price)}</span>
                                        {p.discounted_price && p.discounted_price < p.price && (
                                            <small className="text-muted text-decoration-line-through">{formatCurrency(p.price)}</small>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
            <ProductDetailModal
                slug={selectedSlug}
                show={showDetail}
                onHide={closeModal}
            />
        </Container>
    );
};

export default ProductDiscountPage;
