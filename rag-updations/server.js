import Fastify from "fastify";
import multipart from "@fastify/multipart";
import cors from "@fastify/cors";
import pLimit from "p-limit";
import { pool } from "./db.js"; // Import the local pool
import { extractText, chunkText } from "./controllers/fileProcessor.js";
import { getEmbedding, getChatResponse } from "./controllers/aiController.js";

import fs from "fs/promises";
import path from "path";

const fastify = Fastify({ logger: true });

await fastify.register(cors, { origin: "*" });
await fastify.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

// 1. Generic Ingest
fastify.post("/ingest", async (req, reply) => {
  const data = await req.file();
  const buffer = await data.toBuffer();
  
  // PASS THE FILENAME so the extractor knows what to do
  const rawText = await extractText(buffer, data.filename); 
  const chunks = await chunkText(rawText);

  const client = await pool.connect();
  try {
    await client.query("BEGIN"); // Start Transaction
    // 1. Insert Document Metadata
    const docRes = await client.query(
      `INSERT INTO documents (filename) VALUES ($1) RETURNING id`,
      [data.filename],
    );
    const docId = docRes.rows[0].id;
    // 2. Generate Embeddings (Limit concurrency)
    const limit = pLimit(5);
    const vectorData = await Promise.all(
      chunks.map((chunk) =>
        limit(async () => {
          const vector = await getEmbedding(chunk);
          const vectorString = `[${vector.join(",")}]`;

          return {
            content: chunk,
            vector: vectorString, 
          };
        }),
      ),
    );
    // 3. Insert Chunks (Looping for simplicity, bulk insert is better for prod)
    for (const item of vectorData) {
      await client.query(
        `INSERT INTO document_sections (document_id, content, embedding) VALUES ($1, $2, $3)`,
        [docId, item.content, item.vector], // item.vector is now the correct string
      );
    }
    await client.query("COMMIT"); // Save changes
    return { success: true, doc_id: docId, chunks_processed: chunks.length };
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("❌ INGEST ERROR:", e);
    return reply.code(500).send({ error: e.message });
  } finally {
    client.release(); // Release connection back to pool
  }
});
// 2. Generic Chat
fastify.post("/chat", async (req, reply) => {
  const { question, doc_id, folder_name, custom_prompt } = req.body;

  if (!question) return reply.code(400).send({ error: "Question is required" });

  const queryVector = await getEmbedding(question);
  const vectorStr = JSON.stringify(queryVector); // Format for pgvector

  const client = await pool.connect();
  try {
    // DYNAMIC SQL CONSTRUCTION
    let sql = `
      SELECT 
        ds.id, 
        ds.content, 
        d.filename,
        1 - (ds.embedding <=> $1) as similarity
      FROM document_sections ds
      JOIN documents d ON ds.document_id = d.id
      WHERE 1 - (ds.embedding <=> $1) > 0.1
    `;
    
    const params = [vectorStr];
    let paramCounter = 2; // Start at $2

    // OPTION A: Search specific file
    if (doc_id) {
      sql += ` AND ds.document_id = $${paramCounter}`;
      params.push(doc_id);
      paramCounter++;
    }
    
    // OPTION B: Search specific FOLDER (Scenario C)
    if (folder_name) {
      sql += ` AND d.folder_name = $${paramCounter}`;
      params.push(folder_name);
      paramCounter++;
    }

    sql += ` ORDER BY ds.embedding <=> $1 LIMIT 5`;

    const { rows: matchedSections } = await client.query(sql, params);

    // ... (Fallback logic and LLM call remains the same) ...
    
    if (matchedSections.length === 0) {
       return { answer: "I couldn't find any relevant information.", sources: [] };
    }

    const context = matchedSections.map(s => s.content);
    const systemPrompt = custom_prompt || "You are a helpful assistant.";
    const answer = await getChatResponse(question, context, systemPrompt);

    return { 
      answer, 
      sources: matchedSections.map(s => ({ id: s.id, file: s.filename })) 
    };

  } finally {
    client.release();
  }
});

fastify.post("/ingest-folder", async (req, reply) => {
  const { folderPath } = req.body;
  if (!folderPath) return reply.code(400).send({ error: "folderPath is required" });

  let files;
  try {
    files = await fs.readdir(folderPath);
  } catch (err) {
    return reply.code(500).send({ error: `Read error: ${err.message}` });
  }

  // ALLOWED FORMATS FILTER
  const ALLOWED_EXTS = new Set([
    ".pdf", ".docx", ".pptx", ".txt", ".md", ".json", ".js", ".py", ".java", ".html", ".css", ".sql", ".epub", ".csv", ".xlsx", ".xls", ".png", ".jpg", ".jpeg"
  ]);

  const targetFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ALLOWED_EXTS.has(ext);
  });

  if (targetFiles.length === 0) return { message: "No supported files found." };

  console.log(`📂 Found ${targetFiles.length} files. Processing...`);

  const results = [];
  const client = await pool.connect();

  try {
    for (const fileName of pdfFiles) {
      // Check if file already exists to avoid duplicates (Optional safety)
      const checkRes = await client.query("SELECT id FROM documents WHERE filename = $1", [fileName]);
      if (checkRes.rows.length > 0) {
        results.push({ file: fileName, status: "Skipped (Already Exists)", id: checkRes.rows[0].id });
        continue;
      }

      console.log(`Processing: ${fileName}...`);
      const fullPath = path.join(folderPath, fileName);
      
      try {
        const fileBuffer = await fs.readFile(fullPath);
        const rawText = await extractText(fileBuffer, fileName);
        const chunks = await chunkText(rawText);

        await client.query('BEGIN');

        // 1. Insert Metadata & GET THE ID
        const docRes = await client.query(
          `INSERT INTO documents (filename, folder_name) VALUES ($1, $2) RETURNING id`,
          [fileName, collectionName]
        );
        const docId = docRes.rows[0].id; 

        // 2. Generate Embeddings
        const limit = pLimit(5);
        const vectorData = await Promise.all(
          chunks.map((chunk) => 
            limit(async () => {
              const vector = await getEmbedding(chunk);
              return { content: chunk, vector: `[${vector.join(',')}]` };
            })
          )
        );

        // 3. Insert Chunks
        for (const item of vectorData) {
          await client.query(
            `INSERT INTO document_sections (document_id, content, embedding) VALUES ($1, $2, $3)`,
            [docId, item.content, item.vector]
          );
        }

        await client.query('COMMIT');
        
        // --- UPDATED RESPONSE OBJECT ---
        results.push({ 
            file: fileName, 
            status: "Success", 
            id: docId, // <--- NOW YOU HAVE IT
            chunks: chunks.length 
        });

      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Error on ${fileName}:`, err.message);
        results.push({ file: fileName, status: "Failed", error: err.message });
      }
    }
  } finally {
    client.release();
  }

  return { message: "Batch ingestion complete", summary: results };
});

fastify.get("/documents", async (req, reply) => {
  const client = await pool.connect();
  try {
    // Shows ID, Filename, and which Folder it belongs to
    const res = await client.query("SELECT id, filename, folder_name, created_at FROM documents ORDER BY created_at DESC");
    return res.rows;
  } finally {
    client.release();
  }
});

// Start Server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    console.log("Local RAG Server running at http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
