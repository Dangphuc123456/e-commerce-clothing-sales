import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Table,
  Button,
  Modal,
  Form,
  Spinner,
  Card,
  InputGroup,
} from "react-bootstrap";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import Select from "react-select";
import api from "../../../api/axios";
import { toast, ToastContainer } from "react-toastify";
import { formatCurrency } from "../../../utils/format";

interface Supplier {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at?: string;
}

interface User {
  id: number;
  username: string;
}

interface Purchase {
  id?: number;
  supplier_id?: number;
  staff_id?: number;
  variant_id?: number;
  quantity?: number;
  cost_price?: number;
  total?: number;
  created_at?: string;
}

interface VariantOption {
  value: number;
  label: string;
}

const SupplierDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const supplierId = id ? Number(id.split("-")[0]) : 0;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(12);

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [form, setForm] = useState<Purchase>({
    quantity: 1,
    cost_price: 0,
    staff_id: undefined,
    variant_id: undefined,
  });

  const staffId = parseInt(localStorage.getItem("userId") || "0", 10);

  useEffect(() => {
    if (!supplierId) return;
    loadSupplier();
    loadPurchases();
    loadVariants();
    loadUsers();
  }, [supplierId]);

  const loadSupplier = async () => {
    try {
      const res = await api.get(`/api/admin/suppliers/${supplierId}`);
      const s: Supplier = res.data ?? res.data?.data;
      setSupplier(s);
    } catch (err: any) {
      toast.error("Failed to load supplier: " + (err.response?.data?.error ?? err.message));
    }
  };

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/suppliers/${supplierId}/purchases`);
      const list: Purchase[] = res.data?.data ?? res.data ?? [];
      setPurchases(list);
    } catch (err: any) {
      toast.error("Failed to load purchases: " + (err.response?.data?.error ?? err.message));
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  const loadVariants = async () => {
    try {
      const res = await api.get("/api/admin/variants");
      const data = Array.isArray(res.data?.data ?? res.data) ? res.data.data ?? res.data : [];
      const options = data.map((v: any) => ({
        value: v.id,
        label: `${v.Product?.name} - ${v.size} - ${v.color}`,
      }));
      setVariants(options);
    } catch (err: any) {
      toast.error("Không tải được danh sách variants");
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get("/api/admin/users");
      const data = Array.isArray(res.data?.data ?? res.data) ? res.data.data ?? res.data : [];
      setUsers(data);
    } catch (err: any) {
      toast.error("Không tải được danh sách nhân viên");
    }
  };

  const copyToClipboard = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  const openAddPurchase = () => {
    setEditingPurchase(null);
    setForm({
      supplier_id: supplierId,
      staff_id: staffId,
      variant_id: undefined,
      quantity: 1,
      cost_price: 0,
    });
    setShowPurchaseModal(true);
  };

  const openEditPurchase = (p: Purchase) => {
    setEditingPurchase(p);
    setForm({ ...p });
    setShowPurchaseModal(true);
  };

  const handleSavePurchase = async () => {
    try {
      const payload = {
        staff_id: form.staff_id,
        variant_id: form.variant_id,
        quantity: form.quantity,
        cost_price: form.cost_price,
        total: (form.quantity || 0) * (form.cost_price || 0),
      };

      if (editingPurchase && editingPurchase.id) {
        await api.put(
          `/api/admin/suppliers/${supplierId}/purchases/${editingPurchase.id}`,
          payload
        );
        toast.success("Purchase updated");
      } else {
        await api.post(`/api/admin/suppliers/${supplierId}/purchases`, payload);
        toast.success("Purchase created");
      }
      setShowPurchaseModal(false);
      loadPurchases();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? err.message ?? "Save failed");
    }
  };

  const handleDeletePurchase = async (purchaseId?: number) => {
    if (!purchaseId) return;
    if (!confirm("Are you sure to delete this purchase?")) return;
    try {
      await api.delete(`/api/admin/suppliers/${supplierId}/purchases/${purchaseId}`);
      toast.success("Deleted");
      loadPurchases();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? err.message ?? "Delete failed");
    }
  };

  const getStaffName = (id?: number) => {
    return users.find((u) => u.id === id)?.username || `Staff ID ${id}`;
  };
  const getVariantLabel = (id?: number) => {
    return variants.find(v => v.value === id)?.label || `Variant ID ${id}`;
  };

  const totalPages = Math.max(1, Math.ceil(purchases.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPurchases = purchases.slice(indexOfFirstItem, indexOfLastItem);


  const getVisiblePages = () => {
    if (totalPages <= 2) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage === totalPages) return [totalPages - 1, totalPages];
    return [currentPage, currentPage + 1];
  };
  return (
    <div className="p-1">
      <ToastContainer />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-primary fs-3">Supplier Detail</h3>
        <Link to="/admin/suppliers">
          <Button variant="outline-secondary">← Back to List</Button>
        </Link>
      </div>

      <div className="row g-4">
        {/* Left info panel */}
        <div className="col-md-4">
          <Card className="shadow-sm p-3">
            <Card.Body>
              <h5 className="text-info mb-3">Detailed information</h5>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Supplier ID</Form.Label>
                  <Form.Control type="text" value={supplier?.id ?? ""} readOnly />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control type="text" value={supplier?.name ?? ""} readOnly />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <InputGroup>
                    <PhoneInput
                      defaultCountry="VN"
                      value={supplier?.phone || ""}
                      onChange={() => { }}
                      international
                      countryCallingCodeEditable={false}
                      disabled
                      className="form-control"
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => copyToClipboard(supplier?.phone)}>
                      Copy
                    </Button>
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <InputGroup>
                    <Form.Control type="email" value={supplier?.email ?? ""} readOnly />
                    <Button
                      variant="outline-secondary"
                      onClick={() => copyToClipboard(supplier?.email)}>
                      Copy
                    </Button>
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    value={supplier?.address ?? ""}
                    readOnly
                    rows={3}
                  />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </div>

        {/* Right purchases panel */}
        <div className="col-md-8">
          <Card className="shadow-sm p-3">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="text-info">Purchases by supplier</h5>
                <Button variant="success" onClick={openAddPurchase}>
                  + Add Purchase
                </Button>
              </div>

              {loading ? (
                <div className="d-flex justify-content-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : (
                <>
                  <Table striped bordered hover responsive className="table-sm shadow-sm bg-white rounded">
                    <thead className="table-dark">
                      <tr>
                        <th>ID</th>
                        <th>Staff</th>
                        <th>Variant</th>
                        <th>Quantity</th>
                        <th>Cost</th>
                        <th>Total</th>
                        <th>Created</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPurchases.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center text-muted">
                            No purchases
                          </td>
                        </tr>
                      ) : (
                        currentPurchases.map((p) => (
                          <tr key={p.id}>
                            <td>{p.id}</td>
                            <td>{getStaffName(p.staff_id)}</td>
                            <td>{getVariantLabel(p.variant_id)}</td>
                            <td>{p.quantity}</td>
                            <td>{formatCurrency(Number(p.cost_price))}</td>
                            <td>{formatCurrency(Number(p.total))}</td>
                            <td>{p.created_at ? new Date(p.created_at).toLocaleString() : ""}</td>
                            <td className="d-flex gap-2">
                              <Button size="sm" variant="warning" onClick={() => openEditPurchase(p)}>
                                Edit
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => handleDeletePurchase(p.id)}>
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                  {/* Pagination & items per page */}
                  <div className="d-flex align-items-center justify-content-end mt-3 gap-3">
                    <div className="d-flex align-items-center gap-2">
                      <span>Hiển thị</span>
                      <select
                        className="form-select"
                        style={{ width: "70px" }}
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                      >
                        <option value={12}>12</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                      <span>bản ghi / trang</span>
                      <span className="ms-3">
                        Tổng {totalPages} trang ({purchases.length} bản ghi)
                      </span>
                    </div>

                    <nav>
                      <ul className="pagination mb-0">
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(currentPage - 1)}
                          >
                            ‹
                          </button>
                        </li>

                        {getVisiblePages().map((page) => (
                          <li
                            key={page}
                            className={`page-item ${currentPage === page ? "active" : ""}`}
                          >
                            <button className="page-link" onClick={() => setCurrentPage(page)}>
                              {page}
                            </button>
                          </li>
                        ))}

                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(currentPage + 1)}
                          >
                            ›
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Purchase Modal */}
      <Modal show={showPurchaseModal} onHide={() => setShowPurchaseModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingPurchase ? "Edit Purchase" : "Add Purchase"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Staff</Form.Label>
              <Form.Control
                type="text"
                value={getStaffName(form.staff_id)}
                readOnly
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Variant</Form.Label>
              <Select
                options={variants}
                value={variants.find((v) => v.value === form.variant_id) || null}
                onChange={(option) => setForm({ ...form, variant_id: option?.value })}
                isSearchable
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                type="number"
                value={form.quantity ?? ""}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                min={1}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Cost Price</Form.Label>
              <Form.Control
                type="number"
                value={form.cost_price ?? ""}
                onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })}
                min={0}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Total</Form.Label>
              <Form.Control
                type="number"
                value={(form.quantity || 0) * (form.cost_price || 0)}
                readOnly
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPurchaseModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSavePurchase}>
            {editingPurchase ? "Save" : "Create"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SupplierDetailPage;
