import React, { useEffect, useState } from "react";
import { Table, Button, Spinner, Modal, Form, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import api from "../../../api/axios";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {formatPhone  } from "../../../utils/format";

interface Supplier {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at?: string;
  slug:string
}

const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  // modals & form
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [activeSupplier, setActiveSupplier] = useState<Partial<Supplier>>({});

  // pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(12);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/suppliers");
      const list: Supplier[] = res.data?.data ?? res.data ?? [];
      setSuppliers(list);
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? err.message ?? "Load suppliers failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSuppliers(); }, []);

  // pagination logic
  const totalPages = Math.ceil(suppliers.length / itemsPerPage);
  const paginatedSuppliers = suppliers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // hiển thị 2 số trang trượt
  const getVisiblePages = () => {
    if (totalPages <= 2) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage === totalPages) return [totalPages - 1, totalPages];
    return [currentPage, currentPage + 1];
  };

  // scroll lên đầu bảng khi đổi trang
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [currentPage]);

  // Add
  const handleAdd = async () => {
    try {
      await api.post("/api/admin/suppliers", activeSupplier);
      toast.success("Supplier created");
      setShowAdd(false);
      setActiveSupplier({});
      loadSuppliers();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? err.message ?? "Create failed");
    }
  };

  // Edit
  const handleEdit = async () => {
    if (!activeSupplier.id) return;
    try {
      await api.put(`/api/admin/suppliers/${activeSupplier.id}`, activeSupplier);
      toast.success("Supplier updated");
      setShowEdit(false);
      setActiveSupplier({});
      loadSuppliers();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? err.message ?? "Update failed");
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!activeSupplier.id) return;
    try {
      await api.delete(`/api/admin/suppliers/${activeSupplier.id}`);
      toast.success("Supplier deleted");
      setShowDelete(false);
      setActiveSupplier({});
      loadSuppliers();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? err.message ?? "Delete failed");
    }
  };

  return (
    <Row className="p-2">
      <ToastContainer />
      <Col>
        <div className="d-flex justify-content-between align-items-center mb-1">
          <h5>Suppliers Management</h5>
          <Button onClick={() => { setActiveSupplier({}); setShowAdd(true); }}>+ Add Supplier</Button>
        </div>

        {loading ? (
          <Spinner animation="border" />
        ) : (
          <>
            <Table striped bordered hover responsive>
              <thead className="table-dark">
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSuppliers.length === 0 ? (
                  <tr><td colSpan={5} className="text-center">No suppliers</td></tr>
                ) : paginatedSuppliers.map(s => (
                  <tr key={s.id}>
                    <td><Link to={`/admin/suppliers/${s.id}-${s.slug}`}>{s.name}</Link></td>
                    <td>{formatPhone(s.phone?? "")}</td>
                    <td>{s.email}</td>
                    <td>{s.address}</td>
                    <td className="d-flex gap-2">
                      <Button size="sm" variant="warning" onClick={() => { setActiveSupplier(s); setShowEdit(true); }}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => { setActiveSupplier(s); setShowDelete(true); }}>Delete</Button>
                    </td>
                  </tr>
                ))}
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
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={50}>50</option>
                </select>
                <span>bản ghi / trang</span>
                <span className="ms-3">Tổng {totalPages} trang ({suppliers.length} bản ghi)</span>
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
      </Col>
      {/* Add Modal */}
      <Modal show={showAdd} onHide={() => setShowAdd(false)}>
        <Modal.Header closeButton><Modal.Title>Add Supplier</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Name</Form.Label>
              <Form.Control value={activeSupplier.name ?? ""} onChange={e => setActiveSupplier({ ...activeSupplier, name: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Email</Form.Label>
              <Form.Control value={activeSupplier.email ?? ""} onChange={e => setActiveSupplier({ ...activeSupplier, email: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Phone</Form.Label>
              <PhoneInput
                defaultCountry="VN"
                value={activeSupplier.phone ?? ""}
                onChange={value => setActiveSupplier({ ...activeSupplier, phone: value })}
                international
                countryCallingCodeEditable={false}
                className="custom-phone-input no-border-inner"
                style={{ borderRadius: "8px", border: "1px solid #ced4da", height: "44px", padding: "0 12px", fontSize: "1rem", outline: "none" }}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Address</Form.Label>
              <Form.Control value={activeSupplier.address ?? ""} onChange={e => setActiveSupplier({ ...activeSupplier, address: e.target.value })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAdd}>Add</Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)}>
        <Modal.Header closeButton><Modal.Title>Edit Supplier</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Name</Form.Label>
              <Form.Control value={activeSupplier.name ?? ""} onChange={e => setActiveSupplier({ ...activeSupplier, name: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Email</Form.Label>
              <Form.Control value={activeSupplier.email ?? ""} onChange={e => setActiveSupplier({ ...activeSupplier, email: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Phone</Form.Label>
              <PhoneInput
                defaultCountry="VN"
                value={activeSupplier.phone ?? ""}
                onChange={value => setActiveSupplier({ ...activeSupplier, phone: value })}
                international
                countryCallingCodeEditable={false}
                className="custom-phone-input no-border-inner"
                style={{ borderRadius: "8px", border: "1px solid #ced4da", height: "44px", padding: "0 12px", fontSize: "1rem", outline: "none" }}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Address</Form.Label>
              <Form.Control value={activeSupplier.address ?? ""} onChange={e => setActiveSupplier({ ...activeSupplier, address: e.target.value })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleEdit}>Save</Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDelete} onHide={() => setShowDelete(false)}>
        <Modal.Header closeButton><Modal.Title>Delete Supplier</Modal.Title></Modal.Header>
        <Modal.Body>Are you sure you want to delete <strong>{activeSupplier.name}</strong>?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </Modal.Footer>
      </Modal>
    </Row>
  );
};

export default SuppliersPage;
