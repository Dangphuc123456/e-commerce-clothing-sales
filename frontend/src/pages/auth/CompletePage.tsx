import { useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";

function CompletePage() {
  useEffect(() => {
    toast.success("Xác nhận thành công! Bạn có thể đăng nhập ngay.", );
  }, []);

  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow p-5 text-center" style={{ maxWidth: "500px", borderRadius: "15px" }}>
        <h2 className="text-success mb-3">✅ Xác nhận thành công!</h2>
        <p className="lead">Bạn có thể quay lại trang đăng nhập để sử dụng dịch vụ.</p>
        <a href="/login" className="btn btn-success mt-3">
          Đăng nhập ngay
        </a>
      </div>
      <ToastContainer />
    </div>
  );
}

export default CompletePage;
