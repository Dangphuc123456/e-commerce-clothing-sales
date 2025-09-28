import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../../api/axios";
import { Spinner, Card, Button, Container, Row, Col, Form } from "react-bootstrap";
import { formatCurrency } from "../../../utils/format";
import { FaEye, FaShoppingCart } from "react-icons/fa";
import "./Categories.css";
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
interface Product {
  id: number;
  name: string;
  price: number;
  sold_price?: number;
  image?: string;
  slug: string;
}
const PRODUCTS_PER_PAGE = 15;

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortOrder, setSortOrder] = useState<"default" | "asc" | "desc">("default");
  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);

  const [showDetail, setShowDetail] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);

        const res = await api.get<Product[]>(`/api/customer/products`, {
          params: { slug },
        });
        setProducts(res.data);

        const latestRes = await api.get("/api/customer/products-latest", {
          params: { limit: 4 },
        });
        setLatestProducts(Array.isArray(latestRes.data) ? latestRes.data : []);

        const bestSellerRes = await api.get("/api/customer/products-best-sellers", {
          params: { limit: 6 },
        });

        const rawBestSellers = bestSellerRes.data.best_sellers || [];

        const mappedBestSellers: Product[] = rawBestSellers.map((item: any) => ({
          id: item.product_id,
          name: item.product_name,
          price: item.price,
          image: item.image,
          sold_price: item.sold_price,
          discount: item.discount ?? 0,
          slug: item.slug,
        }));

        setBestSellers(mappedBestSellers);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Lỗi khi tải sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [slug]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug, currentPage]);

  const getCurrentPageProducts = () => {
    let sorted = [...products];

    if (sortOrder === "asc") {
      sorted.sort(
        (a, b) => (a.discounted_price ?? a.price) - (b.discounted_price ?? b.price)
      );
    } else if (sortOrder === "desc") {
      sorted.sort(
        (a, b) => (b.discounted_price ?? b.price) - (a.discounted_price ?? a.price)
      );
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
        <Spinner animation="border" /> Đang tải sản phẩm...
      </div>
    );
  if (error)
    return <div className="text-danger text-center my-5">{error}</div>;
  if (products.length === 0)
    return (
      <div className="text-center my-5">
        Chưa có sản phẩm nào trong danh mục này.
      </div>
    );

  return (
    <Container className="my-4">
      <nav
        aria-label="breadcrumb" style={{
          backgroundColor: "#f5f5f5",
          padding: "0.75rem 1rem",
          borderRadius: "0.25rem",
          marginBottom: "0.75rem",
        }}>
        <div className="d-flex justify-content-between align-items-center">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item fs-6">
              <Link to="/">Trang chủ</Link>
            </li>
            <li className="breadcrumb-item fs-6">
              <Link to="/products">Danh mục</Link>
            </li>
            <li className="breadcrumb-item active fs-6" aria-current="page">
              {slug}
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

      {/* layout sản phẩm + sidebar */}
      <div className="d-flex flex-nowrap">
        <div style={{ flex: "0 1 70%", minWidth: "300px", marginRight: "15px" }}>
          <Row xs={1} sm={2} md={3} className="g-4">
            {getCurrentPageProducts().map((prod) => (
              <Col key={prod.id}>
                <Card
                  className="h-100 shadow-sm product-card"
                  onClick={() => navigate(`/product/${prod.slug}`)}>
                  <div className="image-wrapper">
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
                        }} />
                    )}
                    {prod.discount > 0 && (
                      <span className="discount-badge">-{prod.discount}%</span>
                    )}
                    <div className="overlay">
                      <Button
                        variant="light"
                        size="sm"
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${prod.slug}`);
                        }}>
                        <FaEye />
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openModalFor(prod.slug);
                        }}>
                        <FaShoppingCart />
                      </Button>
                    </div>
                  </div>
                  <Card.Body>
                    <Card.Title className="text-truncate">{prod.name}</Card.Title>
                    <div className="d-flex justify-content-center align-items-center mt-2 gap-2">
                      <span className="fw-bold text-danger">
                        {formatCurrency(prod.discounted_price || prod.price)}
                      </span>
                      {prod.discounted_price &&
                        prod.discounted_price < prod.price && (
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

          {/* pagination */}
          {totalPages > 1 && (
            <nav className="mt-4">
              <ul className="pagination mb-0">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage - 1)}>
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
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(page)}>
                        {page}
                      </button>
                    </li>
                  )
                )}
                <li
                  className={`page-item ${currentPage === totalPages ? "disabled" : ""
                    }`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage + 1)}>
                    ›
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>

        {/* sidebar */}
        <div style={{ flex: "0 1 30%", minWidth: "200px" }}>
          <h5 className="mb-3 fs-3">Sản phẩm mới</h5>
          {latestProducts.map((prod) => (
            <Card
              key={prod.id}
              className="mb-3 shadow-sm p-2"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/product/${prod.slug}`)}>
              <div className="d-flex align-items-center flex-nowrap">
                {prod.image && (
                  <img
                    src={prod.image}
                    alt={prod.name}
                    style={{
                      width: "60px",
                      height: "90px",
                      objectFit: "cover",
                      borderRadius: "4px",
                      marginRight: "10px",
                      flexShrink: 0,
                    }} />
                )}
                <div className="flex-grow-1 text-truncate">
                  <Card.Title
                    className="mb-1"
                    style={{
                      fontSize: "0.9rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                    {prod.name}
                  </Card.Title>
                  <div>
                    <span className="fw-bold text-danger" style={{ fontSize: "0.85rem" }}>
                      {formatCurrency(prod.discounted_price || prod.price)}
                    </span>
                    {prod.discounted_price && prod.discounted_price < prod.price && (
                      <small
                        className="text-muted text-decoration-line-through ms-1"
                        style={{ fontSize: "0.75rem" }}>
                        {formatCurrency(prod.price)}
                      </small>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
          <h5 className="mt-4 mb-3">Sản phẩm bán chạy</h5>
          {bestSellers.map((prod) => (
            <Card
              key={prod.id}
              className="mb-3 shadow-sm p-2"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/product/${prod.slug}`)}>
              <div className="d-flex align-items-center flex-nowrap">
                {prod.image && (
                  <img
                    src={prod.image}
                    alt={prod.name}
                    style={{
                      width: "60px",
                      height: "90px",
                      objectFit: "cover",
                      borderRadius: "4px",
                      marginRight: "10px",
                      flexShrink: 0,
                    }} />
                )}
                <div className="flex-grow-1 text-truncate">
                  <Card.Title
                    className="mb-1"
                    style={{
                      fontSize: "0.9rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                    {prod.name}
                  </Card.Title>
                  <div>
                    <span className="fw-bold text-danger" style={{ fontSize: "0.85rem" }}>
                      {formatCurrency(prod.sold_price || prod.price)}
                    </span>
                    {prod.sold_price && prod.sold_price < prod.price && (
                      <small
                        className="text-muted text-decoration-line-through ms-1"
                        style={{ fontSize: "0.75rem" }}>
                        {formatCurrency(prod.price)}
                      </small>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <ProductDetailModal
        slug={selectedSlug}
        show={showDetail}
        onHide={closeModal}
      />
    </Container>
  );
};

export default CategoryPage;
