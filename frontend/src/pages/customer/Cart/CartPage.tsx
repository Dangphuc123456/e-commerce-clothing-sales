import React, { useEffect, useState } from "react";
import { Container, Button, Table, Image, Form, Row, Col } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../../../hooks/reduxHooks";
import { fetchCart, removeFromCart, updateCartItem } from "../../../slices/cartSlice";
import { formatCurrency } from "../../../utils/format";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const CartPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { items, loading } = useAppSelector((state) => state.cart);

    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    const [localQuantities, setLocalQuantities] = useState<{ [variantId: number]: number }>({});

    useEffect(() => {
        dispatch(fetchCart());
    }, [dispatch]);

    useEffect(() => {
        const qty: { [variantId: number]: number } = {};
        items.forEach((item) => (qty[item.variantId] = item.quantity));
        setLocalQuantities(qty);
        setSelectedItems(new Set());
    }, [items]);

    const toggleSelect = (variantId: number) => {
        setSelectedItems((prev) => {
            const newSet = new Set(prev);
            newSet.has(variantId) ? newSet.delete(variantId) : newSet.add(variantId);
            return newSet;
        });
    };

    const selectAll = () => {
        if (selectedItems.size === items.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(items.map((i) => i.variantId)));
        }
    };

    const handleRemoveSelected = async () => {
        if (selectedItems.size === 0) {
            toast.warn("Vui lòng chọn sản phẩm để xóa");
            return;
        }

        try {
            await Promise.all(
                Array.from(selectedItems).map((variantId) =>
                    dispatch(removeFromCart({ variantId })).unwrap()
                )
            );
            toast.success("Xóa sản phẩm thành công!");
            setSelectedItems(new Set());
        } catch (err) {
            console.error(err);
            toast.error("Xóa sản phẩm thất bại");
        }
    };


    const handleCheckout = () => {
        if (selectedItems.size === 0) {
            toast.warn("Vui lòng chọn sản phẩm để thanh toán");
            return;
        }
        navigate("/checkout", { state: { selected: Array.from(selectedItems) } });
    };

    const handleLocalQuantityChange = (variantId: number, value: number) => {
        if (value < 1) return;
        setLocalQuantities((prev) => ({ ...prev, [variantId]: value }));
    };

    const handleUpdateQuantity = (variantId: number) => {
        const quantity = localQuantities[variantId];
        dispatch(updateCartItem({ variantId, quantity }));
    };

    const rowTotal = (item: typeof items[0]) => {
        const unitPrice = Number(item.discounted_price ?? item.price);
        return formatCurrency(unitPrice * item.quantity);
    };

    const totalSelected = items
        .filter((i) => selectedItems.has(i.variantId))
        .reduce((sum, i) => sum + (Number(i.discounted_price ?? i.price) * i.quantity), 0);

    return (
        <main>
            <Container className="my-4">
                <ToastContainer />
                <h1 className="fs-5">🛒 Giỏ hàng của bạn</h1>
                {loading ? (
                    <p>Đang tải...</p>
                ) : items.length === 0 ? (
                    <p className="text-center">Giỏ hàng trống.</p>
                ) : (
                    <>
                        <Table bordered hover responsive className="text-center">
                            <thead>
                                <tr>
                                    <th>
                                        <Form.Check type="checkbox" checked={selectedItems.size === items.length} onChange={selectAll} />
                                    </th>
                                    <th>Hình ảnh</th>
                                    <th>Sản phẩm</th>
                                    <th>Mã sản phẩm</th>
                                    <th>Màu / Size</th>
                                    <th>Số lượng</th>
                                    <th>Giá</th>
                                    <th>Tổng</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.variantId}>
                                        <td>
                                            <Form.Check
                                                type="checkbox"
                                                checked={selectedItems.has(item.variantId)}
                                                onChange={() => toggleSelect(item.variantId)}
                                            />
                                        </td>
                                        <td style={{ width: 100 }}>
                                            {item.image && <Image src={item.image} alt={item.productName} fluid rounded />}
                                        </td>
                                        <td>{item.productName}</td>
                                        <td>{item.sku}</td>
                                        <td>
                                            {item.color} / {item.size}
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center justify-content-center"
                                                style={{ width: "120px", margin: "0 auto" }}>
                                                <Button
                                                    size="sm"
                                                    variant="light"
                                                    onClick={() =>
                                                        handleLocalQuantityChange(item.variantId, (localQuantities[item.variantId] ?? 1) - 1)
                                                    }
                                                    style={{ borderRadius: "4px 0 0 4px", borderRight: "0", border: "1px solid #ced4da", }}
                                                    disabled={(localQuantities[item.variantId] ?? 1) <= 1} >
                                                    -
                                                </Button>

                                                <input
                                                    type="text"
                                                    value={localQuantities[item.variantId] ?? 1}
                                                    readOnly
                                                    style={{
                                                        width: "40px",
                                                        textAlign: "center",
                                                        border: "1px solid #ced4da",
                                                        borderLeft: "0",
                                                        borderRight: "0",
                                                        padding: "2px 0",
                                                    }} />
                                                <Button
                                                    size="sm"
                                                    variant="light"
                                                    onClick={() =>
                                                        handleLocalQuantityChange(item.variantId, (localQuantities[item.variantId] ?? 1) + 1)
                                                    }
                                                    style={{ borderRadius: "0 4px 4px 0", borderLeft: "0", border: "1px solid #ced4da", }}>
                                                    +
                                                </Button>
                                            </div>
                                        </td>
                                        <td>{formatCurrency(Number(item.discounted_price ?? item.price))}</td>
                                        <td>{rowTotal(item)}</td>
                                        <td>
                                            <Button size="sm" variant="primary" onClick={() => handleUpdateQuantity(item.variantId)}>
                                                Cập nhật
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>

                        <Row className="align-items-center mt-3">
                            <Col md={6} className="text-start">
                                <Button variant="danger" onClick={handleRemoveSelected}>
                                    ❌ Xóa sản phẩm đã chọn
                                </Button>
                            </Col>
                            <Col md={6} className="text-end">
                                <div>
                                    <span>
                                        <strong>Tổng giỏ hàng:</strong>{" "}
                                        <span className="text-success">{formatCurrency(totalSelected)}</span>
                                    </span>
                                </div>
                                <Button
                                    variant="success"
                                    size="lg"
                                    className="mt-2"
                                    onClick={handleCheckout}>
                                    ✅ Thanh toán sản phẩm đã chọn
                                </Button>
                            </Col>
                        </Row>
                    </>
                )}
            </Container>
        </main>
    );
};

export default CartPage;
