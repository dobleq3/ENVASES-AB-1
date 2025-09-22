import toast from "react-hot-toast";

export function connectWebSocket(onMessage, maxRetries = 5) {
  const WS_URL = import.meta.env.VITE_WS_URL;
  let retries = 0;
  let socket;
  let reconnectTimeout;

  function initWebSocket() {
    socket = new WebSocket(`${WS_URL}/ws`);

    socket.onopen = () => {
      retries = 0;
      console.log("✅ WebSocket conectado");

      // 🔹 Cierra cualquier toast de reconexión
      toast.dismiss("reconnect-toast");

      toast.success("🔗 Conexión WebSocket establecida");
    };

    socket.onmessage = (event) => {
      console.log("📩 Mensaje recibido:", event.data);
      onMessage(event.data);
    };

    socket.onerror = (err) => {
      console.error("❌ Error WebSocket:", err);
    };

    socket.onclose = () => {
      console.warn("⚠️ WebSocket cerrado");
      if (retries < maxRetries) {
        retries++;
        const delay = Math.min(1000 * retries, 10000); // backoff hasta 10s máx
        console.log(`⏳ Reintentando conexión en ${delay / 1000}s...`);

        // 🔹 Mostrar/actualizar un único toast de reconexión
        toast.loading(`Reconectando WebSocket... (${retries}/${maxRetries})`, {
          id: "reconnect-toast",
        });

        reconnectTimeout = setTimeout(initWebSocket, delay);
      } else {
        toast.error("❌ No se pudo reconectar al WebSocket");
      }
    };
  }

  // Inicializar conexión
  initWebSocket();

  return {
    getSocket: () => socket,
    close: () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) socket.close();
    },
  };
}
