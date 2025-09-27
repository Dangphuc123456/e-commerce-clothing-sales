import React, { useEffect, useState } from "react";
import api from "../../../api/axios";
import { Table, Spinner, Alert } from "react-bootstrap";

interface LoginLog {
  id: number;
  user_id: number;
  ip: string;
  user_agent: string;
  created_at: string;
}

const LogPage: React.FC = () => {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get<LoginLog[]>("/api/admin/logs");
        setLogs(res.data);
      } catch (err) {
        console.error(err);
        setError("Không thể tải log đăng nhập.");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="p-3 text-center">
        <Spinner animation="border" /> Đang tải log...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3">
        <Alert variant="danger">{error}</Alert>
      </div>
    );
  }

  return (
    <div className="p-3">
      <h3 className="mb-3 fs-5">Login Logs</h3>
      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>User ID</th>
            <th>IP</th>
            <th>User Agent</th>
            <th>Thời gian</th>
          </tr>
        </thead>
        <tbody>
          {logs.length > 0 ? (
            logs.map((log) => (
              <tr key={log.id}>
                <td>{log.id}</td>
                <td>{log.user_id}</td>
                <td>{log.ip}</td>
                <td>{log.user_agent}</td>
                <td>{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center">
                Không có dữ liệu log.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default LogPage;
