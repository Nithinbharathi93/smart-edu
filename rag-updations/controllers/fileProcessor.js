import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import officeParser from "officeparser";
import EPub from "epub2";
import path from "path";
import fs from "fs/promises";
import os from "os";
import * as XLSX from "xlsx"; 
import { parse } from "csv-parse/sync"; 
import Tesseract from "tesseract.js"; // <--- OCR ENGINE
import AdmZip from "adm-zip";         // <--- ZIP OPENER (For PPTX Images)
import { CONFIG } from "../config.js";

const TEXT_EXTENSIONS = new Set([
  ".txt", ".md", ".markdown", ".json", ".xml", 
  ".html", ".css", ".js", ".jsx", ".ts", ".tsx", 
  ".py", ".java", ".c", ".cpp", ".sql", ".env"
]);

// --- HELPER 1: TEMP FILES ---
async function parseWithTempFile(buffer, filename, parserFunction) {
  const tempPath = path.join(os.tmpdir(), `rag_temp_${Date.now()}_${filename}`);
  try {
    await fs.writeFile(tempPath, buffer);
    return await parserFunction(tempPath);
  } finally {
    try { await fs.unlink(tempPath); } catch (e) { /* ignore cleanup errors */ }
  }
}

// --- HELPER 2: SPREADSHEET SERIALIZER ---
function serializeRow(row, rowIndex) {
  const parts = Object.entries(row).map(([header, value]) => {
    if (value === null || value === undefined || value === "") return null;
    return `${header}: ${value}`;
  });
  
  if (parts.length === 0) return "";
  return `Row ${rowIndex + 1} - ${parts.filter(p => p).join(", ")}.`;
}

// --- HELPER 3: OCR FUNCTION (Reads text from image buffer) ---
async function performOCR(imageBuffer) {
  try {
    const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng', {
      // logger: m => console.log(m) // Uncomment to see progress bars
    });
    return text.trim();
  } catch (err) {
    console.warn("OCR Failed on image:", err.message);
    return "";
  }
}

// --- HELPER 4: EXTRACT IMAGES FROM OFFICE FILES (PPTX) ---
async function extractAndOCRImagesFromOffice(buffer) {
  try {
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    const imageTexts = [];

    // Find images inside the "media" folder of the Office file
    const imageEntries = zipEntries.filter(entry => 
      entry.entryName.match(/media\/.*\.(png|jpg|jpeg)$/i)
    );

    if (imageEntries.length > 0) {
      console.log(`[OCR] Found ${imageEntries.length} images inside presentation. Scanning...`);
    }

    for (const entry of imageEntries) {
      const imgBuffer = entry.getData();
      const text = await performOCR(imgBuffer);
      if (text.length > 5) { // Filter out tiny noise
        imageTexts.push(`[Image Slide Text]: ${text}`);
      }
    }

    return imageTexts.join("\n\n");
  } catch (err) {
    console.warn(`[OCR Warning] Could not scan images inside file: ${err.message}`);
    return "";
  }
}

// --- MAIN EXTRACTOR ---
export async function extractText(buffer, filename) {
  const ext = path.extname(filename).toLowerCase();

  try {
    // 1. DIRECT IMAGES (.png, .jpg) - NEW
    if (ext === ".png" || ext === ".jpg" || ext === ".jpeg") {
      console.log(`[OCR] Scanning single image: ${filename}...`);
      return await performOCR(buffer);
    }

    // 2. PPTX (Text + Image OCR) - UPDATED
    if (ext === ".pptx") {
      // A. Get standard text (using temp file method)
      let fullText = await parseWithTempFile(buffer, filename, async (tempPath) => {
        return new Promise((resolve) => {
          officeParser.parseOffice(tempPath, (data, err) => {
             // Resolve even if err to allow partial success
             const safeText = (typeof data === 'string') ? data : "";
             resolve(safeText);
          });
        });
      });

      // B. Get hidden image text (The Fix for 0 chunks)
      const imageText = await extractAndOCRImagesFromOffice(buffer);
      if (imageText) {
        fullText += "\n\n--- Extracted Text from Images ---\n" + imageText;
      }

      return fullText;
    }

    // 3. CSV (Your Debug-Enhanced Version)
    if (ext === ".csv") {
      const content = buffer.toString("utf-8");
      
      console.log(`[CSV Debug] Raw content length: ${content.length}`);
      
      let delimiter = ",";
      if (content.indexOf(";") > -1 && content.indexOf(";") > content.indexOf(",")) {
        delimiter = ";";
        console.log("[CSV Debug] Detected semicolon delimiter");
      }
      
      const records = parse(content, { 
        columns: true, skip_empty_lines: true, trim: true, delimiter: delimiter 
      });

      console.log(`[CSV Debug] Parsed ${records.length} records.`);
      
      if (records.length === 0) {
         console.warn("[CSV Warning] No records found.");
         return "";
      }

      const text = records.map((row, i) => serializeRow(row, i)).join("\n");
      console.log(`[CSV Debug] Final text size: ${text.length} chars`);
      return text;
    }

    // 4. EXCEL
    if (ext === ".xlsx" || ext === ".xls") {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      let fullText = "";
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const records = XLSX.utils.sheet_to_json(sheet);
        fullText += `--- Sheet: ${sheetName} ---\n` + records.map((row, i) => serializeRow(row, i)).join("\n") + "\n\n";
      });
      return fullText.trim();
    }

    // 5. PDF
    if (ext === ".pdf") {
      const data = await pdfParse(buffer);
      return data.text.replace(/\n\n+/g, "\n").replace(/\0/g, "").trim();
    }

    // 6. WORD
    if (ext === ".docx") {
      const result = await mammoth.extractRawText({ buffer: buffer });
      return result.value.trim();
    }

    // 7. E-BOOKS
    if (ext === ".epub") {
      return await parseWithTempFile(buffer, filename, async (tempPath) => {
        return new Promise((resolve, reject) => {
          const epub = new EPub(tempPath);
          epub.on("end", () => {
            let fullText = "";
            epub.flow.forEach((chapter) => {
              epub.getChapter(chapter.id, (err, text) => { if (text) fullText += text + " "; });
            });
            setTimeout(() => resolve(fullText.replace(/<[^>]*>/g, ' ')), 500);
          });
          epub.on("error", reject);
          epub.parse();
        });
      });
    }

    // 8. NATIVE TEXT
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