import React, { useEffect, useState } from "react";
import { Card, Button, Modal, Spinner, Row, Col, Image, Container, Table, ProgressBar } from "react-bootstrap";
import api from "../../../api/axios";

interface CustomerAddress {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    is_default: boolean;
}

interface Customer {
    id: number;
    username: string;
    email: string;
    phone: string;
    address: string;
    role: string;
    CustomerAddresses: CustomerAddress[] | null;
}

interface Staff {
    id: number;
    username: string;
    email: string;
    phone: string;
    role: string;
}

interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    price: number;
    size: string;
    color: string;
    image: string;
    sku: string;
}

interface Order {
    id: number;
    status: "pending" | "confirmed" | "shipped" | "completed" | "cancelled";
    total: number;
    payment_method: string;
    created_at: string;
    Customer: Customer;
    Staff: Staff;
    customer_address: CustomerAddress;
    items?: OrderItem[];
}

const statusMap = {
    pending: 20,
    confirmed: 40,
    shipped: 70,
    completed: 100,
    cancelled: 0
};

const statusTextMap = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    shipped: "Đang vận chuyển",
    completed: "Hoàn thành",
    cancelled: "Đã hủy"
};

const OrderHistoryPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get("/api/customer/orders/history");
            const ordersData: Order[] =
                res.data.orders?.map((o: any) => ({
                    ...o,
                    items: o.Items ?? [],
                })) ?? [];
            setOrders(ordersData);
        } catch (err) {
            console.error(err);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    if (loading)
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
                <Spinner animation="border" />
                <span className="ms-2">Đang tải...</span>
            </div>
        );

    return (
        <Container className="my-4">
            <h3 className="mb-3 fs-4">Lịch sử đơn hàng</h3>
            <div className="d-flex flex-column gap-3">
                {orders.length > 0 ? (
                    orders.map(order => (
                        <Card key={order.id} className="p-3">
                            <Row className="align-items-center">
                                <Col xs={12} md={8}>
                                    <h5>Đơn hàng </h5>
                                    <div className="d-flex align-items-center">
                                        <p className="mb-0 me-4">
                                            <strong>Trạng thái:</strong> {statusTextMap[order.status]}
                                        </p>
                                        <p className="mb-0">
                                            <strong>Tổng tiền:</strong> {order.total.toLocaleString()}₫
                                        </p>
                                    </div>
                                </Col>
                                <Col xs={12} md={4} className="text-md-end mt-2 mt-md-0">
                                    <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setShowModal(true);
                                        }}>
                                        Xem chi tiết
                                    </Button>
                                </Col>
                            </Row>

                            {/* Danh sách sản phẩm trong đơn */}
                            <div className="mt-3 d-flex flex-column gap-2">
                                {order.items && order.items.length > 0 ? (
                                    order.items.map(item => (
                                        <Card key={item.id} className="p-2">
                                            <Row className="align-items-center">
                                                <Col xs={3} sm={2} md={2} lg={2}>
                                                    <Image src={item.image} thumbnail style={{ height: "80px", objectFit: "cover" }} />
                                                </Col>
                                                <Col xs={9} sm={10} md={10} lg={10}>
                                                    <div><strong>Sản phẩm:</strong> {item.product_name}</div>
                                                    <div><strong>Mã:</strong> {item.sku}</div>
                                                    <div><strong>Số lượng:</strong> {item.quantity}</div>
                                                    <div><strong>Giá:</strong> {item.price.toLocaleString()}₫</div>
                                                </Col>
                                            </Row>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center">Không có sản phẩm trong đơn này</div>
                                )}
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="text-center">Chưa có đơn hàng</div>
                )}
            </div>

            {/* Modal chi tiết */}
            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết đơn hàng #{selectedOrder?.id}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {/* Thanh tiến trình trạng thái chỉ trong modal */}
                    {selectedOrder && selectedOrder.status !== "cancelled" && (
                        <div className="mb-3">
                            <strong>Tiến trình đơn hàng:</strong>
                            <ProgressBar
                                now={statusMap[selectedOrder.status]}
                                label={`${statusTextMap[selectedOrder.status]} (${statusMap[selectedOrder.status]}%)`}
                                variant={
                                    selectedOrder.status === "pending"
                                        ? "warning"
                                        : selectedOrder.status === "confirmed"
                                            ? "info"
                                            : selectedOrder.status === "shipped"
                                                ? "primary"
                                                : selectedOrder.status === "completed"
                                                    ? "success"
                                                    : "danger"
                                }
                            />
                        </div>
                    )}
                    {selectedOrder?.status === "cancelled" && (
                        <p className="text-danger"><strong>Đơn hàng đã bị hủy</strong></p>
                    )}

                    <Row>
                        {/* Thông tin khách hàng */}
                        <Col md={6}>
                            <h5>Thông tin khách hàng</h5>
                            <p><strong>Tên:</strong> {selectedOrder?.Customer.username}</p>
                            <p><strong>Email:</strong> {selectedOrder?.Customer.email}</p>
                            <p><strong>Điện thoại:</strong> {selectedOrder?.Customer.phone}</p>
                            <p><strong>Địa chỉ:</strong> {selectedOrder?.customer_address?.address}</p>
                        </Col>

                        {/* Thông tin đơn hàng */}
                        <Col md={6}>
                            <h5>Thông tin đơn hàng</h5>
                            <p><strong>Trạng thái:</strong> {statusTextMap[selectedOrder?.status || "pending"]}</p>
                            <p><strong>Thanh toán:</strong> {selectedOrder?.payment_method.toUpperCase()}</p>
                            <p><strong>Tổng tiền:</strong> {selectedOrder?.total.toLocaleString()}₫</p>
                            <p><strong>Ngày tạo:</strong> {new Date(selectedOrder?.created_at || "").toLocaleString()}</p>
                        </Col>
                    </Row>

                    {/* Danh sách sản phẩm */}
                    <h5 className="mt-3">Sản phẩm</h5>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Ảnh</th>
                                <th>Tên sản phẩm</th>
                                <th>SKU</th>
                                <th>Màu</th>
                                <th>Size</th>
                                <th>Số lượng</th>
                                <th>Giá</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedOrder?.items && selectedOrder.items.length > 0 ? (
                                selectedOrder.items.map(item => (
                                    <tr key={item.id}>
                                        <td><Image src={item.image} fluid style={{ maxWidth: "50px" }} /></td>
                                        <td>{item.product_name}</td>
                                        <td>{item.sku}</td>
                                        <td>{item.color}</td>
                                        <td>{item.size}</td>
                                        <td>{item.quantity}</td>
                                        <td>{item.price.toLocaleString()}₫</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-center">
                                        Không có sản phẩm trong đơn này
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Đóng</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default OrderHistoryPage;
