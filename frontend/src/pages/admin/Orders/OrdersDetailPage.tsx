import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, Form, InputGroup, Button, Spinner,Table } from "react-bootstrap";
import api from "../../../api/axios";
import { formatCurrency, formatPhone } from "../../../utils/format";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  color?: string;
  size?: string;
  sku?: string;
  image?: string;
}

interface Customer {
  id?: number;
  username?: string;
  email?: string;
  phone?: string;
}

interface Staff {
  id?: number;
  username?: string;
}

interface CustomerAddress {
  address?: string;
  phone?: string;
  email?: string;
}

interface Order {
  id: number;
  status?: string;
  payment_method?: string;
  total?: number;
  created_at?: string;
  Customer?: Customer;
  Staff?: Staff;
  Items?: OrderItem[];
  customer_address?: CustomerAddress;
}

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdate, setStatusUpdate] = useState("");

  const copyToClipboard = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.info("Copied!");
  };

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/api/admin/orders/${id}`);
      setOrder(res.data);
      setStatusUpdate(res.data?.status || "");
    } catch (err) {
      console.error(err);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!order) return;
    try {
      await api.patch(`/api/admin/orders/${order.id}/status`, { status: statusUpdate });
      toast.success("Cập nhật trạng thái thành công");
      fetchOrder();
    } catch {
      toast.error("Cập nhật thất bại");
    }
  };

  if (loading) return <Spinner animation="border" />;
  if (!order) return <p>Order not found</p>;

  const customer = order.Customer || {};
  const staff = order.Staff || {};
  const items = order.Items || [];
  const customerAddress = order.customer_address || {};

  //  Badge màu theo status
  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case "pending":
        return <span className="badge bg-warning text-dark">Pending</span>;
      case "confirmed":
        return <span className="badge bg-primary">Confirmed</span>;
      case "shipped":
        return <span className="badge bg-info text-dark">Shipped</span>;
      case "completed":
        return <span className="badge bg-success">Completed</span>;
      case "cancelled":
        return <span className="badge bg-danger">Cancelled</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  return (
    <div className="container my-4">
      <ToastContainer />
      <h2>Chi tiết đơn hàng #{order.id}</h2>
      <div className="row mt-4 d-flex align-items-stretch">
        {/* Left: Customer Info */}
        <div className="col-md-6 d-flex">
          <Card className="shadow-sm p-3 mb-3 flex-fill h-100">
            <Card.Body>
              <h5 className="text-info mb-3">Customer Info</h5>
              <Form>
                <Form.Group className="mb-2">
                  <Form.Label>Name</Form.Label>
                  <Form.Control type="text" value={customer.username || ""} readOnly />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Address</Form.Label>
                  <Form.Control type="text" value={customerAddress.address || ""} readOnly />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Phone</Form.Label>
                  <InputGroup>
                    <Form.Control type="text" value={formatPhone(customerAddress.phone || "")} readOnly />
                    <Button variant="outline-secondary" onClick={() => copyToClipboard(customerAddress.phone)}>
                      Copy
                    </Button>
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Email</Form.Label>
                  <InputGroup>
                    <Form.Control type="email" value={customerAddress.email || ""} readOnly />
                    <Button variant="outline-secondary" onClick={() => copyToClipboard(customerAddress.email)}>
                      Copy
                    </Button>
                  </InputGroup>
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </div>

        {/* Right: Order Info */}
        <div className="col-md-6 d-flex">
          <Card className="shadow-sm p-3 mb-3 flex-fill h-100">
            <Card.Body>
              <h5 className="text-warning mb-3">Order Info</h5>
              <Form>
                <Form.Group className="mb-2">
                  <Form.Label>Staff</Form.Label>
                  <Form.Control type="text" value={staff.username || "-"} readOnly />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Status</Form.Label>
                  <div className="d-flex align-items-center gap-2">
                    {renderStatusBadge(order.status)}
                    <Form.Select
                      value={statusUpdate}
                      onChange={(e) => setStatusUpdate(e.target.value)}
                      disabled={["completed", "cancelled"].includes(order?.status || "")}
                      style={{ maxWidth: "200px" }}
                    >
                      <option value="pending" disabled={order?.status !== "pending"}>Pending</option>
                      <option value="confirmed" disabled={order?.status !== "pending"}>Confirmed</option>
                      <option value="shipped" disabled={order?.status !== "confirmed"}>Shipped</option>
                      <option value="completed" disabled={order?.status !== "shipped"}>Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </Form.Select>
                  </div>
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Payment</Form.Label>
                  <Form.Control type="text" value={order.payment_method || ""} readOnly />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Total</Form.Label>
                  <Form.Control type="text" value={formatCurrency(order.total || 0)} readOnly />
                </Form.Group>

                <div className="mt-3 text-end">
                  <Button variant="primary" onClick={handleStatusUpdate}>
                    Cập nhật trạng thái
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Items Table */}
      <Card className="shadow-sm p-3">
        <Card.Body>
          <h5 className="text-success mb-3">Items</h5>
          <Table striped bordered hover responsive size="sm">
            <thead className="table-secondary">
              <tr>
                <th>#</th>
                <th>Image</th>
                <th>Product</th>
                <th>Color</th>
                <th>Size</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td>{item.image ? <img src={item.image} alt={item.product_name} width={50} /> : "-"}</td>
                    <td>{item.product_name}</td>
                    <td>{item.color || "-"}</td>
                    <td>{item.size || "-"}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.price)}</td>
                    <td>{formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center">
                    Không có sản phẩm
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default OrderDetailPage;
