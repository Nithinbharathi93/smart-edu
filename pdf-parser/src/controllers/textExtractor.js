import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text.replace(/\n\n+/g, "\n").trim();
  } catch (error) {
    throw new Error(`PDF Parsing failed: ${error.message}`);
  }
}

export async function chunkText(text) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ["\n\n", "\n", " ", ""],
  });
  const documents = await splitter.createDocuments([text]);
  return documents.map(doc => doc.pageContent);
}