import React, { useState, useEffect, useRef } from "react";
import {
  Navbar as BsNavbar,
  Container,
  Nav,
  Dropdown,
  Form,
  FormControl,
  Badge,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { FaBell, FaEnvelope, FaBars, FaTimes, FaCog, FaClipboardList, FaSun, FaSignOutAlt } from "react-icons/fa";
import logo from "../../assets/logo.png";
import api from "../../api/axios";
import "./Navbar.css";

interface SearchResult {
  id: number;
  name: string;
  type: "product" | "supplier" | "category" | "order" | "purchase";
  slug?: string;
}

const typeLabels: Record<string, string> = {
  product: "Sản phẩm",
  supplier: "Nhà cung cấp",
  category: "Loại",
  order: "Đơn hàng",
  purchase: "Phiếu nhập",
};

interface UserInfo {
  userId: string;
  role: string;
  username: string;
}
interface NavbarProps {
  onSelectCustomer: (id: number) => void;
}
const Navbar: React.FC<NavbarProps> = ({ onSelectCustomer }) => {
  const [orderNotifications, setOrderNotifications] = useState(0);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);

  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNavPanel, setShowNavPanel] = useState(false);
  const [brightness, setBrightness] = useState(100);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const [user, setUser] = useState<UserInfo | null>(null);

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
  // ===================== MESSAGE NOTIFICATIONS =====================
  const [messageList, setMessageList] = useState<any[]>([]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.get("/api/admin/messages/customers");
        setMessageList(res.data || []);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // auto refresh
    return () => clearInterval(interval);
  }, []);

  // 👉 badge chỉ tính số khách có tin chưa đọc
  const totalUnread = messageList.filter(item => (item.unread_count || 0) > 0).length;


  // ===================== SEARCH =====================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setKeyword(value);

    if (timer.current) clearTimeout(timer.current);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/admin/search?q=${encodeURIComponent(value)}`);
        setResults(res.data || []);
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      }
      setLoading(false);
    }, 300);
  };

  const handleSelect = (item: SearchResult) => {
    const slugPart = item.slug ? `-${item.slug}` : "";
    switch (item.type) {
      case "supplier":
        navigate(`/admin/suppliers/${item.id}${slugPart}`);
        break;
      case "category":
        navigate(`/admin/categories/${item.id}${slugPart}`);
        break;
      case "product":
        navigate(`/admin/products/${item.id}${slugPart}`);
        break;
      case "order":
        navigate(`/admin/orders/${item.id}`);
        break;
      case "purchase":
        navigate(`/admin/purchaseorders/${item.id}`);
        break;
    }
    setKeyword("");
    setShowDropdown(false);
    setShowNavPanel(false);
  };

  const handleBrightnessChange = (value: number) => {
    setBrightness(value);
    document.body.style.filter = `brightness(${value}%)`;
  };

  // ===================== FETCH PENDING ORDERS =====================
  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const res = await api.get("/api/admin/orders?status=pending");
        const orders = res.data?.data || [];
        setOrderNotifications(orders.length);
        setPendingOrders(orders.slice(0, 5));
      } catch (err) {
        console.error("Error fetching pending orders:", err);
      }
    };
    fetchPendingOrders();
    const interval = setInterval(fetchPendingOrders, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BsNavbar
      expand="lg"
      className="shadow-sm"
      style={{
        backgroundColor: "navy",
        height: "95px",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
    >
      <Container fluid style={{ position: "relative" }}>
        <BsNavbar.Brand
          as={Link}
          to={user?.role === "admin" ? "/admin/dashboard" : "/"}
          className="text-white d-flex align-items-center">
          <img
            src={logo}
            alt="Logo"
            style={{ maxWidth: "120px", height: "78px" }}
            className="d-inline-block align-top me-2 img-fluid"
          />
        </BsNavbar.Brand>

        {/* Toggle mobile */}
        <button
          className="btn btn-link text-white p-1 d-lg-none"
          aria-label="Toggle menu"
          onClick={() => setShowNavPanel((s) => !s)}
          style={{ textDecoration: "none" }}
        >
          {showNavPanel ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>

        {/* Nav desktop */}
        <div className="d-none d-lg-flex w-100">
          {/* Search */}
          <div style={{ position: "relative", maxWidth: "400px", width: "100%" }} className="mx-auto my-2 my-lg-0">
            <Form className="d-flex">
              <FormControl
                type="search"
                placeholder="Tìm kiếm..."
                className="me-2"
                style={{ borderRadius: "4px", height: "40px" }}
                value={keyword}
                onChange={handleChange}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              />
            </Form>
            {showDropdown && (
              <ul
                className="list-group position-absolute w-100 mt-1 shadow"
                style={{ zIndex: 2000, maxHeight: "250px", overflowY: "auto" }}>
                {loading && <li className="list-group-item text-muted">Đang tìm...</li>}
                {!loading && results.length === 0 && <li className="list-group-item text-muted">Không có kết quả</li>}
                {!loading &&
                  results.map((item) => (
                    <li
                      key={`${item.type}-${item.id}`}
                      className="list-group-item list-group-item-action"
                      onClick={() => handleSelect(item)}
                      style={{ cursor: "pointer" }}>
                      <strong>{item.name}</strong> <span className="text-muted">({typeLabels[item.type] || item.type})</span>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {/* Icons */}
          <Nav className="ms-auto d-flex align-items-center gap-3">
            {/* Order notifications */}
            <Dropdown align="end">
              <Dropdown.Toggle variant="link" className="position-relative text-white" style={{ textDecoration: "none" }}>
                <FaBell size={20} />
                {orderNotifications > 0 && (
                  <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle" style={{ fontSize: "0.6rem" }}>
                    {orderNotifications}
                  </Badge>
                )}
              </Dropdown.Toggle>
              <Dropdown.Menu style={{ minWidth: "300px" }}>
                <Dropdown.Header className="fs-6">Đơn hàng chờ xử lý</Dropdown.Header>
                {pendingOrders.length === 0 && <Dropdown.Item>Không có đơn hàng</Dropdown.Item>}
                {pendingOrders.map((order) => (
                  <Dropdown.Item key={order.id} onClick={() => navigate(`/admin/orders/${order.id}`)}>
                    Mã Order :{order.id} - {order.customer?.username || "Khách hàng"} ({order.status})
                  </Dropdown.Item>
                ))}
                <Dropdown.Divider />
                <Dropdown.Item as={Link} to="/admin/orders">Xem tất cả</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            {/* Message Notifications */}
            <Dropdown align="end">
              <Dropdown.Toggle
                variant="link"
                className="position-relative text-white"
                style={{ textDecoration: "none" }}>
                <FaEnvelope size={20} />
                {totalUnread > 0 && (
                  <Badge
                    bg="danger"
                    pill
                    className="position-absolute top-0 start-100 translate-middle"
                    style={{ fontSize: "0.6rem" }}>
                    {totalUnread}
                  </Badge>
                )}
              </Dropdown.Toggle>
              <Dropdown.Menu style={{ minWidth: "320px" }}>
                <Dropdown.Header className="fs-6">
                  Tin nhắn khách hàng
                </Dropdown.Header>
                {messageList.length === 0 && (
                  <Dropdown.Item>Không có tin nhắn</Dropdown.Item>
                )}
                {messageList.map((cus) => (
                  <Dropdown.Item
                    key={cus.customer_id}
                    onClick={() => onSelectCustomer(cus.customer_id)}
                    className={cus.unread_count > 0 ? "fw-bold text-danger" : ""}>
                    <img
                      src={"/assets/users.jfif"}
                      alt="avatar"
                      style={{ width: 26, height: 26, borderRadius: "50%", marginRight: 8 }}/>
                    <span>{cus.customer_name}</span>
                    {" "}
                    {cus.unread_count > 0
                      ? `(${cus.unread_count} chưa đọc)`
                      : "(đã đọc)"}
                    <br />
                    <small className="text-muted">{cus.last_message}</small>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
            {/* User dropdown */}
            <Dropdown align="end">
              <Dropdown.Toggle
                variant="light"
                id="dropdown-small"
                style={{ backgroundColor: "white", color: "navy" }}
              >
                {user?.username || "Tài khoản"}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.ItemText style={{ fontWeight: "bold" }}>
                  <FaCog className="me-2 text-secondary" />
                  Settings
                </Dropdown.ItemText>

                {user?.role === "admin" && (
                  <Dropdown.Item onClick={() => navigate("/admin/logs")}>
                    <FaClipboardList className="me-2 text-warning" />
                    Login Logs
                  </Dropdown.Item>
                )}

                <Dropdown.Item>
                  <div className="d-flex align-items-center">
                    <FaSun className="me-2 text-warning" />
                    <Form.Range
                      min={50}
                      max={100}
                      value={brightness}
                      onChange={(e) =>
                        handleBrightnessChange(Number(e.target.value))
                      }
                    />
                  </div>
                </Dropdown.Item>

                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout} className="text-danger fw-bold">
                  <FaSignOutAlt className="me-2" />
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </div>
      </Container>
    </BsNavbar>
  );
};

export default Navbar;
