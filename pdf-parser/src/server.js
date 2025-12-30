import Fastify from "fastify";
import multipart from "@fastify/multipart";
import cors from "@fastify/cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { extractTextFromPDF, chunkText } from "./controllers/textExtractor.js";
import { getEmbedding, getChatResponse } from "./controllers/aiController.js";
import pLimit from "p-limit"; 
import { listDocuments } from "./controllers/documentController.js";
import { generateSyllabus } from "./controllers/syllabusController.js";

dotenv.config();

// Supabase Client Initialization
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const fastify = Fastify({
  logger: true, // Structured logging for observability
});

// Register Middleware
await fastify.register(cors, { origin: "*" });
await fastify.register(multipart, {
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * Endpoint: Ingest PDF
 * 1. Uploads file
 * 2. Extracts text
 * 3. Chunks text
 * 4. Generates embeddings
 * 5. Stores in Supabase
 */
fastify.post("/ingest", async (req, reply) => {
  const data = await req.file();
  const buffer = await data.toBuffer();

  const rawText = await extractTextFromPDF(buffer);
  const chunks = await chunkText(rawText);

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({ filename: data.filename })
    .select()
    .single();

  if (docError) return reply.code(500).send({ error: docError.message });

  // 2. Initialize the limiter (5 parallel requests max)
  const limit = pLimit(5);

  // 3. Wrap your embedding calls with the limiter
  const sections = await Promise.all(
    chunks.map((chunk) => 
      limit(async () => {
        const vector = await getEmbedding(chunk);
        return {
          document_id: doc.id,
          content: chunk,
          embedding: vector,
        };
      })
    )
  );

  const { error: sectionError } = await supabase
    .from("document_sections")
    .insert(sections);

  if (sectionError) return reply.code(500).send({ error: sectionError.message });

  return { success: true, pdf_id: doc.id, chunks: chunks.length };
});
/**
 * Endpoint: Chat with PDF
 * 1. Accepts pdf_id and question
 * 2. Embeds question
 * 3. Retrieves context via RPC
 * 4. Generates LLM response
 */
fastify.post("/chat", async (req, reply) => {
  const { pdf_id, question, level } = req.body;
  const numericPdfId = Number(pdf_id);
  const userLevel = level || "Beginner";

  if (!pdf_id || !question) return reply.code(400).send({ error: "Missing data" });

  const queryVector = await getEmbedding(question);

  // 1. Primary Retrieval: Search for specific matches
  let { data: matchedSections, error: rpcError } = await supabase.rpc(
    "match_document_sections",
    {
      p_query_embedding: queryVector,
      p_match_threshold: 0.1, 
      p_match_count: 5,
      p_filter_pdf_id: numericPdfId
    }
  );

  // 2. FALLBACK: If no relevant context is found, fetch the first 3 chunks of the book
  // This allows the AI to answer "What is this book about?" or "Why read this?"
  if (!matchedSections || matchedSections.length === 0) {
    const { data: fallbackSections } = await supabase
      .from("document_sections")
      .select("id, content")
      .eq("document_id", numericPdfId)
      .limit(3)
      .order("id", { ascending: true });
    
    matchedSections = fallbackSections || [];
  }

  if (rpcError) return reply.code(500).send({ error: rpcError.message });

  const context = matchedSections.map(section => section.content);
  const answer = await getChatResponse(question, context, userLevel);

  return { answer, sources: matchedSections.map(s => s.id) };
});

fastify.post("/generate-syllabus", async (req, reply) => {
  const { pdf_id, duration, level } = req.body;

  if (!pdf_id || !duration || !level) {
    return reply.code(400).send({ error: "Missing parameters" });
  }

  // 1. Check if we already have this specific syllabus saved
  const { data: existingSyllabus } = await supabase
    .from("syllabi")
    .select("syllabus_data")
    .eq("document_id", pdf_id)
    .eq("duration", duration)
    .eq("level", level)
    .single();

  if (existingSyllabus) {
    return { ...existingSyllabus.syllabus_data, cached: true };
  }

  // 2. Fetch context if not cached
  const { data: sections } = await supabase
    .from("document_sections")
    .select(`content, documents ( filename )`)
    .eq("document_id", pdf_id)
    .limit(15);

  if (!sections || sections.length === 0) {
    return reply.code(404).send({ error: "PDF content not found" });
  }

  const filename = sections[0].documents.filename;
  const context = sections.map(s => s.content);

  // 3. Generate via AI
  const syllabusJson = await generateSyllabus(filename, context, duration, level);

  // 4. Store in Supabase for next time
  const { error: insertError } = await supabase
    .from("syllabi")
    .insert({
      document_id: pdf_id,
      syllabus_data: syllabusJson,
      duration: duration,
      level: level
    });

  if (insertError) {
    console.error("Failed to store syllabus:", insertError.message);
  }

  return { ...syllabusJson, cached: false };
});

fastify.get("/list-pdfs", async (req, reply) => {
  try {
    const docs = await listDocuments();
    return docs;
  } catch (err) {
    return reply.code(500).send({ error: err.message });
  }
});

fastify.get("/my-courses", async (req, reply) => {
  const { data, error } = await supabase
    .from("syllabi")
    .select(`
      id,
      level,
      duration,
      syllabus_data->syllabus_title as title,
      documents ( filename )
    `);

  if (error) return reply.code(500).send({ error: error.message });
  return data;
});

// Server Start
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log("Server running on port http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();