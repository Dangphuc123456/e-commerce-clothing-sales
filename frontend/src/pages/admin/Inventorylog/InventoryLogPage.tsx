// src/pages/admin/InventoryLogPage.tsx
import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Spinner } from "react-bootstrap";
import api from "../../../api/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Product { id: number; name: string; }
interface Variant { id: number; size: string; color: string; stock: number; sku: string; Product?: Product; }
interface InventoryLog {
  id: number;
  variant_id: number;
  change_type: string;
  quantity: number;
  note: string;
  Variant?: Variant;
}

const InventoryLogPage: React.FC = () => {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingLog, setEditingLog] = useState<InventoryLog | null>(null);
  const [note, setNote] = useState("");
  const [variantId, setVariantId] = useState<number | undefined>();
  const [changeType, setChangeType] = useState<string>("import");
  const [quantity, setQuantity] = useState<number>(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/inventory_logs");
      setLogs(res.data?.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchVariants = async () => {
    try {
      const res = await api.get("/api/admin/variants");
      setVariants(res.data?.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to load variants");
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchVariants();
  }, []);

  const openCreateModal = () => {
    setEditingLog(null);
    setNote("");
    setVariantId(undefined);
    setChangeType("import");
    setQuantity(0);
    setShowModal(true);
  };

  const openEditModal = (log: InventoryLog) => {
    setEditingLog(log);
    setNote(log.note);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this log?")) return;
    try {
      await api.delete(`/api/admin/inventory_logs/${id}`);
      setLogs((prev) => prev.filter((l) => l.id !== id));
      toast.success("Deleted successfully");
    } catch {
      toast.error("Failed to delete log");
    }
  };

  const handleSave = async () => {
    try {
      if (editingLog) {
        const res = await api.put(`/api/admin/inventory_logs/${editingLog.id}`, { note });
        setLogs((prev) => prev.map((l) => (l.id === editingLog.id ? res.data : l)));
      } else {
        if (!variantId) {
          toast.error("Please select a Variant");
          return;
        }
        const res = await api.post("/api/admin/inventory_logs", {
          variant_id: variantId,
          change_type: changeType,
          quantity,
          note,
        });
        setLogs((prev) => [...prev, res.data]);
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save log");
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const paginatedLogs = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getVisiblePages = () => {
    if (totalPages <= 2) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage === totalPages) return [totalPages - 1, totalPages];
    return [currentPage, currentPage + 1];
  };

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [currentPage]);

  if (loading) return <Spinner animation="border" />;

  return (
    <div className="p-2">
      <ToastContainer />
      <div className="d-flex justify-content-between align-items-center mb-1">
        <h5>Inventory Logs</h5>
        <Button onClick={openCreateModal}>+ Add Log</Button>
      </div>
      <Table striped bordered hover responsive className="table-sm shadow-sm bg-white rounded">
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>Variant</th>
            <th>Change Type</th>
            <th>Quantity</th>
            <th>Stock After Change</th>
            <th>Note</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedLogs.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center">No logs</td>
            </tr>
          ) : paginatedLogs.map((log) => (
            <tr key={log.id}>
              <td>{log.id}</td>
              <td>{log.Variant ? `${log.Variant.size} / ${log.Variant.color} / ${log.Variant.sku}` : "N/A"}</td>
              <td>{log.change_type}</td>
              <td>{log.quantity}</td>
              <td>{log.Variant?.stock ?? "N/A"}</td>
              <td>{log.note}</td>
              <td className="d-flex gap-2">
                <Button size="sm" variant="warning" onClick={() => openEditModal(log)}>Edit</Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(log.id)}>Delete</Button>
              </td>
            </tr>
          ))}
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
          <span className="ms-3">Tổng {totalPages} trang ({logs.length} bản ghi)</span>
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

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingLog ? "Edit Log" : "Create Log"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {!editingLog && (
              <>
                <Form.Group className="mb-2">
                  <Form.Label>Variant</Form.Label>
                  <Form.Select value={variantId} onChange={e => setVariantId(Number(e.target.value))}>
                    <option value="">Select Variant</option>
                    {variants.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.Product?.name} / {v.size} / {v.color} / {v.sku}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Change Type</Form.Label>
                  <Form.Select value={changeType} onChange={e => setChangeType(e.target.value)}>
                    <option value="import">Import</option>
                    <option value="sale">Sale</option>
                    <option value="return">Return</option>
                    <option value="adjust">Adjust</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                  />
                </Form.Group>
              </>
            )}

            <Form.Group className="mb-2">
              <Form.Label>Note</Form.Label>
              <Form.Control
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>{editingLog ? "Save" : "Create"}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default InventoryLogPage;
