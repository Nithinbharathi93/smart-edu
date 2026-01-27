import { InferenceClient } from "@huggingface/inference";
import { CONFIG } from "../config.js";

const hf = new InferenceClient(CONFIG.hfToken);

export async function getEmbedding(text) {
  try {
    const response = await hf.featureExtraction({
      model: CONFIG.ai.embeddingModel,
      inputs: text,
    });
    // Handle different HF response shapes
    if (Array.isArray(response) && Array.isArray(response[0])) return response[0];
    return response;
  } catch (err) {
    console.error("Embedding Error:", err);
    throw new Error("Failed to generate embedding");
  }
}

// Now purely handles the LLM interaction, agnostic of the "persona"
export async function getChatResponse(userQuery, contextChunks, systemInstruction = "You are a helpful assistant.") {
  const contextBlock = contextChunks.length > 0 
    ? contextChunks.join("\n\n---\n\n") 
    : "No context available.";

  const finalPrompt = `
  Context Information:
  ${contextBlock}

  User Question: 
  ${userQuery}
  `;

  const response = await hf.chatCompletion({
    model: CONFIG.ai.chatModel, 
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: finalPrompt }
    ],
    max_tokens: 500,
    temperature: CONFIG.ai.temperature,
  });

  return response.choices[0].message.content;
}