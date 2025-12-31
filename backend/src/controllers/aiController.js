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
 * Generates the personality-driven response using chatCompletion.
 */
export async function getChatResponse(userQuery, contextChunks, level) {
  const systemPrompt = `
You are VectorBot, a specialized educational assistant.
Personality: Helpful, precise, and witty.

ADAPTIVE LEARNING (${level}):
- Adjust your explanation depth for a ${level} student.

INSTRUCTIONS:
1. GREETINGS: Respond politely to "hi", "hello", etc.
2. CONTEXT USE: Use the provided Context to answer. 
3. META QUESTIONS: If the user asks general questions like "Why should I read this?" or "What is this?", use the Context to summarize the book's value and purpose.
4. LIMITATION: If the Context is truly empty or irrelevant to a specific factual question, say "I couldn't find that specific information."
`;

  const contextBlock = contextChunks.length > 0 
    ? contextChunks.join("\n\n---\n\n") 
    : "No document context available.";

  const response = await hf.chatCompletion({
    model: "meta-llama/Llama-3.1-8B-Instruct", 
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Context:\n${contextBlock}\n\nUser Query: ${userQuery}` }
    ],
    max_tokens: 500,
    temperature: 0.7,
  });

  return response.choices[0].message.content;
}