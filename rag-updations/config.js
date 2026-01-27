import dotenv from "dotenv";
dotenv.config();

export const CONFIG = {
  chunking: {
    size: 1000,
    overlap: 200,
  },
  ai: {
    embeddingModel: "sentence-transformers/all-MiniLM-L6-v2",
    chatModel: "meta-llama/Llama-3.1-8B-Instruct",
    temperature: 0.7,
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
  },
  hfToken: process.env.HF_ACCESS_TOKEN,
};