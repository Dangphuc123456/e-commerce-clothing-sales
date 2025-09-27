import React, { useEffect, useState } from "react";
import { Table, Button, Spinner, Alert, Modal, Form } from "react-bootstrap";
import api from "../../../api/axios";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {formatPhone  } from "../../../utils/format";

interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  address: string;
  role: string;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(5);
  const [confirmDisabled, setConfirmDisabled] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ================= FETCH USERS =================
  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get<User[]>("/api/admin/users");
      const formattedUsers = res.data.map(u => ({
        ...u,
        phone: u.phone.startsWith("0") ? "+84" + u.phone.slice(1) : u.phone
      }));
      setUsers(formattedUsers);

      const totalPages = Math.ceil(formattedUsers.length / itemsPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ================= EDIT =================
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const submitEdit = async () => {
    if (!selectedUser) return;
    try {
      await api.put(`/api/admin/users/${selectedUser.id}`, selectedUser);
      toast.success("User updated successfully");
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Failed to update user");
    }
  };

  // ================= DELETE =================
  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
    setDeleteCountdown(5);
    setConfirmDisabled(true);
  };

  useEffect(() => {
    if (showDeleteModal) {
      setConfirmDisabled(true);
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
  }, [showDeleteModal]);

  const confirmDelete = async () => {
    if (!selectedUser) return;
    try {
      await api.delete(`/api/admin/users/${selectedUser.id}`);
      toast.success("User deleted successfully");
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Failed to delete user");
    }
  };

  // ================= PAGINATION LOGIC =================
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem);

  const handleChangeItemsPerPage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // reset về trang 1
  };

  return (
    <div className="p-2">
      <h5>User Management</h5>
      <ToastContainer />

      {loading && <Spinner animation="border" />}
      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && (
        <>
          <Table striped bordered hover responsive>
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length > 0 ? (
                currentUsers.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>{formatPhone(u.phone)}</td>
                    <td>{u.address}</td>
                    <td>{u.role}</td>
                    <td className="d-flex gap-2">
                      <Button variant="warning" size="sm" onClick={() => handleEdit(u)}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(u)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center">
                    No users available
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          {/* Pagination Controls */}
          <div className="d-flex justify-content-end align-items-center gap-3 mt-3">
            <div className="d-flex align-items-center gap-1">
              <span>Show</span>
              <select
                className="form-select mx-2"
                style={{ width: "70px" }}
                value={itemsPerPage}
                onChange={handleChangeItemsPerPage}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
              <span>records / page</span>
              <span className="ms-3">
                Total {totalPages} pages ({users.length} records)
              </span>
            </div>

            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setCurrentPage(1)}>
                    «
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => (
                  <li key={i + 1} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                    <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setCurrentPage(totalPages)}>
                    »
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </>
      )}

      {/* EDIT MODAL */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <Form>
              <Form.Group className="mb-2">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  value={selectedUser.username}
                  onChange={e =>
                    setSelectedUser({ ...selectedUser, username: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={selectedUser.email}
                  onChange={e =>
                    setSelectedUser({ ...selectedUser, email: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Phone</Form.Label>
                <PhoneInput
                  defaultCountry="VN"
                  value={selectedUser.phone || undefined}
                  onChange={phone => setSelectedUser({ ...selectedUser, phone: phone || "" })}
                  className="custom-phone-input no-border-inner"
                  style={{
                    borderRadius: "8px",
                    border: "1px solid #ced4da",
                    height: "44px",
                    padding: "0 12px",
                    fontSize: "1rem",
                    outline: "none",
                  }}
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  value={selectedUser.address}
                  onChange={e =>
                    setSelectedUser({ ...selectedUser, address: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Role</Form.Label>
                <Form.Select
                  value={selectedUser.role}
                  onChange={e =>
                    setSelectedUser({ ...selectedUser, role: e.target.value })
                  }
                >
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="customer">Customer</option>
                </Form.Select>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={submitEdit}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      {/* DELETE MODAL */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete user <strong>{selectedUser?.username}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" disabled={confirmDisabled} onClick={confirmDelete}>
            {confirmDisabled ? `Confirm Delete (${deleteCountdown})` : "Confirm Delete"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UsersPage;
