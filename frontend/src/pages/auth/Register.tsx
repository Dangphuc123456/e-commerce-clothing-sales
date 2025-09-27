import { useState } from "react";
import { Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/axios";

function Register() {
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        phone: "",
        address: "",
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post("/api/auth/register", form);
            toast.success(res.data.message || "🎉 Đăng ký thành công! Kiểm tra email để xác nhận.");
        } catch (err: any) {
            toast.error(err.response?.data || "❌ Đăng ký thất bại. Vui lòng thử lại!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-gradient">
            <div
                className="card shadow-lg p-5 animate__animated animate__zoomIn"
                style={{
                    width: "500px",
                    height: "auto",
                    borderRadius: "20px",
                    background: "linear-gradient(135deg, #dfe9f3 0%, #ffffff 100%)",
                }}>
                <h3 className="text-center mb-4 fw-bold text-primary fs-4">
                    Đăng ký tài khoản
                </h3>
                <form onSubmit={handleSubmit} className="fs-5">
                    <div className="mb-2">
                        <label className="form-label fw-semibold">Tên đăng nhập</label>
                        <input
                            type="text"
                            name="username"
                            className="form-control form-control-lg"
                            placeholder="Nhập tên đăng nhập..."
                            onChange={handleChange}
                            disabled={loading}
                            required />
                    </div>
                    <div className="mb-2">
                        <label className="form-label fw-semibold">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="form-control form-control-lg"
                            placeholder="Nhập email..."
                            onChange={handleChange}
                            disabled={loading}
                            required/>
                    </div>
                    <div className="mb-2">
                        <label className="form-label fw-semibold">Mật khẩu</label>
                        <input
                            type="password"
                            name="password"
                            className="form-control form-control-lg"
                            placeholder="Nhập mật khẩu..."
                            onChange={handleChange}
                            disabled={loading}
                            required/>
                    </div>
                    <div className="mb-2">
                        <label className="form-label fw-semibold">Số điện thoại</label>
                        <input
                            type="text"
                            name="phone"
                            className="form-control form-control-lg"
                            placeholder="Nhập số điện thoại..."
                            onChange={handleChange}
                            disabled={loading}
                            required/>
                    </div>
                    <div className="mb-2">
                        <label className="form-label fw-semibold">Địa chỉ</label>
                        <input
                            type="text"
                            name="address"
                            className="form-control form-control-lg"
                            placeholder="Nhập địa chỉ..."
                            onChange={handleChange}
                            disabled={loading}
                            required/>
                    </div>

                    <button
                        type="submit"
                         className="btn btn-primary btn-lg w-100 shadow-sm mt-4 d-block mx-auto fs-5"
                        disabled={loading}
                        style={{ transition: "transform 0.2s" }}
                        onMouseOver={(e) =>
                            (e.currentTarget.style.transform = "scale(1.05)")
                        }
                        onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}>
                        {loading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Đang xử lý...
                            </>
                        ) : (
                            "Đăng ký"
                        )}
                    </button>
                </form>

                <div className="text-center mt-4">
                    <small className="fs-5">
                        Đã có tài khoản?{" "}
                        <Link to="/login" className="text-decoration-none fw-bold">
                            Đăng nhập
                        </Link>
                    </small>
                </div>
            </div>
        </div>
    );
}

export default Register;
