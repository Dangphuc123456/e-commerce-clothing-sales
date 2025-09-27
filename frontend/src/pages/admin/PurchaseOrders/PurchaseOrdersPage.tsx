import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Spinner } from "react-bootstrap";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../../api/axios";
import { formatCurrency } from "../../../utils/format";

interface Purchase {
  id: number;
  supplier_id: number;
  staff_id: number;
  variant_id: number;
  quantity: number;
  cost_price: number;
  total: number;
  created_at: string;
}

interface SupplierOption {
  value: number;
  label: string;
}

interface VariantOption {
  value: number;
  label: string;
}

interface User {
  id: number;
  username: string;
}

const PurchaseOrdersPage: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Purchase>>({});
  const [editing, setEditing] = useState(false);

  // pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(12);

  const staffId = parseInt(localStorage.getItem("userId") || "0", 10);

  useEffect(() => {
    loadSuppliers();
    loadVariants();
    loadUsers();
    loadPurchases();
  }, []);

  const loadSuppliers = async () => {
    try {
      const res = await api.get("/api/admin/suppliers");
      const data = Array.isArray(res.data?.data ?? res.data) ? res.data.data ?? res.data : [];
      setSuppliers(data.map((s: any) => ({ value: s.id, label: s.name })));
    } catch {
      toast.error("Không tải được danh sách nhà cung cấp");
    }
  };

  const loadVariants = async () => {
    try {
      const res = await api.get("/api/admin/variants");
      const data = Array.isArray(res.data?.data ?? res.data) ? res.data.data ?? res.data : [];
      setVariants(
        data.map((v: any) => ({ value: v.id, label: `${v.Product?.name} - ${v.size} - ${v.color}` }))
      );
    } catch {
      toast.error("Không tải được danh sách variants");
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get("/api/admin/users");
      const data = Array.isArray(res.data?.data ?? res.data) ? res.data.data ?? res.data : [];
      setUsers(data);
    } catch {
      toast.error("Không tải được danh sách nhân viên");
    }
  };

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/purchases");
      const data = Array.isArray(res.data?.data ?? res.data) ? res.data.data ?? res.data : [];
      setPurchases(data);
    } catch {
      toast.error("Không tải được danh sách purchases");
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(purchases.length / itemsPerPage);
  const paginatedPurchases = purchases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getVisiblePages = () => {
    if (totalPages <= 2) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage === totalPages) return [totalPages - 1, totalPages];
    return [currentPage, currentPage + 1];
  };

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [currentPage]);

  const handleSave = async () => {
    try {
      const payload = { ...formData, staff_id: staffId };
      if (editing && formData.id) {
        await api.put(`/api/admin/purchases/${formData.id}`, payload);
        toast.success("Cập nhật thành công!");
      } else {
        await api.post("/api/admin/purchases", payload);
        toast.success("Tạo mới thành công!");
      }
      setShowModal(false);
      setFormData({});
      setEditing(false);
      loadPurchases();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Lỗi khi lưu purchase");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa purchase này?")) return;
    try {
      await api.delete(`/api/admin/purchases/${id}`);
      toast.success("Xóa thành công!");
      loadPurchases();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Lỗi khi xóa purchase");
    }
  };

  const getStaffName = (id?: number) => users.find(u => u.id === id)?.username || `Staff ID ${id}`;

  return (
    <div className="p-2">
      <ToastContainer />
      <div className="d-flex justify-content-between align-items-center mb-1">
        <h5>Purchases Management</h5>
        <Button
          onClick={() => { setShowModal(true); setEditing(false); setFormData({}); }}>
          + Add Purchase
        </Button>
      </div>

      {loading ? (
        <Spinner animation="border" />
      ) : (
        <>
          <Table striped bordered hover responsive className="table-lg">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Supplier</th>
                <th>Staff</th>
                <th>Variant</th>
                <th>SL</th>
                <th>Giá nhập</th>
                <th>Total</th>
                <th>Date </th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPurchases.length ? (
                paginatedPurchases.map(p => {
                  const supplier = suppliers.find(s => s.value === p.supplier_id)?.label || p.supplier_id;
                  const variant = variants.find(v => v.value === p.variant_id)?.label || p.variant_id;
                  return (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{supplier}</td>
                      <td>{getStaffName(p.staff_id)}</td>
                      <td>{variant}</td>
                      <td>{p.quantity}</td>
                      <td>{formatCurrency(Number(p.cost_price))}</td>
                      <td>{formatCurrency(Number(p.total))}</td>
                      <td>{new Date(p.created_at).toLocaleString()}</td>
                      <td className="text-center align-middle">
                        <div className="d-flex justify-content-center gap-2">
                          <Button size="sm" variant="warning" onClick={() => { setFormData(p); setEditing(true); setShowModal(true); }}>Edit</Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(p.id)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="text-center">Không có dữ liệu</td>
                </tr>
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
              <span className="ms-3">Tổng {totalPages} trang ({purchases.length} bản ghi)</span>
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

      {/* Modal Add/Edit */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? "Sửa Purchase" : "Thêm Purchase"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Nhân viên</Form.Label>
              <Form.Control type="text" value={getStaffName(staffId)} readOnly />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Nhà cung cấp</Form.Label>
              <Select
                options={suppliers}
                value={suppliers.find(s => s.value === formData.supplier_id) || null}
                onChange={option => setFormData({ ...formData, supplier_id: option?.value })}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Variant</Form.Label>
              <Select
                options={variants}
                value={variants.find(v => v.value === formData.variant_id) || null}
                onChange={option => setFormData({ ...formData, variant_id: option?.value })}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>SL</Form.Label>
              <Form.Control
                type="number"
                value={formData.quantity || ""}
                onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                min={1}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Giá nhập</Form.Label>
              <Form.Control
                type="number"
                value={formData.cost_price || ""}
                onChange={e => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                min={0}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Tổng</Form.Label>
              <Form.Control
                type="number"
                value={(formData.quantity || 0) * (formData.cost_price || 0)}
                readOnly
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
          <Button variant="primary" onClick={handleSave}>{editing ? "Lưu" : "Tạo mới"}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PurchaseOrdersPage;