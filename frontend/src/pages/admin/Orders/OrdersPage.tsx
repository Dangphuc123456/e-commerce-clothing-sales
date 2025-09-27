// src/pages/admin/OrderManagementPage.tsx
import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Spinner, Form } from "react-bootstrap";
import api from "../../../api/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatCurrency } from "../../../utils/format";

interface User { id: number; username: string; }

interface OrderItem {
  id: number;
  order_id: number;
  product_name: string;
  variant_id: number;
  quantity: number;
  price: number;
  sku?: string;
  image?: string;
  color?: string;
  size?: string;
}

interface Order {
  id: number;
  CustomerID: number;
  Customer: User;
  StaffID?: number;
  Staff?: User;
  status: string;
  payment_method: string;
  txn_ref: string;
  total: number;
  created_at: string;
  Items: OrderItem[];
  customer_address?: CustomerAddress;
}
interface CustomerAddress {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const OrderManagementPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusUpdate, setStatusUpdate] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/orders");
      const data = Array.isArray(res.data?.data ?? res.data) ? res.data.data ?? res.data : [];
      setOrders(data);
    } catch (err: any) {
      toast.error("Failed to load orders: " + (err.response?.data?.error ?? err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const openDetail = async (orderId: number) => {
    try {
      const res = await api.get(`/api/admin/orders/${orderId}`);
      const order = res.data ?? res.data?.data;
      const mappedOrder = {
        ...order,
        CustomerAddress: order.customer_address ?? null
      };

      setSelectedOrder(mappedOrder);
      setStatusUpdate(order.status);
      setShowDetailModal(true);
    } catch (err: any) {
      toast.error("Failed to load order detail: " + (err.response?.data?.error ?? err.message));
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder) return;
    try {
      await api.patch(`/api/admin/orders/${selectedOrder.id}/status`, { status: statusUpdate });
      toast.success("Order status updated");
      setShowDetailModal(false);
      loadOrders();
    } catch { toast.error("Failed to update status"); }
  };

  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const paginatedOrders = orders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getVisiblePages = () => {
    if (totalPages <= 2) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage === totalPages) return [totalPages - 1, totalPages];
    return [currentPage, currentPage + 1];
  };

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [currentPage]);

  return (
    <div className="p-2">
      <ToastContainer />
      <h5>Order Management</h5>
      {loading ? (
        <Spinner animation="border" />
      ) : (
        <>
          <Table striped bordered hover responsive className="table-sm shadow-sm bg-white rounded">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Staff</th>
                <th>Status</th>
                <th>Order Code</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted">No orders</td>
                </tr>
              ) : (
                paginatedOrders.map(order => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>
                      <Button variant="link" onClick={() => openDetail(order.id)}>
                        {order.Customer?.username ?? `ID ${order.CustomerID}`}
                      </Button>
                    </td>
                    <td>{order.Staff?.username ?? order.StaffID ?? "-"}</td>
                    <td>
                      <span
                        className={`badge ${order.status === "pending" ? "bg-warning text-dark" :
                          order.status === "confirmed" ? "bg-primary" :
                            order.status === "shipped" ? "bg-info text-dark" :
                              order.status === "completed" ? "bg-success" :
                                order.status === "cancelled" ? "bg-danger" :
                                  "bg-secondary"
                          }`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{order.txn_ref}</td>
                    <td>{order.payment_method}</td>
                    <td>{formatCurrency(Number(order.total))}</td>
                    <td>{new Date(order.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>

          {/* Pagination */}
          <div className="d-flex align-items-center justify-content-end mt-3 gap-3">
            <div className="d-flex align-items-center gap-2">
              <span>Hiển thị</span>
              <select
                className="form-select"
                style={{ width: "70px" }}
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={50}>50</option>
              </select>
              <span>bản ghi / trang</span>
              <span className="ms-3">Tổng {totalPages} trang ({orders.length} bản ghi)</span>
            </div>

            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>‹</button>
                </li>

                {getVisiblePages().map(page => (
                  <li key={page} className={`page-item ${currentPage === page ? "active" : ""}`}>
                    <button className="page-link" onClick={() => setCurrentPage(page)}>{page}</button>
                  </li>
                ))}

                <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>›</button>
                </li>
              </ul>
            </nav>
          </div>
        </>
      )}


      {/* Order Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Order Detail - ID {selectedOrder?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div className="row">
              {/* Left Column - Customer Info */}
              <div className="col-md-6">
                <h6>Customer Info</h6>
                <div className="mb-2">
                  <label className="form-label">Name</label>
                  <input type="text" className="form-control" value={selectedOrder.Customer?.username} disabled />
                </div>
                {selectedOrder.customer_address ? (
                  <>
                    <div className="mb-2">
                      <label className="form-label">Address</label>
                      <input type="text" className="form-control" value={selectedOrder.customer_address.address} disabled />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Phone</label>
                      <input type="text" className="form-control" value={selectedOrder.customer_address.phone} disabled />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Email</label>
                      <input type="text" className="form-control" value={selectedOrder.customer_address.email} disabled />
                    </div>
                  </>
                ) : (
                  <p className="text-muted">Address: Not provided</p>
                )}
              </div>

              {/* Right Column - Order Info */}
              <div className="col-md-6">
                <h6>Order Info</h6>
                <div className="mb-2">
                  <label className="form-label">Staff</label>
                  <input type="text" className="form-control" value={selectedOrder.Staff?.username ?? "-"} disabled />
                </div>
                <div className="mb-2">
                  <label className="form-label">Status</label>
                  <Form.Select
                    value={statusUpdate}
                    onChange={e => setStatusUpdate(e.target.value)}
                    disabled={["completed", "cancelled"].includes(selectedOrder?.status ?? "")}
                  >
                    <option value="pending" disabled={selectedOrder?.status !== "pending"}>Pending</option>
                    <option value="confirmed" disabled={selectedOrder?.status !== "pending"}>Confirmed</option>
                    <option value="shipped" disabled={selectedOrder?.status !== "confirmed"}>Shipped</option>
                    <option value="completed" disabled={selectedOrder?.status !== "shipped"}>Completed</option>
                    <option value="cancelled" disabled={false}>Cancelled</option>
                  </Form.Select>
                </div>
                <div className="mb-2">
                  <label className="form-label">Payment</label>
                  <input type="text" className="form-control" value={selectedOrder.payment_method} disabled />
                </div>
                <div className="mb-2">
                  <label className="form-label">Total</label>
                  <input type="text" className="form-control" value={formatCurrency(selectedOrder.total)} disabled />
                </div>
              </div>
            </div>
          )}

          <hr />
          <h5>Items</h5>
          <Table striped bordered hover responsive size="sm">
            <thead className="table-secondary">
              <tr>
                <th>Product</th>
                <th>Variant</th>
                <th>SKU</th>
                <th>Image</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {selectedOrder?.Items.map(item => (
                <tr key={item.id}>
                  <td>{item.product_name}</td>
                  <td>{item.size ?? "-"} {item.color ?? ""}</td>
                  <td>{item.sku ?? "-"}</td>
                  <td>{item.image ? <img src={item.image} alt={item.product_name} width={50} /> : "-"}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>{formatCurrency(item.quantity * item.price)}</td>
                </tr>
              ))}
              {selectedOrder?.Items.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted">
                    No items in this order
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Close</Button>
          <Button variant="primary" onClick={handleStatusUpdate}>Update Status</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OrderManagementPage;
