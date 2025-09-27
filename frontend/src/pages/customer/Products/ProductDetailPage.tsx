import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import { Container, Row, Col, Image, Spinner, Button, Card } from "react-bootstrap";
import { FaEye, FaShoppingCart } from "react-icons/fa";
import { formatCurrency } from "../../../utils/format";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Products.css";
import { useAppDispatch } from "../../../hooks/reduxHooks";
import { addToCart } from "../../../slices/cartSlice";
import ProductDetailModal from "../../../components/client/ProductDetailModal/ProductDetailModal";

// Kiểu dữ liệu
interface ProductVariant {
    id: number;
    size: string;
    color: string;
    price: number;
    discounted_price?: number;
    stock: number;
    sku: string;
    image?: string;
}

interface Product {
    id: number;
    name: string;
    description?: string;
    price: number;
    discounted_price?: number;
    discount: number;
    image?: string;
    slug: string;
    variants: ProductVariant[];
}

const ProductDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [showDetail, setShowDetail] = useState(false);
    const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;

        const fetchProduct = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/api/customer/product/${slug}`);
                const data = res.data;

                const mappedProduct: Product = {
                    ...data,
                    variants: (data.Variants || []).map((v: any) => ({
                        ...v,
                        discounted_price: v.discounted_price ?? undefined,
                    })),
                    discounted_price: data.discounted_price ?? undefined,
                };

                setProduct(mappedProduct);

                if (mappedProduct.variants.length > 0) {
                    setSelectedColor(mappedProduct.variants[0].color);
                    setSelectedVariant(mappedProduct.variants[0]);
                }

                const randomRes = await api.get(`/api/customer/products-random?limit=8`);
                const mappedRelated = (randomRes.data || []).map((p: any) => ({
                    ...p,
                    discounted_price: p.discounted_price ?? undefined,
                }));
                setRelatedProducts(mappedRelated.filter((p: Product) => p.slug !== slug));
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Lỗi khi tải sản phẩm");
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [slug]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [slug]);

    if (loading) return <div className="text-center my-5"><Spinner animation="border" /> Đang tải...</div>;
    if (error) return <div className="text-danger text-center my-5">{error}</div>;
    if (!product) return <div className="text-center my-5">Sản phẩm không tồn tại</div>;

    const colors = Array.from(new Set(product.variants.map(v => v.color)));
    const sizes = product.variants.filter(v => v.color === selectedColor);
    const displayPrice = selectedVariant?.discounted_price ?? selectedVariant?.price ?? product.price;
    const originalPrice = selectedVariant?.discounted_price ? selectedVariant.price : null;

    const handleAddToCart = async (buyNow = false) => {
        if (!selectedVariant || !product) {
            alert("Vui lòng chọn màu/size trước khi thêm vào giỏ hàng");
            return;
        }

        const userId = localStorage.getItem("userId");
        if (!userId) {
            alert("Bạn cần đăng nhập để mua hàng");
            navigate("/login");
            return;
        }

        try {
            await dispatch(
                addToCart({
                    userId: Number(userId),
                    productName: product.name || "",
                    variantId: selectedVariant.id,
                    sku: selectedVariant.sku,
                    size: selectedVariant.size,
                    color: selectedVariant.color,
                    image: selectedVariant.image || product.image,
                    price: selectedVariant.price,
                    discounted_price: selectedVariant.discounted_price ?? null,
                    quantity,
                })
            ).unwrap();

            if (buyNow) {
                navigate("/cart");
            } else {
                toast.success("Đã thêm sản phẩm vào giỏ hàng!");
            }
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi thêm vào giỏ hàng");
        }
    };
    const openModalFor = (slug: string) => {
        setSelectedSlug(slug);
        setShowDetail(true);
    };
    const closeModal = () => {
        setShowDetail(false);
        setSelectedSlug(null);
    };
    return (
        <Container className="my-3 custom-container">
            <ToastContainer />
            <nav aria-label="breadcrumb" style={{ backgroundColor: "#f5f5f5", padding: "0.75rem 1rem", borderRadius: "0.25rem", marginBottom: "0.75rem" }}>
                <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item fs-6"><Link to="/">Trang chủ</Link></li>
                    <li className="breadcrumb-item fs-6"><Link to="/products">Danh mục</Link></li>
                    <li className="breadcrumb-item active fs-6" aria-current="page">
                        {product.name}
                    </li>
                </ol>
            </nav>

            {/* Nội dung sản phẩm */}
            <Row className="d-flex align-items-start">
                <Col xs={12} md={6}>
                    <Image
                        src={selectedVariant?.image || product.image}
                        alt={product.name}
                        fluid rounded
                        className="mb-3 product-main-img"
                    />
                </Col>

                <Col xs={12} md={6}>
                    <h1 className="fs-3 mb-3">{product.name}</h1>
                    {selectedVariant && (
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <p className="mb-0 text-muted fw-bold fs-5">
                                Mã sản phẩm: <span className="fs-5">{selectedVariant.sku}</span>
                            </p>/
                            <p className="mb-0 text-muted fw-bold fs-5">
                                {selectedVariant.stock > 0
                                    ? `Số lượng: ${selectedVariant.stock}`
                                    : "Hết hàng"} sản phẩm
                            </p>
                        </div>
                    )}
                    <div className="d-flex align-items-center gap-3 my-2 mt-2">
                        <span className="fw-bold text-danger" style={{ fontSize: "1.5rem" }}>
                            {formatCurrency(displayPrice)}
                        </span>
                        {originalPrice && (
                            <small className="text-muted text-decoration-line-through">
                                {formatCurrency(originalPrice)}
                            </small>
                        )}
                    </div>

                    {/* Mô tả */}
                    <h2 className="fs-5">Mô tả sản phẩm</h2>
                    <p className="product-description">{product.description}</p>

                    {/* Màu & Size */}
                    <h2 className="fs-5 mt-3">Chọn màu & size</h2>
                    <div className="d-flex gap-2 mb-3">
                        {colors.map(color => {
                            const variant = product.variants.find(v => v.color === color)!;
                            return (
                                <Button
                                    key={color}
                                    variant={selectedColor === color ? "primary" : "outline-secondary"}
                                    size="sm"
                                    style={{ width: "70px", height: "100px", padding: 0 }}
                                    onClick={() => {
                                        setSelectedColor(color);
                                        const found = product.variants.find(v => v.color === color) || null;
                                        setSelectedVariant(found);
                                        setQuantity(1); 
                                    }}>
                                    <Image
                                        src={variant.image || product.image}
                                        alt={color}
                                        style={{ width: "100%", height: "90px", objectFit: "cover" }}
                                        rounded/>
                                </Button>
                            );
                        })}
                    </div>

                    <div className="d-flex flex-wrap gap-2 mb-3">
                        {sizes.map(v => (
                            <Button
                                key={v.id}
                                variant={selectedVariant?.id === v.id ? "primary" : "outline-secondary"}
                                size="sm"
                                style={{ flex: "0 0 20%", textAlign: "center", padding: "4px 8px" }}
                                onClick={() => {
                                    setSelectedVariant(v);
                                    setQuantity(1);
                                }}
                            >
                                {v.size}
                            </Button>
                        ))}
                    </div>

                    {/* Ưu đãi */}
                    <div className="mb-3 p-2 border rounded bg-light">
                        <h2 className="fs-5">Ưu đãi thêm</h2>
                        <ul className="fs-5">
                            <li>Freeship đơn hàng &gt;495K</li>
                            <li>Sửa và là đồ miễn phí</li>
                            <li>Đổi/trả hàng 30 ngày miễn phí</li>
                            <li>Bảo hành sản phẩm lên đến 1 năm</li>
                        </ul>
                    </div>

                    {/* Số lượng & CTA */}
                    <div className="mb-3">
                        <h2 className="fs-5 mb-2">Số lượng & Liên hệ</h2>
                        <div className="d-flex flex-wrap gap-2 mt-3">
                            <div className="quantity-container d-flex">
                                <Button
                                    variant="light"
                                    size="sm"
                                    className="py-2 text-muted"
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    disabled={!selectedVariant || selectedVariant.stock === 0 || quantity <= 1}
                                >-</Button>
                                <span className="py-2">{quantity}</span>
                                <Button
                                    variant="light"
                                    size="sm"
                                    className="py-2 text-muted"
                                    onClick={() => setQuantity(q => Math.min(selectedVariant!.stock, q + 1))}
                                    disabled={!selectedVariant || selectedVariant.stock === 0 || quantity >= (selectedVariant?.stock || 0)}
                                >+</Button>
                            </div>
                            <div className="p-2 border rounded bg-light shadow-sm fw-bold flex-shrink-0">
                                Gọi đặt mua: +84 123 456 7899 (8:00 - 22:00)
                            </div>
                        </div>

                        <div className="d-flex flex-wrap gap-2 mt-3">
                            <Button
                                variant="primary"
                                size="lg"
                                className="flex-grow-1 py-3 fs-5"
                                disabled={!selectedVariant || selectedVariant.stock === 0}
                                onClick={() => handleAddToCart(false)}>
                                {selectedVariant?.stock === 0 ? "Hết hàng" : "Thêm vào giỏ"}
                            </Button>
                            <Button
                                variant="success"
                                size="lg"
                                className="flex-grow-1 py-3 fs-5"
                                disabled={!selectedVariant || selectedVariant.stock === 0}
                                onClick={() => handleAddToCart(true)}>
                                {selectedVariant?.stock === 0 ? "Hết hàng" : "Mua ngay"}
                            </Button>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Sản phẩm liên quan */}
            {relatedProducts.length > 0 && (
                <section className="mt-5">
                    <h2 className="fs-3 mb-4 text-center bg-light p-2 rounded">Các sản phẩm khác</h2>
                    <Row>
                        {relatedProducts.map(p => (
                            <Col xs={6} md={3} key={p.id} className="mb-3">
                                <Card
                                    className="h-100 d-flex flex-column shadow-sm product-card"
                                    onClick={() => navigate(`/product/${p.slug}`)}
                                >
                                    <div className="image-wrapper">
                                        {p.image && (
                                            <Card.Img
                                                variant="top"
                                                src={p.image}
                                                alt={p.name}
                                                style={{ width: "100%", maxHeight: "380px", objectFit: "cover" }}
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
                                            <span className="fw-bold text-danger">
                                                {formatCurrency(p.discounted_price ?? p.price)}
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
            )}
            {/* ProductDetailModal được render ở đây (toàn cục trong trang) */}
            <ProductDetailModal
                slug={selectedSlug}
                show={showDetail}
                onHide={closeModal}
            />
        </Container>
    );
};

export default ProductDetailPage;
