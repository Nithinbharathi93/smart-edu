import Fastify from "fastify";
import multipart from "@fastify/multipart";
import cors from "@fastify/cors";
import pLimit from "p-limit";
import { pool } from "./db.js"; // Import the local pool
import { extractTextFromPDF, chunkText } from "./controllers/fileProcessor.js";
import { getEmbedding, getChatResponse } from "./controllers/aiController.js";

const fastify = Fastify({ logger: true });

await fastify.register(cors, { origin: "*" });
await fastify.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

// 1. Generic Ingest
fastify.post("/ingest", async (req, reply) => {
  const data = await req.file();
  const buffer = await data.toBuffer();
  if (data.mimetype !== "application/pdf") {
    return reply.code(400).send({ error: "Only PDFs are supported." });
  }
  const rawText = await extractTextFromPDF(buffer);
  console.log(`Extracted ${rawText.length} characters.`);
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
  const { doc_id, question, custom_prompt } = req.body;
  if (!question) return reply.code(400).send({ error: "Question is required" });
  const queryVector = await getEmbedding(question);
  // Format vector for Postgres: "[...]"
  const vectorStr = JSON.stringify(queryVector);
  const client = await pool.connect();
  try {

    let sql = `
  SELECT id, content, 1 - (embedding <=> $1) as similarity
  FROM document_sections
  WHERE 1 - (embedding <=> $1) > 0.1 -- Lowered to 0.1 to catch loose matches
`;
    const params = [vectorStr];
    if (doc_id) {
      sql += ` AND document_id = $2`;
      params.push(doc_id);
    }
    sql += ` ORDER BY embedding <=> $1 LIMIT 5`;
    const { rows: matchedSections } = await client.query(sql, params);
    // FALLBACK LOGIC
    let finalContext = matchedSections;
    if (matchedSections.length === 0 && doc_id) {
      console.log(
        "⚠️ No semantic matches found. Switching to 'Introduction Fallback'.",
      );

      const fallbackRes = await client.query(
        `SELECT content FROM document_sections WHERE document_id = $1 ORDER BY id ASC LIMIT 3`,
        [doc_id],
      );
      finalContext = fallbackRes.rows;
    }

    if (finalContext.length === 0) {
      return {
        answer: "I couldn't find any relevant information.",
        sources: [],
      };
    }

    const context = matchedSections.map((section) => section.content);
    const systemPrompt = custom_prompt || "You are a helpful assistant.";

    const answer = await getChatResponse(question, context, systemPrompt);

    return { answer, sources: matchedSections.map((s) => s.id) };
  } catch (e) {
    return reply.code(500).send({ error: e.message });
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
