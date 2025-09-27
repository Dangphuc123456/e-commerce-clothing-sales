// src/pages/customer/SearchPage.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import api from "../../../api/axios";
import { Spinner, Row, Col, Button, Card, Form } from "react-bootstrap";
import { FaEye, FaShoppingCart } from "react-icons/fa";
import { formatCurrency } from "../../../utils/format";
import "./../Home/Home.css";

interface Product {
    id: number;
    name: string;
    slug: string;
    image?: string;
    price: number;
    discounted_price?: number;
    discount: number;
}

const PRODUCTS_PER_PAGE = 20;

const SearchPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const query = new URLSearchParams(location.search).get("q") || "";
    const [currentPage, setCurrentPage] = useState(1);
    const [sortOrder, setSortOrder] = useState<"default" | "asc" | "desc">("default");

    const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);

    useEffect(() => {
        if (!query) return;

        const fetchProducts = async () => {
            setLoading(true);
            try {
                const res = await api.get("/api/customer/search", {
                    params: { q: query },
                });
                setProducts(res.data || []);
                setCurrentPage(1);
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [query]);

    const getCurrentPageProducts = () => {
        let sorted = [...products];

        if (sortOrder === "asc") {
            sorted.sort((a, b) => (a.discounted_price ?? a.price) - (b.discounted_price ?? b.price));
        } else if (sortOrder === "desc") {
            sorted.sort((a, b) => (b.discounted_price ?? b.price) - (a.discounted_price ?? a.price));
        }

        const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
        return sorted.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
    };

    const getVisiblePages = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 4) pages.push("...");
            const start = Math.max(2, currentPage - 2);
            const end = Math.min(totalPages - 1, currentPage + 2);
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 3) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <main className="container py-4">
            <nav
                aria-label="breadcrumb"
                style={{
                    backgroundColor: "#f5f5f5",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.25rem",
                    marginBottom: "0.75rem",
                }}>
                <div className="d-flex justify-content-between align-items-center">
                    <ol className="breadcrumb mb-0">
                        <li className="breadcrumb-item fs-5">
                            <Link to="/">Trang chủ</Link>
                        </li>
                        <li className="breadcrumb-item fs-5">
                            <Link to="/products">Danh mục</Link>
                        </li>
                        <li className="breadcrumb-item active fs-5" aria-current="page">
                            Tìm kiếm
                        </li>
                    </ol>
                    <Form.Select
                        value={sortOrder}
                        onChange={(e) => {
                            setSortOrder(e.target.value as "default" | "asc" | "desc");
                            setCurrentPage(1);
                        }}
                        style={{ width: "200px" }}>
                        <option value="default">Mặc định</option>
                        <option value="asc">Giá: Thấp → Cao</option>
                        <option value="desc">Giá: Cao → Thấp</option>
                    </Form.Select>
                </div>
            </nav>
            {/* Header */}
            <header className="mb-4 text-center">
                <h1 className="fs-3 fw-bold">Kết quả tìm kiếm</h1>
                {loading ? (
                    <p className="text-muted">Đang tìm kiếm...</p>
                ) : (
                    <p className="fs-5">
                        Tìm thấy <strong>{products.length}</strong> sản phẩm cho từ khóa:{" "}
                        <span className="text-primary">"{query}"</span>
                    </p>
                )}
            </header>
            {
                loading && (
                    <div className="text-center my-4">
                        <Spinner animation="border" role="status" aria-label="Đang tải kết quả" />
                    </div>
                )
            }
            {
                !loading && products.length === 0 && (
                    <p className="text-center">Không tìm thấy sản phẩm nào phù hợp.</p>
                )
            }
            {
                !loading && products.length > 0 && (
                    <section aria-label="Danh sách sản phẩm tìm kiếm">
                         <Row className="g-4 justify-content-start">
                            {getCurrentPageProducts().map((prod) => (
                               <Col key={prod.id} xs={6} sm={4} md={3} style={{ flexGrow: 0 }} >
                                    <Card
                                        className="h-100 d-flex flex-column shadow-sm product-card"
                                        onClick={() => navigate(`/product/${prod.slug}`)}>
                                        <div className="image-wrapper" style={{ position: "relative" }}>
                                            {prod.image && (
                                                <Card.Img
                                                    variant="top"
                                                    src={prod.image}
                                                    alt={prod.name}
                                                    style={{
                                                        width: "100%",
                                                        height: "auto",
                                                        maxHeight: "400px",
                                                        objectFit: "cover",
                                                    }}
                                                />
                                            )}
                                            {prod.discount > 0 && (
                                                <span className="discount-badge">-{prod.discount}%</span>
                                            )}

                                            <div className="overlay">
                                                {[
                                                    { icon: <FaEye />, action: () => navigate(`/product/${prod.slug}`) },
                                                    { icon: <FaShoppingCart />, action: () => console.log("Add to cart", prod.id) },
                                                ].map((btn, i) => (
                                                    <Button
                                                        key={i}
                                                        variant="light"
                                                        size="sm"
                                                        className="icon-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            btn.action();
                                                        }}>
                                                        {btn.icon}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        <Card.Body>
                                            <Card.Title
                                                className="text-truncate"
                                                style={{ maxWidth: "100%", fontSize: "0.95rem" }}>
                                                {prod.name}
                                            </Card.Title>
                                            <div className="d-flex justify-content-center align-items-center mt-2 gap-2">
                                                <span className="fw-bold text-danger">
                                                    {formatCurrency(prod.discounted_price || prod.price)}
                                                </span>
                                                {prod.discounted_price && prod.discounted_price < prod.price && (
                                                    <small className="text-muted text-decoration-line-through">
                                                        {formatCurrency(prod.price)}
                                                    </small>
                                                )}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <nav className="mt-4">
                                <ul className="pagination mb-0 justify-content-center">
                                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}>
                                            ‹
                                        </button>
                                    </li>
                                    {getVisiblePages().map((page, idx) =>
                                        typeof page === "string" ? (
                                            <li key={idx} className="page-item disabled">
                                                <span className="page-link">{page}</span>
                                            </li>
                                        ) : (
                                            <li
                                                key={idx}
                                                className={`page-item ${currentPage === page ? "active" : ""}`}>
                                                <button className="page-link" onClick={() => setCurrentPage(page)}>
                                                    {page}
                                                </button>
                                            </li>
                                        )
                                    )}
                                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}>
                                            ›
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        )}
                    </section>
                )
            }
        </main >
    );
};

export default SearchPage;
