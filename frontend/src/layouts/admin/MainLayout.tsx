import { useState } from "react";
import Sidebar from "../../components/admin/Sidebar";
import Navbar from "../../components/admin/Navbar";
import AdminChatWidget from "../../components/admin/Chat/AdminChatWidget";
import { Outlet } from "react-router-dom";

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [showChat, setShowChat] = useState(false);

  return (
    <>
      <Navbar
        onSelectCustomer={(id: number) => {
          setSelectedCustomer(id);
          setShowChat(true); 
        }}
      />
      <div className="d-flex" style={{ paddingTop: "95px" }}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main
          className="flex-grow-1 p-4 overflow-auto"
          style={{
            marginLeft: collapsed ? "50px" : "180px",
            transition: "margin-left 0.3s",
          }}>
          <Outlet />
        </main>
      </div>
      <AdminChatWidget
        selectedCustomer={selectedCustomer}
        show={showChat}
        onClose={() => setShowChat(false)}
      />
    </>
  );
};

export default MainLayout;
