import React, { useEffect, useState } from "react";
import { Table, Button, Spinner, Modal, Form, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import api from "../../../api/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaLock } from "react-icons/fa";

interface Category {
  id: number;
  name: string;
  group_name: string;
  created_at?: string;
  slug:string;
}

const CategoryPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(12);

  // modals & form states
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Partial<Category>>({});
  const [deleteCountdown, setDeleteCountdown] = useState<number>(5);
  const [confirmDisabled, setConfirmDisabled] = useState<boolean>(true);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/categories");
      const list: Category[] = res.data?.data ?? res.data ?? [];
      setCategories(list);
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? err.message ?? "Load categories failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // pagination logic
  const totalPages = Math.ceil(categories.length / itemsPerPage);
  const paginatedCategories = categories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Hiển thị 2 số trang trượt theo currentPage
  const getVisiblePages = () => {
    if (totalPages <= 2) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage === totalPages) return [totalPages - 1, totalPages];
    return [currentPage, currentPage + 1];
  };

  // ADD
  const handleAdd = async () => {
    try {
      await api.post("/api/admin/categories", { name: activeCategory.name, group_name: activeCategory.group_name });
      toast.success("Category created");
      setShowAdd(false);
      setActiveCategory({});
      loadCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? err.message ?? "Create failed");
    }
  };

  // EDIT
  const handleEdit = async () => {
    if (!activeCategory.id) return;
    try {
      await api.put(`/api/admin/categories/${activeCategory.id}`, { name: activeCategory.name, group_name: activeCategory.group_name });
      toast.success("Category updated");
      setShowEdit(false);
      setActiveCategory({});
      loadCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? err.message ?? "Update failed");
    }
  };

  // DELETE countdown
  useEffect(() => {
    if (showDelete) {
      setConfirmDisabled(true);
      setDeleteCountdown(5);
      const timer = setInterval(() => {
        setDeleteCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setConfirmDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showDelete]);

  const handleDelete = async () => {
    if (!activeCategory.id) return;
    try {
      await api.delete(`/api/admin/categories/${activeCategory.id}`);
      toast.success("Category deleted");
      setShowDelete(false);
      setActiveCategory({});
      loadCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? err.message ?? "Delete failed");
    }
  };

  return (
    <Row className="p-2">
      <ToastContainer />
      <Col>
        <div className="d-flex justify-content-between align-items-center mb-1">
          <h5>Categories Management</h5>
          <Button onClick={() => { setActiveCategory({}); setShowAdd(true); }}>
            + Add Category
          </Button>
        </div>

        {loading ? (
          <Spinner />
        ) : (
          <>
            <Table striped bordered hover responsive>
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Group</th>
                  <th>Created At</th>
                  <th>Slug</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCategories.length === 0 ? (
                  <tr><td colSpan={5} className="text-center">No categories</td></tr>
                ) : (
                  paginatedCategories.map(c => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td><Link to={`/admin/categories/${c.id}-${c.slug}`}>{c.name}</Link></td>
                      <td>{c.group_name}</td>
                      <td>{c.created_at ? new Date(c.created_at).toLocaleString() : "-"}</td>
                      <td>{c.slug}</td>
                      <td className="d-flex gap-2">
                        <Button size="sm" variant="warning" onClick={() => { setActiveCategory(c); setShowEdit(true); }}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => { setActiveCategory(c); setShowDelete(true); }}>Delete</Button>
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
                  <option value={24}>24</option>
                  <option value={50}>50</option>
                </select>
                <span>bản ghi / trang</span>
                <span className="ms-3">Tổng {totalPages} trang ({categories.length} bản ghi)</span>
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
        <Modal.Header closeButton>
          <Modal.Title>Add Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Name</Form.Label>
              <Form.Control
                value={activeCategory.name ?? ""}
                onChange={e => setActiveCategory({ ...activeCategory, name: e.target.value })}
                placeholder="Category name"
              />
            </Form.Group>
            <Form.Group className="mt-2">
              <Form.Label>Group</Form.Label>
              <Form.Select
                value={activeCategory.group_name ?? "Áo Nam"}
                onChange={e => setActiveCategory({ ...activeCategory, group_name: e.target.value })}
              >
                <option value="Áo Nam">Áo Nam</option>
                <option value="Quần Nam">Quần Nam</option>
                <option value="Đồ Thể Thao">Đồ Thể Thao</option>
                <option value="Đồ Bộ">Đồ Bộ</option>
                <option value="Phụ kiện">Phụ Kiện</option>
              </Form.Select>
            </Form.Group>

          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAdd(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAdd}>
            Add
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Name</Form.Label>
              <Form.Control
                value={activeCategory.name ?? ""}
                onChange={e => setActiveCategory({ ...activeCategory, name: e.target.value })}
                placeholder="Category name"
              />
            </Form.Group>
            <Form.Group className="mt-2">
              <Form.Label>Group</Form.Label>
              <Form.Select
                value={activeCategory.group_name ?? "Đồ nam"}
                onChange={e => setActiveCategory({ ...activeCategory, group_name: e.target.value })}
              >
                <option value="Đồ nam">Đồ nam</option>
                <option value="Đồ nữ">Đồ nữ</option>
                <option value="Đồ thể thao">Đồ thể thao</option>
                <option value="Trẻ em">Trẻ em</option>
                <option value="Phụ kiện">Phụ kiện</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEdit(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEdit}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDelete} onHide={() => setShowDelete(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Category</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex gap-2 align-items-center">
          {confirmDisabled && <FaLock />}
          Are you sure you want to delete <strong>{activeCategory.name}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" disabled={confirmDisabled} onClick={handleDelete}>
            {confirmDisabled ? `Delete (${deleteCountdown})` : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Row>
  );
};

export default CategoryPage;
