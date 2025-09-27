export const connectWS = (role: string, customerId?: number): WebSocket => {
  const createWS = (): WebSocket => {
    const url = `/api/ws?role=${role}${customerId ? `&customer_id=${customerId}` : ""}`;
    const ws = new WebSocket(`ws://localhost:8080${url}`);

    ws.onopen = () => console.log("WS open", role, customerId);
    ws.onclose = () => {
      console.log("WS closed, reconnecting...");
      setTimeout(createWS, 1000);
    };
    ws.onerror = (err) => {
      console.error("WS error", err);
      ws.close();
    };

    return ws;
  };

  return createWS();
};
