import React from "react";
import MessageItem from "./MessageItem";


interface Message {
  id: number;
  customer_id: number;
  sender_role: "admin" | "customer";
  message_text: string;
  image_url?: string;
  created_at: string;
}

interface Props {
  messages: Message[];
  role: "customer" | "admin";
}

const MessageList: React.FC<Props> = ({ messages, role }) => {
  return (
    <div className="d-flex flex-column bg-white p-3 " style={{ gap: "10px" }}>
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} role={role} />
      ))}
    </div>
  );
};

export default MessageList;
