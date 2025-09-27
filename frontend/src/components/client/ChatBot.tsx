import React, { useEffect, useRef, useState } from "react";
import { Button, Form, Spinner, Card, Modal, Image, Badge } from "react-bootstrap";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../hooks/reduxHooks";
import { addToCart } from "../../slices/cartSlice";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


type Product = {
  id: number;
  name: string;
  price: number;
  image?: string;
  slug: string;
  category?: { id: number; name: string };
};

type ProductDetail = Product & {
  description?: string;
  discount?: number;
  discounted_price?: number;
  variants?: {
    id: number;
    name: string;
    price: number;
    stock?: number;
    sku?: string;
    size?: string;
    color?: string;
  }[];
};

type ChatTextMessage = {
  kind: "text";
  from: "user" | "bot";
  text: string;
};

type ChatProductMessage = {
  kind: "product";
  from: "bot";
  product: Product;
};

type ChatMessage = ChatTextMessage | ChatProductMessage;

type ChatResponse = {
  reply: string;
  products: Product[];
};

const ChatBot: React.FC = () => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const navigate = useNavigate();

  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selected, setSelected] = useState<ProductDetail | null>(null);

  const messagesRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [chat, loading]);

  const pushUserMessage = (text: string) =>
    setChat((prev) => [...prev, { kind: "text", from: "user", text }]);
  const pushBotText = (text: string) =>
    setChat((prev) => [...prev, { kind: "text", from: "bot", text }]);
  const pushBotProduct = (p: Product) =>
    setChat((prev) => [...prev, { kind: "product", from: "bot", product: p }]);

  const handleSend = async () => {
    const msg = message.trim();
    if (!msg) return;

    pushUserMessage(msg);
    setMessage("");
    setLoading(true);

    try {
      const res = await api.post<ChatResponse>("/api/customer/chat", { message: msg });
      pushBotText(res.data.reply);

      (res.data.products || []).forEach((p) => pushBotProduct(p));
    } catch (err) {
      console.error("chat send error:", err);
      pushBotText("Xin lỗi, chatbot đang gặp sự cố.");
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const openProductDetail = async (slug: string) => {
    setSelected(null);
    setDetailLoading(true);
    setShowDetail(true);

    try {
      const res = await api.get<{ product?: ProductDetail }>(`/api/customer/product/${slug}`);
      const payload = (res.data as any).product ?? (res.data as any);
      setSelected(payload as ProductDetail);
    } catch (err) {
      console.error("fetch product detail error:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setShowDetail(false);
    setSelected(null);
  };
  const dispatch = useAppDispatch();

  const handleBuyNow = async () => {
    if (!selected) return;

    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Bạn cần đăng nhập để mua hàng");
      navigate("/login");
      return;
    }

    try {
      await dispatch(
        addToCart({
          userId: Number(userId),
          productName: selected.name,
          variantId: selected.variants?.[0]?.id ?? 0,
          sku: selected.variants?.[0]?.sku ?? undefined,
          size: selected.variants?.[0]?.size ?? undefined,
          color: selected.variants?.[0]?.color ?? undefined,
          image: selected.image,
          price: selected.price,
          discounted_price: selected.discounted_price ?? null,
          quantity: 1,
        })
      ).unwrap();

      navigate("/cart");
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi mua hàng");
    }
  };

  const renderMessage = (m: ChatMessage, idx: number) => {
    if (m.kind === "text") {
      const isUser = m.from === "user";
      return (
        <div
          key={idx}
          className={`d-flex mb-2 ${isUser ? "justify-content-end" : "justify-content-start"}`}>
          <div
            className={`p-2 rounded-3 ${isUser ? "bg-primary text-white" : "bg-light border"}`}
            style={{ maxWidth: "75%", whiteSpace: "pre-wrap" }}>
            {m.text}
          </div>
        </div>
      );
    }

    const p = m.product;
    return (
      <div key={idx} className="d-flex mb-2 justify-content-start">
        <div
          className="d-flex align-items-center p-2 rounded-3 bg-white border shadow-sm"
          style={{ maxWidth: "90%", cursor: "pointer" }}
          onClick={() => openProductDetail(p.slug)}>
          <img
            src={p.image || "/no-image.png"}
            alt={p.name}
            style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, marginRight: 10 }}/>
          <div style={{ flex: 1 }}>
            <div className="fw-bold small text-truncate w-100" style={{ maxWidth: "180px" }}>
              {p.name}
            </div>

            <div className="text-danger small">{Math.round(p.price).toLocaleString()}₫</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <ToastContainer />
      <Card className="shadow-lg border-0 rounded-3" style={{ width: "100%", maxWidth: 360 }}>
        <Card.Header className="bg-primary text-white fw-bold">Chat với trợ lý</Card.Header>
        <Card.Body
          ref={messagesRef}
          style={{ overflowY: "auto", height: 360, backgroundColor: "#f8f9fa", padding: 12 }}>
          {chat.length === 0 && (
            <div className="text-muted small">
              Bạn có thể hỏi về giờ mở cửa, sản phẩm theo tên, loại, hoặc giá (vd: "áo dưới 300k")
            </div>
          )}
          {chat.map((m, i) => renderMessage(m, i))}
          {loading && (
            <div className="text-center text-muted small">
              <Spinner animation="border" size="sm" /> Đang trả lời...
            </div>
          )}
        </Card.Body>

        <Card.Footer className="d-flex gap-2">
          <Form.Control
            as="textarea"
            rows={1}
            placeholder="Nhập tin nhắn..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            ref={textareaRef}
            style={{ resize: "none" }}/>
          <Button variant="primary" disabled={loading} onClick={handleSend}>
            Gửi
          </Button>
        </Card.Footer>
      </Card>

      <Modal show={showDetail} onHide={closeDetail} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết sản phẩm</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailLoading && (
            <div className="text-center py-4">
              <Spinner animation="border" /> Đang tải...
            </div>
          )}
          {!detailLoading && selected && (
            <div className="d-flex gap-3">
              <div style={{ width: 240 }}>
                <Image src={selected.image || "/no-image.png"} fluid className="rounded" />
              </div>
              <div style={{ flex: 1 }}>
                <h5>
                  {selected.name}{" "}
                  {selected.discount && selected.discount > 0 && (
                    <Badge bg="success" className="ms-2">
                      -{selected.discount}%
                    </Badge>
                  )}
                </h5>
                <div className="mb-2">
                  <strong className="text-danger fs-5">
                    {selected.discounted_price
                      ? Math.round(selected.discounted_price).toLocaleString() + "₫"
                      : Math.round(selected.price).toLocaleString() + "₫"}
                  </strong>
                  {selected.discount && selected.discount > 0 && (
                    <small className="text-muted ms-2 text-decoration-line-through">
                      {Math.round(selected.price).toLocaleString()}₫
                    </small>
                  )}
                </div>
                {selected.description && <p>{selected.description}</p>}
                {selected.variants && selected.variants.length > 0 && (
                  <>
                    <div className="fw-bold">Phiên bản</div>
                    <div className="d-flex gap-2 flex-wrap">
                      {selected.variants.map((v) => (
                        <Badge key={v.id} bg="light" text="dark" className="border">
                          {v.name} — {Math.round(v.price).toLocaleString()}₫
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
                <div className="mt-3 d-flex gap-2">
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/product/${selected.slug}`)}>
                    Xem trang sản phẩm
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleBuyNow}>
                    Mua ngay
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ChatBot;
