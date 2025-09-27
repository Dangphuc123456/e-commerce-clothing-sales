import React, { useEffect, useState } from "react";
import { Modal, Spinner, Image, Badge, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import { useAppDispatch } from "../../../hooks/reduxHooks";
import { addToCart } from "../../../slices/cartSlice";
import { formatCurrency } from "../../../utils/format";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type ProductDetail = {
    id: number;
    name: string;
    slug: string;
    price: number;
    image?: string;
    description?: string;
    discount?: number;
    discounted_price?: number;
    variants?: {
        id: number;
        name: string;
        price: number;
        stock?: number;
        sku?: string;
        size?: string;
        color?: string;
    }[];
};

interface Props {
    slug: string | null;
    show: boolean;
    onHide: () => void;
}

const ProductDetailModal: React.FC<Props> = ({ slug, show, onHide }) => {
    const [loading, setLoading] = useState(false);
    const [product, setProduct] = useState<ProductDetail | null>(null);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (!slug || !show) return;
        const fetchDetail = async () => {
            setLoading(true);
            try {
                const res = await api.get<{ product?: ProductDetail }>(
                    `/api/customer/product/${slug}`
                );
                const payload = (res.data as any).product ?? res.data;
                setProduct(payload as ProductDetail);
            } catch (err) {
                console.error("fetch product detail error:", err);
                toast.error("Không tải được chi tiết sản phẩm");
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [slug, show]);

    const handleBuyNow = async () => {
        if (!product) return;
        const userId = localStorage.getItem("userId");
        if (!userId) {
            alert("Bạn cần đăng nhập để mua hàng");
            navigate("/login");
            return;
        }
        const finalPrice =
            product.discounted_price && product.discounted_price > 0
                ? product.discounted_price
                : product.price;

        try {
            await dispatch(
                addToCart({
                    userId: Number(userId),
                    productName: product.name,
                    variantId: product.variants?.[0]?.id ?? 0,
                    sku: product.variants?.[0]?.sku ?? undefined,
                    size: product.variants?.[0]?.size ?? undefined,
                    color: product.variants?.[0]?.color ?? undefined,
                    image: product.image,
                    price: finalPrice,
                    discounted_price: product.discounted_price ?? null,
                    quantity: 1,
                })
            ).unwrap();

            toast.success("Đã thêm vào giỏ hàng 🎉");
            onHide();
            navigate("/cart");
        } catch (err) {
            console.error(err);
            toast.error("Xin lỗi, đã hết hàng 😢");
        }
    };

    return (
        <>
            <ToastContainer />
            <Modal show={show} onHide={onHide} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết sản phẩm</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loading && (
                        <div className="text-center py-4">
                            <Spinner animation="border" /> Đang tải...
                        </div>
                    )}
                    {!loading && product && (
                        <div className="d-flex gap-3">
                            <div style={{ width: 240 }}>
                                <Image src={product.image || "/no-image.png"} fluid className="rounded" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h5>
                                    {product.name}{" "}
                                    {product.discount && product.discount > 0 && (
                                        <Badge bg="success" className="ms-2">
                                            -{product.discount}%
                                        </Badge>
                                    )}
                                </h5>
                                <strong className="text-danger fs-5">
                                    {formatCurrency(product.discounted_price ?? product.price)}
                                </strong>
                                {product.discount && product.discount > 0 && (
                                    <small className="text-muted ms-2 text-decoration-line-through">
                                        {formatCurrency(product.price)}
                                    </small>
                                )}
                                {product.description && <p>{product.description}</p>}
                                {product.variants && product.variants.length > 0 && (
                                    <>
                                        <div className="fw-bold">Phiên bản</div>
                                        <div className="d-flex gap-2 flex-wrap">
                                            {product.variants.map((v) => (
                                                <Badge
                                                    key={v.id}
                                                    bg="light"
                                                    text="dark"
                                                    className="border">
                                                    {v.name} — {Math.round(v.price).toLocaleString()}₫
                                                </Badge>
                                            ))}
                                        </div>
                                    </>
                                )}
                                <div className="mt-3 d-flex gap-2">
                                    <Button
                                        variant="primary"
                                        onClick={() => navigate(`/product/${product.slug}`)}>
                                        Xem trang sản phẩm
                                    </Button>
                                    <Button variant="success" onClick={handleBuyNow}>
                                        Mua ngay
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
};

export default ProductDetailModal;
