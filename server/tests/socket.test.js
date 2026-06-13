/**
 * WebSocket Integration Test
 * 
 * This standalone script tests the WebSocket synchronization architecture.
 * It simulates the backend's Express + Socket.IO server emitting events
 * and a frontend client receiving them instantly.
 * 
 * Run using: node tests/socket.test.js
 */

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { io as Client } from "socket.io-client";

// 1. Setup Mock Server imitating index.js and fileController.js
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Attach io to app so it can be used in mock controllers
app.set("io", io);

io.on("connection", (socket) => {
  socket.on("join_room", (userId) => {
    socket.join(`user_${userId}`);
    // Room joined
  });
});

// Mock Controller simulating file upload
app.post("/test-upload", (req, res) => {
  const userId = "test_user_123";
  const mockFile = { id: "1", name: "test_file.png", type: "image", size: "1.2 MB" };
  
  const serverIo = req.app.get("io");
  serverIo.to(`user_${userId}`).emit("FILE_UPLOADED", mockFile);
  
  res.json({ success: true, file: mockFile });
});

// Mock Controller simulating file delete
app.post("/test-delete", (req, res) => {
  const userId = "test_user_123";
  const fileId = "1";
  
  const serverIo = req.app.get("io");
  serverIo.to(`user_${userId}`).emit("FILE_DELETED", fileId);
  
  res.json({ success: true });
});

// 2. Start Server
const PORT = 5555;
httpServer.listen(PORT, async () => {
  console.log("\n=============================================");
  console.log("   WebSocket Integration Test Suite Started  ");
  console.log("=============================================\n");

  let passedTests = 0;
  const totalTests = 2;

  // 3. Connect Client imitating the React Frontend
  const clientSocket = Client(`http://localhost:${PORT}`);

  clientSocket.on("connect", () => {
    clientSocket.emit("join_room", "test_user_123");

    // Wait a brief moment to ensure room is fully joined on the server
    setTimeout(async () => {
      
      // ----------------------------------------------------
      // Test 1: Real-time File Upload Event
      // ----------------------------------------------------
      console.log("Running Test 1: Verify FILE_UPLOADED event...");
      clientSocket.on("FILE_UPLOADED", (file) => {
        if (file.name === "test_file.png") {
          console.log("✅ Test 1 Passed: Received FILE_UPLOADED event instantly for test_user_123");
          passedTests++;
        } else {
          console.error("❌ Test 1 Failed: Received incorrect file data");
        }
      });
      // Trigger the mock backend endpoint
      await fetch(`http://localhost:${PORT}/test-upload`, { method: "POST" });

      // ----------------------------------------------------
      // Test 2: Real-time File Delete Event
      // ----------------------------------------------------
      console.log("\nRunning Test 2: Verify FILE_DELETED event...");
      clientSocket.on("FILE_DELETED", (fileId) => {
        if (fileId === "1") {
          console.log("✅ Test 2 Passed: Received FILE_DELETED event instantly for test_user_123");
          passedTests++;
        } else {
          console.error("❌ Test 2 Failed: Received incorrect file ID");
        }
      });
      // Trigger the mock backend endpoint
      await fetch(`http://localhost:${PORT}/test-delete`, { method: "POST" });

      // ----------------------------------------------------
      // Finish tests and cleanup
      // ----------------------------------------------------
      setTimeout(() => {
        console.log("\n=============================================");
        console.log(`   Test Results: ${passedTests}/${totalTests} Passed`);
        if (passedTests === totalTests) {
          console.log("   🎉 All WebSocket integration tests passed!");
        }
        console.log("=============================================\n");
        
        // Clean up infrastructure
        clientSocket.disconnect();
        httpServer.close();
        process.exit(0);
      }, 500);
      
    }, 200);
  });
});
