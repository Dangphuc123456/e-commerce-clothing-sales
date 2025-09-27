import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Table, Button, Modal, Form, Spinner, Row, Col, Card, Image, OverlayTrigger, Tooltip } from "react-bootstrap";
import api from "../../../api/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatCurrency } from "../../../utils/format";


interface Product {
  id?: number;
  name: string;
  description?: string;
  category_id?: number;
  image?: string;
  created_at?: string;
  price?: number;
  discount?: number;
  slug?: string;
  discounted_price?: number;
}

interface Category {
  id: number;
  name: string;
  created_at?: string;
  slug: string;
  Products?: Product[];
}

const CategoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const categoryId = id ? Number(id.split("-")[0]) : 0;

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  // Modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Product>({
    name: "",
    description: "",
    category_id: categoryId,
    image: "",
    price: 0,
    discount: 0,
  });

  useEffect(() => {
    if (!categoryId) return;
    loadCategory();
  }, [categoryId]);

  const loadCategory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/categories/${categoryId}`);
      const cat: Category = res.data?.data ?? res.data;
      setCategory(cat);
      setProducts(cat.Products ?? []);
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? err.message ?? "Failed to load category");
    } finally {
      setLoading(false);
    }
  };

  const openAddProduct = () => {
    setEditingProduct(null);
    setProductForm({ name: "", description: "", category_id: categoryId, image: "" });
    setShowProductModal(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({ ...product });
    setShowProductModal(true);
  };

  const handleSaveProduct = async () => {
    try {
      if (editingProduct && editingProduct.id) {
        await api.put(`/api/admin/products/${editingProduct.id}`, productForm);
        toast.success("Product updated");
      } else {
        await api.post("/api/admin/products", productForm);
        toast.success("Product created");
      }
      setShowProductModal(false);
      loadCategory();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? err.message ?? "Save failed");
    }
  };

  const handleDeleteProduct = async (productId?: number) => {
    if (!productId) return;
    if (!confirm("Are you sure to delete this product?")) return;
    try {
      await api.delete(`/api/admin/products/${productId}`);
      toast.success("Product deleted");
      loadCategory();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? err.message ?? "Delete failed");
    }
  };

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
    <Row className="p-4 justify-content-center">
      <ToastContainer />
      {/* Category Info */}
      <Col md={12} className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-primary fs-3">Category Detail</h2>
          <Link to="/admin/categories">
            <Button variant="outline-secondary">← Back to List</Button>
          </Link>
        </div>
        <Card className="shadow-sm">
          <Card.Body>
            <h5 className="text-info mb-3">Detailed information</h5>
            <Form>
              <Row className="my-3 mb-3">
                <Col md={6}>
                  <Form.Label>ID</Form.Label>
                  <Form.Control readOnly value={category?.id || ""} />
                </Col>
                <Col md={6}>
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    value={category?.name || ""}
                    onChange={e =>
                      setCategory(prev =>
                        prev ? { ...prev, name: e.target.value } : prev
                      )
                    } />
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Label>Slug</Form.Label>
                  <Form.Control readOnly value={category?.slug} />
                </Col>
                <Col md={6}>
                  <Form.Label>Created At</Form.Label>
                  <Form.Control
                    readOnly
                    value={
                      category?.created_at
                        ? new Date(category.created_at).toLocaleString()
                        : ""} />
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
      </Col>

      {/* Products List */}
      <Col md={12}>
        <Card className="shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="text-info mb-0">Product by category</h5>
              <Button variant="success" onClick={openAddProduct}>+ Add Product</Button>
            </div>

            {loading ? (
              <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>
            ) : (
              <>
                <Table striped bordered hover responsive className="table-sm">
                  <thead className="table-dark">
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Image</th>
                      <th>Price</th>
                      <th>Discount</th>
                      <th>Discounted_price</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-muted">No products</td>
                      </tr>
                    ) : (
                      currentProducts.map(p => (
                        <tr key={p.id}>
                          <td>{p.id}</td>
                          <td><Link to={`/admin/products/${p.id}-${p.slug}`}>{p.name}</Link></td>
                          <td>
                            <OverlayTrigger
                              placement="top"
                              overlay={
                                <Tooltip id={`tooltip-${p.id}`}>
                                  {p.description ?? "-"}
                                </Tooltip>
                              }>
                              <span>
                                {p.description
                                  ? p.description.length > 130
                                    ? p.description.substring(0, 130) + "..."
                                    : p.description
                                  : "-"}
                              </span>
                            </OverlayTrigger>
                          </td>
                          <td>{p.image && <Image src={p.image} width={60} height={60} />}</td>
                          <td>{formatCurrency(Number(p.price))}</td>
                          <td>{p.discount}%</td>
                          <td>{formatCurrency(Number(p.discounted_price))}</td>
                          <td className="text-center align-middle">
                            <div className="d-flex justify-content-center gap-2">
                              <Button size="sm" variant="warning" onClick={() => openEditProduct(p)}>Edit</Button>
                              <Button size="sm" variant="danger" onClick={() => handleDeleteProduct(p.id)}>Delete</Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>

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
          </Card.Body>
        </Card>
      </Col>

      {/* Product Modal */}
      <Modal show={showProductModal} onHide={() => setShowProductModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingProduct ? "Edit Product" : "Add Product"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                value={productForm.name ?? ""}
                onChange={e => setProductForm({ ...productForm, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={productForm.description ?? ""}
                onChange={e => setProductForm({ ...productForm, description: e.target.value })}
              />
            </Form.Group>

            {/* Image input */}
            <Form.Group className="mb-3">
              <Form.Label>Image</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={e => {
                  const target = e.target as HTMLInputElement;
                  if (target.files && target.files.length > 0) {
                    const file = target.files[0];
                    const imagePath = `/assets/${file.name}`;
                    setProductForm({ ...productForm, image: imagePath });
                  }
                }} />
              {productForm.image && (
                <div className="mt-2">
                  <Image src={productForm.image} width={100} />
                </div>
              )}
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Price</Form.Label>
              <Form.Control
                type="number"
                value={productForm.price ?? 0}
                onChange={e => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Discount (%)</Form.Label>
              <Form.Control
                type="number"
                value={productForm.discount ?? 0}
                onChange={e => setProductForm({ ...productForm, discount: parseFloat(e.target.value) })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProductModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSaveProduct}>{editingProduct ? "Save" : "Create"}</Button>
        </Modal.Footer>
      </Modal>
    </Row>
  );
};

export default CategoryDetailPage;
