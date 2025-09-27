import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import MegaMenu from "../../components/client/MegaMenu";
import Footer from "../../components/client/Footer";
import ScrollToTopButton from "../../components/client/ScrollToTopButton";
import ChatBot from "../../components/client/ChatBot";
import { Button } from "react-bootstrap";
import "./Vibrate.css"

const MainLayout: React.FC = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation(); 
  const isHome = location.pathname === "/";

  return (
    <>
      <MegaMenu />
      <main style={{ minHeight: "70vh", padding: "0" }}>
        <Outlet />
      </main>
      <Footer />

      {/* ✅ Nút Scroll luôn nằm bên trái */}
      <div
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 9980,
        }}>
        <ScrollToTopButton />
      </div>

      {/* Chat box chỉ hiển thị ở Home */}
      {isHome && (
        <div
          aria-hidden={!open}
          style={{
            position: "fixed",
            right: 20,
            bottom: 90,
            width: open ? 320 : "auto",
            zIndex: 9999,
            transition: "width 200ms ease",
            pointerEvents: "auto",
          }}>
          {open ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.25)", borderRadius: 8 }}>
                <ChatBot />
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setOpen(false)}>
                Đóng chat
              </Button>
            </div>
          ) : (
            <Button
              variant="info"
              className="shake-button"
              style={{
                borderRadius: 6,
                padding: "8px 14px",
                fontWeight: 500,
              }}
              onClick={() => setOpen(true)}
              aria-label="Mở chat">
              💬 Hỗ trợ
            </Button>
          )}
        </div>
      )}
    </>
  );
};

export default MainLayout;
