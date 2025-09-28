import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Container, Table, Image, Form, Button, Row, Col } from "react-bootstrap";
import { useAppSelector, useAppDispatch } from "../../../hooks/reduxHooks";
import { clearCart } from "../../../slices/cartSlice";
import { formatCurrency } from "../../../utils/format";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../../api/axios";

interface LocationState {
  selected: number[];
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}


function decodeJWT(token: string): any {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const state = location.state as LocationState;
  const selectedVariantIds = state?.selected || [];

  const { items } = useAppSelector((state) => state.cart);
  const selectedItems = items.filter((item) => selectedVariantIds.includes(item.variantId));
  const total = selectedItems.reduce(
    (sum, item) => sum + (Number(item.discounted_price ?? item.price) * item.quantity),
    0
  );

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<"cod" | "vnpay">("cod");
  const [loading, setLoading] = useState(false);

  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded) {
        setCustomerInfo({
          name: decoded.username || "",
          email: decoded.email || "",
          phone: decoded.phone_number || "",
          address: decoded.address || "",
        });
      }
     
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

   
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status"); 
    if (status === "confirmed") {
     
      dispatch(clearCart());
      localStorage.removeItem("cartItems");
      toast.success("Thanh toán VNPay thành công!");
     
      navigate("/thankyou", { replace: true });
    } else if (status === "cancelled") {
      toast.error("Thanh toán VNPay bị huỷ hoặc thất bại!");
    }
  }, [dispatch, navigate]);

  const handleChangeCustomerInfo = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerInfo({ ...customerInfo, [e.target.name]: e.target.value });
  };


  const buildOrderData = () => ({
    customer_id: Number(localStorage.getItem("userId")),
    payment_method: paymentMethod,
    total,
    items: selectedItems.map((i) => {
      
      const pid = (i as any).productId ?? i.variantId;
      return {
        product_id: pid,
        variant_id: i.variantId,
        product_name: i.productName,
        sku: i.sku,
        quantity: i.quantity,
        price: i.discounted_price ?? i.price,
        size: i.size,
        color: i.color,
        image: i.image,
      };
    }),
    address: {
      name: customerInfo.name,
      email: customerInfo.email,
      phone: customerInfo.phone,
      address: customerInfo.address,
    },
  });

 
  const handleSubmitOrder = async () => {
   
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address || !customerInfo.email) {
      toast.error("Vui lòng điền đầy đủ thông tin khách hàng, bao gồm email!");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      toast.error("Email không hợp lệ!");
      return;
    }

    const userId = localStorage.getItem("userId");
    if (!userId) {
      toast.error("Bạn chưa đăng nhập. Vui lòng đăng nhập để đặt hàng.");
      return;
    }

    setLoading(true);
    const orderData = buildOrderData();

    try {
     
      const token = localStorage.getItem("token");
      if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
      const { data } = await api.post("/api/customer/orders", orderData);
      if (data && data.url) {
        window.location.href = data.url;
        return;
      }
      dispatch(clearCart());
      localStorage.removeItem("cartItems");
      toast.success("Đặt hàng thành công!", { autoClose: 1500, onClose: () => navigate("/thankyou") });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Lỗi khi đặt hàng. Vui lòng thử lại.";
      toast.error("Lỗi khi đặt hàng: " + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-4">
      <ToastContainer />
      <h1 className="fs-5">✅ Thanh toán</h1>
      {selectedItems.length === 0 ? (
        <p className="text-center">Không có sản phẩm nào để thanh toán.</p>
      ) : (
        <>
          <Table bordered hover responsive className="text-center">
            <thead>
              <tr>
                <th>Hình ảnh</th>
                <th>Sản phẩm</th>
                <th>Mã sản phẩm</th>
                <th>Màu / Size</th>
                <th>Số lượng</th>
                <th>Giá</th>
                <th>Tổng</th>
              </tr>
            </thead>
            <tbody>
              {selectedItems.map((item) => (
                <tr key={item.variantId}>
                  <td style={{ width: 100 }}>
                    {item.image && <Image src={item.image} alt={item.productName} fluid rounded />}
                  </td>
                  <td>{item.productName}</td>
                  <td>{item.sku}</td>
                  <td>{item.color} / {item.size}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(Number(item.discounted_price ?? item.price))}</td>
                  <td>{formatCurrency(Number(item.discounted_price ?? item.price) * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </Table>

          <h4 className="text-end">Tổng thanh toán: {formatCurrency(total)}</h4>

          <hr />

          <h5>Thông tin khách hàng</h5>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Tên khách hàng</Form.Label>
                  <Form.Control type="text" name="name" value={customerInfo.name} onChange={handleChangeCustomerInfo} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" name="email" value={customerInfo.email} onChange={handleChangeCustomerInfo} />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Số điện thoại</Form.Label>
                  <Form.Control type="text" name="phone" value={customerInfo.phone} onChange={handleChangeCustomerInfo} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Địa chỉ</Form.Label>
                  <Form.Control type="text" name="address" value={customerInfo.address} onChange={handleChangeCustomerInfo} />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Phương thức thanh toán</Form.Label>
              <div>
                <Form.Check
                  type="radio"
                  label="Thanh toán khi nhận hàng"
                  name="paymentMethod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                <Form.Check
                  type="radio"
                  label="Thanh toán VNPay"
                  name="paymentMethod"
                  checked={paymentMethod === "vnpay"}
                  onChange={() => setPaymentMethod("vnpay")}
                />
              </div>
            </Form.Group>

            <Button
              variant="success"
              size="lg"
              onClick={handleSubmitOrder}
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "🛒 Xác nhận đặt hàng"}
            </Button>
          </Form>
        </>
      )}
    </Container>
  );
};

export default CheckoutPage;
