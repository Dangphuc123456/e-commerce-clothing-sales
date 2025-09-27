import React, { useEffect, useRef, useState } from "react";
import { connectWS } from "../../../api/websocket";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";
import "./Chat.css";

export interface Message {
  id: number;
  customer_id: number;
  sender_role: "admin" | "customer";
  message_text: string;
  image_url?: string;
  created_at: string;
}

interface ChatPageProps {
  role: "customer" | "admin";
  customerId?: number;
}

const ChatPage: React.FC<ChatPageProps> = ({ role, customerId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const actualCustomerId =
    role === "customer"
      ? Number(localStorage.getItem("userId")) || 0
      : customerId || 0;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (!actualCustomerId) return;

    let ws: WebSocket;

    const connect = () => {
      ws = connectWS(role, actualCustomerId);
      wsRef.current = ws;

      ws.onopen = () => {
        // Đã connect thành công (không log ra console nữa)
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          setMessages((prev) => {
            let newMessages: Message[] = [];

            if (data.messages) {
              newMessages = [
                ...prev,
                ...data.messages.filter(
                  (m: Message) => m.customer_id === actualCustomerId
                ),
              ];
            } else if (data.customer_id === actualCustomerId) {
              newMessages = [...prev, data];
            } else {
              return prev;
            }

            const unique = Array.from(
              new Map(newMessages.map((m) => [m.id, m])).values()
            );

            unique.sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            );

            return unique;
          });
        } catch {
          // Bỏ log parse error
        }
      };

      ws.onclose = () => {
        reconnectTimer.current = window.setTimeout(connect, 2000);
      };

      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      wsRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [role, actualCustomerId]);

  const handleSend = (text: string, imageUrl?: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const payload: Partial<Message> = {
      message_text: text,
      image_url: imageUrl,
      sender_role: role,
      customer_id: actualCustomerId,
    };

    ws.send(JSON.stringify(payload));
  };

  return (
    <div
      className={`chat-container d-flex flex-column ${
        role === "admin" ? "admin-chat" : "customer-chat"
      }`}
      style={{
        height: "100%",
        border: "1px solid #ccc",
        borderRadius: "8px",
        background: "#fff",
        overflow: "hidden",
      }}
    >
      {/* Danh sách tin nhắn */}
      <div
        className="message-list flex-grow-1 p-3"
        style={{ overflowY: "auto" }}
      >
        <MessageList messages={messages} role={role} />
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="message-input-container p-2 border-top"
        style={{
          flexShrink: 0,
          background: "#f8f8f8",
          borderTop: "1px solid #ddd",
        }}>
        <MessageInput onSend={handleSend} />
      </div>
    </div>
  );
};

export default ChatPage;
