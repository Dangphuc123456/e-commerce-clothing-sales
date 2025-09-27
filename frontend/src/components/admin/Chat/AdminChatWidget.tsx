import ChatPage from "../../../components/client/Chat/ChatPage";

interface AdminChatWidgetProps {
  selectedCustomer?: number | null;
  show: boolean;
  onClose: () => void;
}

export default function AdminChatWidget({
  selectedCustomer,
  show,
  onClose,
}: AdminChatWidgetProps) {
  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 30,
        right: 20,
        width: 360,
        maxWidth: "90vw",
        height: 500,
        maxHeight: "80vh",
        border: "1px solid #ccc",
        borderRadius: "8px",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        zIndex: 1100,
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
      }}>
      {/* Header */}
      <div
        style={{
          padding: "10px 15px",
          borderBottom: "1px solid #eee",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#f8f8f8",
          flexShrink: 0,
        }}>
        <strong>Admin Chat</strong>
        <button className="btn btn-sm btn-secondary" onClick={onClose}>
          ✕
        </button>
      </div>
      {/* Nội dung */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {selectedCustomer ? (
          <ChatPage role="admin" customerId={selectedCustomer} />
        ) : (
          <p style={{ padding: "20px", textAlign: "center" }}>
            Chọn khách hàng để chat
          </p>
        )}
      </div>
    </div>
  );
}
