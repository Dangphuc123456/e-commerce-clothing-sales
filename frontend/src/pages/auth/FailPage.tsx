import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";

function FailPage() {
    const [params] = useSearchParams();
    const reason = params.get("reason") || "Không xác định";

    useEffect(() => {
        toast.error(`Xác nhận thất bại: ${reason}`,);
    }, [reason]);

    return (
        <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
            <div className="card shadow p-5 text-center" style={{ maxWidth: "500px", borderRadius: "15px" }}>
                <h2 className="text-danger mb-3">❌ Xác nhận thất bại!</h2>
                <p className="lead">{reason}</p>
                <a href="/register" className="btn btn-outline-danger mt-3">
                    Quay lại đăng ký
                </a>
            </div>
            <ToastContainer />
        </div>
    );
}

export default FailPage;
