import React, { useEffect } from "react";
import { Nav } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { FaTachometerAlt, FaUsers, FaBox, FaTruck, FaClipboardList, FaShoppingCart, FaThList, FaWarehouse, } from "react-icons/fa";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setCollapsed]);
  const role = localStorage.getItem("role") || "";
  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: <FaTachometerAlt /> },
    { name: "Categories", path: "/admin/categories", icon: <FaThList /> },
    { name: "Products", path: "/admin/products", icon: <FaBox /> },
    { name: "Suppliers", path: "/admin/suppliers", icon: <FaTruck /> },
    { name: "Purchase Orders", path: "/admin/purchase-orders", icon: <FaClipboardList /> },
    { name: "Orders", path: "/admin/orders", icon: <FaShoppingCart /> },
    { name: "Inventory Logs", path: "/admin/inventory-logs", icon: <FaWarehouse /> },
    { name: "Users", path: "/admin/users", icon: <FaUsers />, roles: ["admin"] },
  ];

  return (
    <div
      className="d-flex flex-column shadow-sm"
      style={{
        width: collapsed ? "50px" : "180px",
        position: "fixed",
        top: "95px",
        left: 0,
        bottom: 0,
        backgroundColor: "navy",
        color: "white",
        transition: "width 0.3s",
        padding: "10px",
      }}
    >
      <Nav className="flex-column flex-grow-1">
        {navItems.map((item) => {
        
          if (item.roles && !item.roles.includes(role)) return null;

          const isActive = location.pathname === item.path;
          return (
            <Nav.Link
              key={item.path}
              as={Link}
              to={item.path}
              className="d-flex align-items-center mb-2"
              style={{
                gap: "10px",
                padding: "10px",
                backgroundColor: isActive ? "white" : "transparent",
                color: isActive ? "navy" : "white",
                borderRadius: "5px",
                transition: "all 0.2s",
                marginTop: "10px",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "white";
                  e.currentTarget.style.color = "navy";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "white";
                }
              }}
            >
              <span>{item.icon}</span>
              {!collapsed && <span style={{ fontSize: "13px" }}>{item.name}</span>}
            </Nav.Link>
          );
        })}
      </Nav>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="btn btn-primary position-absolute"
        style={{
          top: "50%",
          right: "-10px",
          transform: "translateY(-50%)",
          borderRadius: "50%",
          width: "20px",
          height: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}>
        {collapsed ? ">" : "<"}
      </button>
    </div>
  );
};

export default Sidebar;
