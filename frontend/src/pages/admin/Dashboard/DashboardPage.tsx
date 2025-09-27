import React, { useEffect, useState } from "react";
import api from "../../../api/axios";
import { Line, Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  type ChartOptions,
} from "chart.js";
import { Spinner } from "react-bootstrap";

// register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface User { id: number; username: string; role: string; }
interface OrderItem { id: number; order_id: number; product_name: string; variant_id: number; quantity: number; price: number; }
interface Order { id: number; total: number; status: string; created_at: string; Items?: OrderItem[]; }
interface Purchase { id: number; variant_id: number; quantity: number; total: number; created_at: string; }

const injectedStyles = `...`; // giữ nguyên CSS của bạn

const fmtCurrency = (v: number) =>
  v >= 0 ? `${v.toLocaleString("vi-VN")}₫` : `${Math.abs(v).toLocaleString("vi-VN")}₫`;

const fmtMoneyCompact = (v: number | string) => {
  const n = Number(v);
  if (n >= 1_000_000_000) return `${Math.round(n / 1_000_000_000)}B`;
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}M`;
  return `${n.toLocaleString("vi-VN")}₫`;
};

const DashboardPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!document.getElementById("dashboard-tight-styles")) {
      const s = document.createElement("style");
      s.id = "dashboard-tight-styles";
      s.innerHTML = injectedStyles;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, ordersRes, purchasesRes] = await Promise.all([
          api.get("/api/admin/users"),
          api.get("/api/admin/orders"),
          api.get("/api/admin/purchases"),
        ]);
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        setOrders(Array.isArray(ordersRes.data?.data) ? ordersRes.data.data : []);
        setPurchases(Array.isArray(purchasesRes.data) ? purchasesRes.data : []);
      } catch (e) {
        setError("Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Spinner animation="border" className="d-block mx-auto mt-5" />;
  if (error) return <p className="text-danger text-center mt-5">{error}</p>;

  // ----- metrics -----
  const totalOrders = orders.length;
  const totalCustomers = users.filter(u => u.role === "customer").length;
  const totalRevenue = orders
    .filter(o => o.status === "completed" || o.status === "shipped")
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalPurchasesValue = purchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
  const totalSoldQuantity = orders.reduce(
    (sum, o) => sum + (o.Items?.reduce((s, item) => s + (Number(item.quantity) || 0), 0) ?? 0),
    0
  );
  const totalPurchasedQuantity = purchases.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);

  const cards = [
    { title: "Tổng đơn hàng", value: totalOrders, bg: "bg-primary" },
    { title: "Tổng khách hàng", value: totalCustomers, bg: "bg-success" },
    { title: "Tổng tiền nhập", value: fmtCurrency(totalPurchasesValue), bg: "bg-warning text-dark" },
    { title: "Tổng doanh thu", value: fmtCurrency(totalRevenue), bg: "bg-danger" },
    { title: "Tổng số lượng bán", value: totalSoldQuantity, bg: "bg-info text-white" },
    { title: "Tổng số lượng nhập", value: totalPurchasedQuantity, bg: "bg-secondary text-white" },
  ];

  // ----- pie: order statuses -----
  const statuses = ["pending", "confirmed", "shipped", "completed", "cancelled"];
  const statusCounts: Record<string, number> = {};
  statuses.forEach(s => (statusCounts[s] = 0));
  orders.forEach(o => { if (o.status && o.status in statusCounts) statusCounts[o.status]++; });
  const pieData = {
    labels: statuses.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    datasets: [{
      label: "Trạng thái đơn hàng",
      data: statuses.map(s => statusCounts[s]),
      backgroundColor: ["#ffc107", "#0d6efd", "#28a745", "#6f42c1", "#dc3545"],
      hoverOffset: 8
    }]
  };

  // ----- monthly labels -----
  const currentYear = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => `${currentYear}-${String(i + 1).padStart(2, "0")}`);
  const getMonthKey = (d: string | Date) => {
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return "invalid";
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
  };
  const monthLabelsShort = months.map(m => {
    const [y, mm] = m.split("-");
    return new Date(Number(y), Number(mm) - 1).toLocaleString("vi-VN", { month: "short" });
  });

  const lineData = {
    labels: monthLabelsShort,
    datasets: [
      {
        label: "Tiền nhập",
        data: months.map(month => purchases
          .filter(p => getMonthKey(p.created_at) === month)
          .reduce((s, p) => s + (Number(p.total) || 0), 0)
        ),
        borderColor: "#0d6efd",
        backgroundColor: "#0d6efd33",
        tension: 0.32,
        pointRadius: 2,
        fill: true
      },
      {
        label: "Tiền bán",
        data: months.map(month => orders
          .filter(o => (o.status === "completed" || o.status === "shipped") && getMonthKey(o.created_at) === month)
          .reduce((s, o) => s + (Number(o.total) || 0), 0)
        ),
        borderColor: "#28a745",
        backgroundColor: "#28a74533",
        tension: 0.32,
        pointRadius: 2,
        fill: true
      }
    ]
  };

  const barData = {
    labels: monthLabelsShort,
    datasets: [
      {
        label: "Số lượng nhập",
        data: months.map(month => purchases
          .filter(p => getMonthKey(p.created_at) === month)
          .reduce((s, p) => s + (Number(p.quantity) || 0), 0)
        ),
        backgroundColor: "#0d6efd99"
      },
      {
        label: "Số lượng bán",
        data: months.map((month) =>
          orders
            .filter(
              (o) =>
                (o.status === "completed" || o.status === "shipped") &&
                getMonthKey(o.created_at) === month
            )
            .reduce(
              (s, o) => s + (o.Items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) ?? 0),
              0
            )
        ),
        backgroundColor: "#28a74599"
      }
    ]
  };

  const lineOptions: ChartOptions<"line"> = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: "bottom" }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmtCurrency(Number(ctx.parsed.y) || 0)}` }, mode: "index", intersect: false } }, scales: { x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } }, y: { type: "linear", min: 0, max: 5_000_000_000, beginAtZero: false, grid: { display: true }, ticks: { stepSize: 100_000_000, callback: (v: number | string) => fmtMoneyCompact(v) } } } };

  const barOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "bottom" },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y ?? ctx.parsed}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { autoSkip: true, maxTicksLimit: 12 },
      },
      y: {
        beginAtZero: true,
        suggestedMax:
          Math.max(
            ...barData.datasets.flatMap((d) => d.data as number[])
          ) + 5,
        grid: { display: true },
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="dashboard-fluid">
      <div className="dashboard-inner">
        <div className="dashboard-header d-flex align-items-center justify-content-between">
          <h5 className="dashboard-title">Dashboard</h5>
        </div>

        <div className="row gx-2 gy-2 mb-3">
          {cards.map((c, i) => (
            <div className="col-6 col-md-2" key={i}>
              <div className={`card ${c.bg}`}>
                <div className="card-body text-center text-white">
                  <div className="card-title">{c.title}</div>
                  <div className="metric mt-1">{c.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="row gx-2 gy-3">
          <div className="col-lg-4 col-md-6">
            <div className="card chart-card" style={{ height: "490px" }}>
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">Order Status Overviews</h5>
                <div style={{ height: 440 }} className="pie-wrap mt-2">
                  <div className="chart-area"><Pie data={pieData} /></div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-8 col-md-6">
            <div className="card chart-card" style={{ height: "490px" }}>
              <div className="card-body">
                <h5 className="card-title">Revenue Flow: Purchases and Sales</h5>
                <div style={{ height: 440 }} className="mt-2"><Line data={lineData} options={lineOptions} /></div>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-3 gx-2">
          <div className="col-12">
            <div className="card chart-card" style={{ height: "490px" }}>
              <div className="card-body">
                <h5 className="card-title">Sales/Purchases chart</h5>
                <div style={{ height: 440 }} className="mt-2"><Bar data={barData} options={barOptions} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
