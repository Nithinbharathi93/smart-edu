import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import path from "path";
import { CONFIG } from "../config.js";

// List of "Native" formats that are safe to read as plain text
const TEXT_EXTENSIONS = new Set([
  // Documents
  ".txt", ".md", ".markdown", ".csv", ".json", ".yaml", ".yml", ".xml",
  // Web
  ".html", ".css", ".js", ".jsx", ".ts", ".tsx",
  // Backend / Systems
  ".py", ".java", ".c", ".cpp", ".h", ".cs", ".go", ".rs", ".php", ".rb",
  ".sql", ".sh", ".bat", ".dockerfile", ".env"
]);

/**
 * Universal Text Extractor
 * Automatically switches strategy based on file extension.
 */
export async function extractText(buffer, filename) {
  const ext = path.extname(filename).toLowerCase();

  try {
    // Strategy 1: PDF
    if (ext === ".pdf") {
      const data = await pdfParse(buffer);
      return data.text.replace(/\n\n+/g, "\n").replace(/\0/g, "").trim();
    }

    // Strategy 2: Native Text (Code, Logs, Markdown)
    if (TEXT_EXTENSIONS.has(ext)) {
      // Simply convert the bytes to a string
      return buffer.toString("utf-8").trim();
    }

    throw new Error(`Unsupported file type: ${ext}`);

  } catch (error) {
    throw new Error(`Failed to parse ${filename}: ${error.message}`);
  }
}

export async function chunkText(text, chunkSize = CONFIG.chunking.size, chunkOverlap = CONFIG.chunking.overlap) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: ["\n\n", "\n", ";", "}", ". ", " ", ""], // Added code-friendly separators
  });
  
  const documents = await splitter.createDocuments([text]);
  return documents.map(doc => doc.pageContent);
}