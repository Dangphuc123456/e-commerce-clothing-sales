import React from "react";

// Không import từ ChatPage, mà copy interface hoặc dùng inline
interface Message {
  id: number;
  customer_id: number;
  sender_role: "admin" | "customer";
  message_text: string;
  image_url?: string;
  created_at: string;
}

interface Props {
  message: Message;
  role: "customer" | "admin";
}

const MessageItem: React.FC<Props> = ({ message, role }) => {
  const isMine =
    (role === "customer" && message.sender_role === "customer") ||
    (role === "admin" && message.sender_role === "admin");

  return (
    <div className={`d-flex mb-2 ${isMine ? "justify-content-end" : "justify-content-start"}`}>
      <div
        className={`p-2 rounded-3 ${isMine ? "bg-primary text-white" : "bg-light text-dark"}`}
        style={{ maxWidth: "70%", wordBreak: "break-word" }}
      >
        {message.message_text}
        {message.image_url && (
          <img src={message.image_url} alt="" className="img-fluid mt-1 rounded" />
        )}
      </div>
    </div>
  );
};

export default MessageItem;
