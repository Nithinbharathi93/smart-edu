import dotenv from "dotenv";
import { InferenceClient } from "@huggingface/inference";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// Initialize Hugging Face
const hf = new InferenceClient(process.env.HF_API_KEY);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export { hf, geminiModel };