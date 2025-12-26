import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import Routes
import aiRoutes from "./routes/aiRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";
import compilerRoutes from "./routes/compilerRoutes.js";
import authRoutes from "./routes/authRoutes.js";

// Import DB (Optional: just ensures connection starts if you add logic later)
import supabase from "./config/supabaseClient.js"; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mount Routes
app.use("/api/auth", authRoutes);   // e.g., POST /api/auth/signup
app.use("/api/ai", aiRoutes);       // e.g., POST /api/ai/code-comments
app.use("/api/pdf", pdfRoutes);     // e.g., POST /api/pdf/upload-pdf
app.use("/api/compiler", compilerRoutes); // e.g., POST /api/compiler/run

// Root Check
app.get("/", (req, res) => {
    res.send("Unified Server is Running...");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});