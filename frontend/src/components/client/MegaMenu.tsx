import React, { useEffect, useState } from "react";
import { Navbar, Container, Nav, NavDropdown, Badge, Button, Spinner, Form, FormControl } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { useAppSelector } from "../../hooks/reduxHooks";
import api from "../../api/axios";
import logoImg from "../../assets/logo2.png";
import "bootstrap-icons/font/bootstrap-icons.css";
import { FaShoppingCart, FaHistory, FaTachometerAlt, FaClipboardList, FaSignOutAlt, FaUserPlus, FaSignInAlt } from "react-icons/fa";
import "./MegaMenu.css";

interface Category {
  id: number;
  name: string;
  group_name: string;
  slug: string;
}

const GROUPS = ["Áo Nam", "Quần Nam", "Đồ Bộ", "Phụ Kiện"];

interface UserInfo {
  userId: string;
  role: string;
  username: string;
}

const MegaMenu: React.FC = () => {
  const [categoriesMap, setCategoriesMap] = useState<Record<string, Category[]>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{ id: number; name: string; slug: string; image?: string }[]>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [user, setUser] = useState<UserInfo | null>(null);
  const navigate = useNavigate();

  const { items } = useAppSelector((state) => state.cart);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  // ===================== CHECK LOGIN =====================
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("role");
    const username = localStorage.getItem("username");

    if (token && userId && role && username) {
      setUser({ userId, role, username });
    } else {
      setUser(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    setUser(null);
    navigate("/login");
  };

  // ===================== FETCH CATEGORIES =====================
  const fetchCategories = async (group: string) => {
    if (categoriesMap[group] || loadingMap[group]) return;
    setLoadingMap((p) => ({ ...p, [group]: true }));
    setErrorMap((p) => ({ ...p, [group]: null }));

    try {
      const res = await api.get<{ group_name: string; categories: Category[] }>(
        "/api/customer/categories",
        { params: { group_name: group } }
      );
      setCategoriesMap((p) => ({ ...p, [group]: res.data?.categories ?? [] }));
    } catch (err: any) {
      setErrorMap((p) => ({ ...p, [group]: err?.message || "Error" }));
    } finally {
      setLoadingMap((p) => ({ ...p, [group]: false }));
    }
  };

  const handleToggle = (open: boolean, group: string) => {
    if (open) {
      fetchCategories(group);
      setOpenDropdown(group);
    } else setOpenDropdown(null);
  };

  // ===================== SEARCH SUGGEST =====================
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    setLoadingSuggest(true);
    try {
      const res = await api.get("/api/customer/search/suggest", { params: { q: value.trim() } });
      setSuggestions(res.data || []);
    } catch (err) {
      console.error("Search suggest error", err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  };

  return (
    <>
      {/* Top bar */}
      <header className="top-header bg-dark text-white py-1">
        <Container fluid className="d-flex justify-content-between align-items-center px-4 py-1 top-bar">
          <span className="ps-3">
            📞 Hotline:{" "}
            <a href="tel:+84123456789" className="text-white hotline-link">
              +0964 505 836
            </a>
          </span>

          <div className="d-flex gap-2 pe-4">
            {user ? (
              <NavDropdown
                title={user.username}
                id="user-dropdown"
                align="end"
                style={{ zIndex: 1050 }}>
                {user.role === "customer" && (
                  <>
                    <NavDropdown.Item onClick={() => navigate("/orders")}>
                      <FaShoppingCart className="me-2 text-primary" />
                      Đơn hàng của tôi
                    </NavDropdown.Item>
                    <NavDropdown.Item onClick={() => navigate("/orders/history")}>
                      <FaHistory className="me-2 text-secondary" />
                      Lịch sử đơn hàng
                    </NavDropdown.Item>
                  </>
                )}

                {user.role === "admin" && (
                  <>
                    <NavDropdown.Item onClick={() => navigate("/admin/dashboard")}>
                      <FaTachometerAlt className="me-2 text-success" />
                      Dashboard
                    </NavDropdown.Item>
                    <NavDropdown.Item onClick={() => navigate("/admin/logs")}>
                      <FaClipboardList className="me-2 text-warning" />
                      Login Logs
                    </NavDropdown.Item>
                  </>
                )}

                <NavDropdown.Divider />

                <NavDropdown.Item
                  onClick={handleLogout}
                  className="text-danger fw-bold">
                  <FaSignOutAlt className="me-2" />
                  Đăng xuất
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={() => navigate("/register")}>
                  <FaUserPlus className="me-2" />
                  Sign up
                </Button>
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={() => navigate("/login")}>
                  <FaSignInAlt className="me-2" />
                  Sign in
                </Button>
              </>
            )}
          </div>
        </Container>
      </header>

      {/* Mega Navbar */}
      <Navbar expand="lg" className="mega-navbar shadow-sm sticky-top" expanded={expanded} onToggle={() => setExpanded(!expanded)}>
        <Container fluid className="align-items-center">
          <Navbar.Brand as={Link} to="/" className="brand">
            <img
              src={logoImg}
              alt="ShopClothes Logo"
              title="ShopClothes - Trang chủ"
              style={{ maxWidth: "340px", height: "68px", marginLeft: "30px" }} />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbar-mega" className="ms-auto" />
          <Navbar.Collapse id="navbar-mega" className="justify-content-between">
            {/* Menu nhóm danh mục */}
            <Nav className="mx-auto mega-menu-center">
              {GROUPS.map((group) => {
                const cats = categoriesMap[group] ?? [];
                const isLoading = !!loadingMap[group];
                const error = errorMap[group] ?? null;
                return (
                  <NavDropdown
                    key={group}
                    title={group.toUpperCase()}
                    id={`nav-${group}`}
                    onToggle={(open) => handleToggle(open, group)}
                    show={openDropdown === group}
                    className="mega-dropdown">
                    <div className="mega-dropdown-content">
                      <div className="mega-body p-4">
                        {isLoading && <div className="text-center w-100 py-4"><Spinner animation="border" size="sm" /> Đang tải...</div>}
                        {!isLoading && error && <div className="text-danger w-100">{error}</div>}
                        {!isLoading && !error && cats.length === 0 && <div className="w-100">Không có mục</div>}
                        {!isLoading && !error && cats.length > 0 && (
                          <div className="mega-cats-row no-image">
                            {cats.map((cat) => (
                              <div
                                key={cat.id}
                                className="mega-cat-card no-image-card"
                                onClick={() => {
                                  if (cat.slug) {
                                    navigate(`/category/${encodeURIComponent(cat.slug)}`);
                                    setOpenDropdown(null);
                                    setExpanded(false);
                                  }
                                }}>
                                <div className="cat-name-large">{cat.name}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </NavDropdown>
                );
              })}
              <Nav.Link
                onClick={() => navigate("/products/discount")}
                className="d-flex align-items-center position-relative"
                style={{ cursor: "pointer" }}>
                <span>GIẢM GIÁ</span>
                <span
                  className="discount-badge-menu text-white position-absolute top-0 start-100 translate-middle"
                  style={{
                    backgroundColor: "red",
                    fontSize: "0.7rem",
                    padding: "0 4px",
                    borderRadius: "4px",
                    marginLeft: "5px",
                  }}>
                  50%
                </span>
              </Nav.Link>
            </Nav>
            {/* Search + Cart */}
            <div className="d-flex align-items-center gap-2 actions-right pe-4">
              <Button
                variant="outline-light"
                size="lg"
                className="action-btn"
                onClick={() => {
                  if (searchOpen && searchText.trim()) {
                    navigate(`/search?q=${encodeURIComponent(searchText.trim())}`);
                    setSearchText("");
                    setSearchOpen(false);
                    setSuggestions([]);
                  } else {
                    setSearchOpen(true);
                  }
                }}
                aria-label="Search products">
                <i className="bi bi-search fs-5 fw-bold"></i>
              </Button>

              {searchOpen && (
                <div className="position-relative">
                  <Form
                    className="d-flex"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (searchText.trim()) {
                        navigate(`/search?q=${encodeURIComponent(searchText.trim())}`);
                        setSearchText("");
                        setSearchOpen(false);
                        setSuggestions([]);
                      }
                    }}>
                    <FormControl
                      type="search"
                      placeholder="Tìm kiếm sản phẩm..."
                      className="me-2 search-input"
                      value={searchText}
                      onChange={handleInputChange}
                      autoFocus
                      aria-label="Search" />
                  </Form>

                  {searchText && (
                    <div className="search-suggestions position-absolute bg-white shadow rounded w-100 mt-1">
                      {loadingSuggest && <div className="p-2 text-muted">Đang tìm...</div>}
                      {!loadingSuggest && suggestions.length === 0 && <div className="p-2 text-muted">Không tìm thấy sản phẩm</div>}
                      {!loadingSuggest && suggestions.map((prod) => (
                        <div
                          key={prod.id}
                          className="p-2 d-flex align-items-center gap-2 suggestion-item"
                          onClick={() => {
                            navigate(`/product/${prod.slug}`);
                            setSearchOpen(false);
                            setSearchText("");
                            setSuggestions([]);
                          }}
                          style={{ cursor: "pointer" }}>
                          {prod.image && (
                            <img
                              src={prod.image}
                              alt={prod.name}
                              style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }} />
                          )}
                          <span>{prod.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Giỏ hàng */}
              <Button
                variant="outline-light"
                size="lg"
                className="action-btn position-relative"
                onClick={() => navigate("/cart")}
                aria-label="Go to cart">
                <i className="bi bi-cart fs-5 fw-bold"></i>
                <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle">
                  {cartCount}
                </Badge>
              </Button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
};

export default MegaMenu;
