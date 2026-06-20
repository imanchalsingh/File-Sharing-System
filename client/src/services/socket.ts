import { io, Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

let socket: Socket | null = null;

export const initiateSocketConnection = (userId: string) => {
  if (!socket) {
    socket = io(API_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socket.on("connect", () => {
      console.log("Connected to WebSocket Server");
      socket?.emit("join_room", userId);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket Server");
    });
  } else {
    // If socket exists but we are changing user/reconnecting, just join room
    socket.emit("join_room", userId);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const subscribeToFiles = (
  callbacks: {
    onUploaded?: (file: any) => void;
    onUpdated?: (file: any) => void;
    onDeleted?: (fileId: string) => void;
    onBulkDeleted?: (fileIds: string[]) => void;
  }
) => {
  if (!socket) return;

  if (callbacks.onUploaded) socket.on("FILE_UPLOADED", callbacks.onUploaded);
  if (callbacks.onUpdated) socket.on("FILE_UPDATED", callbacks.onUpdated);
  if (callbacks.onDeleted) socket.on("FILE_DELETED", callbacks.onDeleted);
  if (callbacks.onBulkDeleted) socket.on("FILES_BULK_DELETED", callbacks.onBulkDeleted);
};

export const unsubscribeFromFiles = () => {
  if (!socket) return;

  socket.off("FILE_UPLOADED");
  socket.off("FILE_UPDATED");
  socket.off("FILE_DELETED");
  socket.off("FILES_BULK_DELETED");
};

export const getSocket = () => socket;
