import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { CONFIG } from "../config.js";

// Generic extractor - easy to add 'extractTextFromDocx' later
export async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    // improved regex to clean weird PDF artifacts
    return data.text.replace(/\n\n+/g, "\n").replace(/\0/g, "").trim();
  } catch (error) {
    throw new Error(`PDF Parsing failed: ${error.message}`);
  }
}

export async function chunkText(text, chunkSize = CONFIG.chunking.size, chunkOverlap = CONFIG.chunking.overlap) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: ["\n\n", "\n", ". ", " ", ""], // Added ". " for better sentence splitting
  });
  
  const documents = await splitter.createDocuments([text]);
  return documents.map(doc => doc.pageContent);
}