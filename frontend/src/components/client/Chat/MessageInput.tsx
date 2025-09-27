import React, { useState } from "react";

interface Props {
  onSend: (text: string, imageUrl?: string) => void;
}

const MessageInput: React.FC<Props> = ({ onSend }) => {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="d-flex">
      <textarea
        className="form-control"
        placeholder="Nhập tin nhắn..."
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = e.target.scrollHeight + "px";
        }}
        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
        style={{
          resize: "none",           
          overflowY: "hidden",
          minHeight: "50px",        
          maxHeight: "120px",
          borderRadius: "4px",
          width: "300px",
        }}
      />
      <button className="btn btn-primary ms-2" onClick={handleSend}>
        Gửi
      </button>
    </div>
  );
};

export default MessageInput;
