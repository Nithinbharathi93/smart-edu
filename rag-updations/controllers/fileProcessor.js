import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import officeParser from "officeparser";
import EPub from "epub2";
import path from "path";
import fs from "fs/promises";
import os from "os";
import * as XLSX from "xlsx"; // For Excel
import { parse } from "csv-parse/sync"; // For CSV
import { CONFIG } from "../config.js";

const TEXT_EXTENSIONS = new Set([
  ".txt", ".md", ".markdown", ".json", ".xml", 
  ".html", ".css", ".js", ".jsx", ".ts", ".tsx", 
  ".py", ".java", ".c", ".cpp", ".sql", ".env" // Treat .sql as code/text
]);

async function parseWithTempFile(buffer, filename, parserFunction) {
  const tempPath = path.join(os.tmpdir(), `rag_temp_${Date.now()}_${filename}`);
  try {
    await fs.writeFile(tempPath, buffer);
    return await parserFunction(tempPath);
  } finally {
    try { await fs.unlink(tempPath); } catch (e) { /* ignore cleanup errors */ }
  }
}

/**
 * Helper: Convert Spreadsheet Rows to Sentences
 * Input: { Name: "John", Role: "Admin" }
 * Output: "Name: John, Role: Admin."
 */
function serializeRow(row, rowIndex) {
  const parts = Object.entries(row).map(([header, value]) => {
    // Skip empty cells
    if (value === null || value === undefined || value === "") return null;
    return `${header}: ${value}`;
  });
  
  if (parts.length === 0) return "";
  return `Row ${rowIndex + 1} - ${parts.filter(p => p).join(", ")}.`;
}

export async function extractText(buffer, filename) {
  const ext = path.extname(filename).toLowerCase();

  try {
    // --- 1. SPREADSHEETS (.csv, .xlsx) ---
    
    // CSV Handling
    // CSV Handling - UPDATED WITH DEBUGGING
    if (ext === ".csv") {
      const content = buffer.toString("utf-8");
      
      // DEBUG: Check if we can read the raw text
      console.log(`[CSV Debug] Raw content length: ${content.length}`);
      
      // FIX: Try to auto-detect if it's not a comma
      let delimiter = ",";
      if (content.indexOf(";") > -1 && content.indexOf(";") > content.indexOf(",")) {
        delimiter = ";"; // Switch to semicolon if likely
        console.log("[CSV Debug] Detected semicolon delimiter");
      }
      
      const records = parse(content, { 
        columns: true,       // Use first row as headers
        skip_empty_lines: true,
        trim: true,          // Trim whitespace from values
        delimiter: delimiter // Use dynamic delimiter
      });

      // DEBUG: See how many rows were parsed
      console.log(`[CSV Debug] Parsed ${records.length} records.`);
      
      if (records.length === 0) {
         console.warn("[CSV Warning] No records found. Check if the file is empty or headers are missing.");
         return "";
      }

      // Convert rows to sentences
      const text = records.map((row, i) => serializeRow(row, i)).join("\n");
      
      // DEBUG: Check final text size
      console.log(`[CSV Debug] Final text size: ${text.length} chars`);
      
      return text;
    }

    // Excel Handling (.xlsx, .xls)
    if (ext === ".xlsx" || ext === ".xls") {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      let fullText = "";

      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        // Convert sheet to JSON objects
        const records = XLSX.utils.sheet_to_json(sheet);
        
        fullText += `--- Sheet: ${sheetName} ---\n`;
        fullText += records.map((row, i) => serializeRow(row, i)).join("\n");
        fullText += "\n\n";
      });

      return fullText.trim();
    }

    // --- 2. EXISTING HANDLERS ---
    
    // PDF
    if (ext === ".pdf") {
      const data = await pdfParse(buffer);
      return data.text.replace(/\n\n+/g, "\n").replace(/\0/g, "").trim();
    }

    // Word
    if (ext === ".docx") {
      const result = await mammoth.extractRawText({ buffer: buffer });
      return result.value.trim();
    }

    // PowerPoint
    if (ext === ".pptx") {
      return await parseWithTempFile(buffer, filename, async (tempPath) => {
        return new Promise((resolve, reject) => {
          officeParser.parseOffice(tempPath, (data, err) => {
             if (err) return reject(err);
             const safeText = (typeof data === 'string') ? data : "";
             resolve(safeText);
          });
        });
      });
    }

    // E-Books
    if (ext === ".epub") {
      return await parseWithTempFile(buffer, filename, async (tempPath) => {
        return new Promise((resolve, reject) => {
          const epub = new EPub(tempPath);
          epub.on("end", () => {
            let fullText = "";
            epub.flow.forEach((chapter) => {
              epub.getChapter(chapter.id, (err, text) => {
                 if (text) fullText += text + " ";
              });
            });
            setTimeout(() => resolve(fullText.replace(/<[^>]*>/g, ' ')), 500);
          });
          epub.on("error", reject);
          epub.parse();
        });
      });
    }

    // Native Text & SQL
    if (TEXT_EXTENSIONS.has(ext)) {
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
    separators: ["\n\n", "\n", ". ", " ", ""],
  });
  
  const documents = await splitter.createDocuments([text]);
  return documents.map(doc => doc.pageContent);
}