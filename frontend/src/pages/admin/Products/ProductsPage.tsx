import React, { useEffect, useState } from "react";
import { Table, Button, Spinner, Modal, Form, Row, Col, Image } from "react-bootstrap";
import { Link } from "react-router-dom";
import api from "../../../api/axios";
import { toast, ToastContainer } from "react-toastify";
import Select from "react-select";
import { formatCurrency } from "../../../utils/format";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

interface Product {
  id: number;
  name: string;
  description?: string;
  category_id?: number;
  image?: string;
  price?: number;
  discount?: number;
  discounted_price?: number;
  created_at?: string;
  slug:string;
}

interface CategoryOption {
  value: number;
  label: string;
}

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Partial<Product>>({});
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/products");
      const list: Product[] = res.data?.data ?? res.data ?? [];
      setProducts(list);
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? err.message ?? "Load products failed");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.get("/api/admin/categories");
      const data = Array.isArray(res.data?.data ?? res.data) ? res.data.data ?? res.data : [];
      setCategories(data.map((c: any) => ({ value: c.id, label: c.name })));
    } catch {
      toast.error("Không tải được danh sách categories");
    }
  };

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  const handleAdd = async () => {
    try {
      await api.post("/api/admin/products", {
        name: activeProduct.name,
        description: activeProduct.description,
        category_id: activeProduct.category_id,
        image: activeProduct.image,
        price: activeProduct.price,
        discount: activeProduct.discount,
      });
      toast.success("Product created");
      setShowAdd(false);
      setActiveProduct({});
      loadProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? err.message ?? "Create failed");
    }
  };

  const handleEdit = async () => {
    if (!activeProduct.id) return;
    try {
      await api.put(`/api/admin/products/${activeProduct.id}`, {
        name: activeProduct.name,
        description: activeProduct.description,
        category_id: activeProduct.category_id,
        image: activeProduct.image,
        price: activeProduct.price,
        discount: activeProduct.discount,
      });
      toast.success("Product updated");
      setShowEdit(false);
      setActiveProduct({});
      loadProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? err.message ?? "Update failed");
    }
  };

  const handleDelete = async () => {
    if (!activeProduct.id) return;
    try {
      await api.delete(`/api/admin/products/${activeProduct.id}`);
      toast.success("Product deleted");
      setShowDelete(false);
      setActiveProduct({});
      loadProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? err.message ?? "Delete failed");
    }
  };

  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileName = e.target.files[0].name;
      const imagePath = `/assets/${fileName}`;
      setActiveProduct({ ...activeProduct, image: imagePath });
    }
  };

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(products.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = products.slice(indexOfFirstItem, indexOfLastItem);

  // Hiển thị 2 số trang trượt theo currentPage
  const getVisiblePages = () => {
    if (totalPages <= 2) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage === totalPages) return [totalPages - 1, totalPages];
    return [currentPage, currentPage + 1];
  };

  return (
    <Row className="p-2">
      <ToastContainer />
      <Col>
        <div className="d-flex justify-content-between align-items-center mb-1">
          <h5>Products Management</h5>
          <Button onClick={() => { setActiveProduct({}); setShowAdd(true); }}>+ Add Product</Button>
        </div>

        {loading ? (
          <Spinner animation="border" />
        ) : (
          <>
            <Table striped bordered hover responsive>
              <thead className="table-dark">
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Discount (%)</th>
                  <th>Discounted Price</th>
                  <th>Image</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentProducts.length === 0 ? (
                  <tr><td colSpan={5} className="text-center">No products</td></tr>
                ) : currentProducts.map(p => (
                  <tr key={p.id}>
                    <td><Link to={`/admin/products/${p.id}-${p.slug}`}>{p.name}</Link></td>
                    <td>
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip id={`tooltip-${p.id}`}>{p.description || ""}</Tooltip>}>
                        <span>
                          {p.description
                            ? p.description.length > 60
                              ? p.description.substring(0, 130) + "..."
                              : p.description
                            : ""}
                        </span>
                      </OverlayTrigger>
                    </td>
                    <td>{categories.find(c => c.value === p.category_id)?.label ?? p.category_id ?? "Unknown"}</td>
                    <td>{formatCurrency(Number(p.price))}</td>
                    <td>{p.discount}%</td>
                    <td>{formatCurrency(Number(p.discounted_price))}</td>
                    <td>{p.image && <Image src={p.image} width={60} height={60} />}</td>
                    <td className="text-center align-middle">
                      <div className="d-flex justify-content-center gap-2">
                        <Button size="sm" variant="warning" onClick={() => { setActiveProduct(p); setShowEdit(true); }}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => { setActiveProduct(p); setShowDelete(true); }}>Delete</Button>
                      </div>
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
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>bản ghi / trang</span>
                <span className="ms-3">Tổng {totalPages} trang ({products.length} bản ghi)</span>
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
        <Modal.Header closeButton><Modal.Title>Add Product</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Name</Form.Label>
              <Form.Control value={activeProduct.name ?? ""} onChange={e => setActiveProduct({ ...activeProduct, name: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Description</Form.Label>
              <Form.Control value={activeProduct.description ?? ""} onChange={e => setActiveProduct({ ...activeProduct, description: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Category</Form.Label>
              <Select
                options={categories}
                value={categories.find(c => c.value === activeProduct.category_id) ?? null}
                onChange={(selected) => setActiveProduct({ ...activeProduct, category_id: selected ? selected.value : undefined })}
                isClearable
                placeholder="Select Category..."
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Image</Form.Label>
              <Form.Control type="file" accept="image/*" onChange={handleSelectImage} />
              {activeProduct.image && <div className="mt-2"><Image src={activeProduct.image} width={100} /></div>}
            </Form.Group>
          </Form>
          <Form.Group className="mb-2">
            <Form.Label>Price</Form.Label>
            <Form.Control
              type="number"
              value={activeProduct.price ?? 0}
              onChange={e => setActiveProduct({ ...activeProduct, price: parseFloat(e.target.value) })}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Discount (%)</Form.Label>
            <Form.Control
              type="number"
              value={activeProduct.discount ?? 0}
              onChange={e => setActiveProduct({ ...activeProduct, discount: parseFloat(e.target.value) })}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAdd}>Add</Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)}>
        <Modal.Header closeButton><Modal.Title>Edit Product</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Name</Form.Label>
              <Form.Control value={activeProduct.name ?? ""} onChange={e => setActiveProduct({ ...activeProduct, name: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Description</Form.Label>
              <Form.Control value={activeProduct.description ?? ""} onChange={e => setActiveProduct({ ...activeProduct, description: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Category</Form.Label>
              <Select
                options={categories}
                value={categories.find(c => c.value === activeProduct.category_id) ?? null}
                onChange={(selected) => setActiveProduct({ ...activeProduct, category_id: selected ? selected.value : undefined })}
                isClearable
                placeholder="Select Category..."
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Image</Form.Label>
              <Form.Control type="file" accept="image/*" onChange={handleSelectImage} />
              {activeProduct.image && <div className="mt-2"><Image src={activeProduct.image} width={100} /></div>}
            </Form.Group>
          </Form>
          <Form.Group className="mb-2">
            <Form.Label>Price</Form.Label>
            <Form.Control
              type="number"
              value={activeProduct.price ?? 0}
              onChange={e => setActiveProduct({ ...activeProduct, price: parseFloat(e.target.value) })}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Discount (%)</Form.Label>
            <Form.Control
              type="number"
              value={activeProduct.discount ?? 0}
              onChange={e => setActiveProduct({ ...activeProduct, discount: parseFloat(e.target.value) })}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleEdit}>Save</Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDelete} onHide={() => setShowDelete(false)}>
        <Modal.Header closeButton><Modal.Title>Delete Product</Modal.Title></Modal.Header>
        <Modal.Body>Are you sure you want to delete <strong>{activeProduct.name}</strong>?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </Modal.Footer>
      </Modal>
    </Row>
  );
};

export default ProductsPage;
