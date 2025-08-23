import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import router from "./routes/routers.js";

dotenv.config();
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());

// Routes
app.use("/", router);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on port http://localhost:${PORT}`)
);
