import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";

dotenv.config();

// Use the modern InferenceClient (Standard for the latest HF SDK)
const hf = new InferenceClient(process.env.HF_ACCESS_TOKEN);

/**
 * Generates 384-dimensional embedding for text.
 * Model: sentence-transformers/all-MiniLM-L6-v2
 */
export async function getEmbedding(text) {
  const response = await hf.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: text,
  });

  /**
   * FIX: The API sometimes returns a nested array [[vector]] for single inputs.
   * This ensures we always return a flat 384-dimensional array.
   */
  if (Array.isArray(response) && Array.isArray(response[0])) {
    return response[0];
  }
  return response;
}

/**
 * Generates the response with a strict anti-hallucination guardrail.
 * @param {boolean} isSyllabusMode - If true, applies stricter grounding rules.
 */
export async function getChatResponse(userQuery, contextChunks, level, isSyllabusMode = false) {
  const systemPrompt = `
You are VectorBot, an elite AI Tutor.
Personality: Professional, encouraging, and strictly accurate.

ADAPTIVE DEPTH: Explain at a ${level} level.

STRICT GROUNDING RULES:
1. Use the provided "Course Context" (Syllabus & Problems) to answer.
2. ${isSyllabusMode ? "CRITICAL: This is an AI-generated course. Stick ONLY to the concepts defined in the syllabus and problems provided. Do not introduce advanced external libraries or complex theories not mentioned in the context." : "Use the document context provided."}
3. ADMIT IGNORANCE: If the query is about something totally outside the provided course topics, say: "That topic isn't covered in our current syllabus, but I can help you with what we've planned!"
4. NO HALLUCINATION: Do not invent details about the course that aren't in the context.
`;

  const contextBlock = contextChunks.length > 0 
    ? contextChunks.join("\n\n---\n\n") 
    : "No document context available.";

  const response = await hf.chatCompletion({
    model: "meta-llama/Llama-3.1-8B-Instruct", 
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Course Context:\n${contextBlock}\n\nUser Question: ${userQuery}` }
    ],
    max_tokens: 800,
    temperature: 0.2, // Lower temperature to reduce "creativity" and hallucinations
  });

  return response.choices[0].message.content;
}