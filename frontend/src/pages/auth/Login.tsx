import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/axios";


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
  } catch (err) {
    console.error("❌ Failed to decode token:", err);
    return null;
  }
}

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", form);
      const token = res.data.token;

      if (!token) {
        toast.error("❌ Không nhận được token!");
        return;
      }
      localStorage.setItem("token", token);
      toast.success("Đăng nhập thành công!");
      const decoded = decodeJWT(token);

      if (decoded?.user_id) {
        localStorage.setItem("userId", String(decoded.user_id));
      }
      if (decoded?.role) {
        localStorage.setItem("role", String(decoded.role));
      }
      if (decoded?.username) {
        localStorage.setItem("username", String(decoded.username));
      }

      const role = decoded?.role || "";

      if (role === "admin" || role === "staff") {
        navigate("/admin/dashboard");
      } else if (role === "customer") {
        navigate("/");
      } else {
        navigate("/login");
      }
    } catch (err: any) {
      toast.error(err.response?.data || "❌ Sai email hoặc mật khẩu!");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-gradient">
      <div
        className="card shadow-lg p-5 animate__animated animate__fadeIn"
        style={{
          width: "500px",
          borderRadius: "20px",
          background: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)",
        }}>
        <h2 className="text-center mb-4 fw-bold text-primary fs-4">
          Đăng nhập hệ thống
        </h2>
        <form onSubmit={handleSubmit} className="fs-5">
          <div className="mb-4">
            <label className="form-label fw-semibold">Email</label>
            <input
              type="email"
              name="email"
              className="form-control form-control-lg"
              placeholder="Nhập email..."
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-4">
            <label className="form-label fw-semibold">Mật khẩu</label>
            <input
              type="password"
              name="password"
              className="form-control form-control-lg"
              placeholder="Nhập mật khẩu..."
              onChange={handleChange}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-success btn-lg w-100 shadow-sm mt-4 d-block mx-auto fs-5"
            disabled={loading}
            style={{ transition: "transform 0.2s" }}
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}>
            {loading && (
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status" />
            )}
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>
        <div className="text-center mt-4">
          <small className="fs-5">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-decoration-none fw-bold">
              Đăng ký
            </Link>
          </small>
        </div>
      </div>
    </div>
  );
}

export default Login;
