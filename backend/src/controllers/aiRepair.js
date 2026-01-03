// src/controllers/aiRepair.js
import { InferenceClient } from "@huggingface/inference";
const hf = new InferenceClient(process.env.HF_ACCESS_TOKEN);

export async function repairJson(malformedString, errorMessage) {
  const repairPrompt = `
You are a JSON Repair Assistant. 
The following string was intended to be a valid JSON object but failed to parse.
ERROR: ${errorMessage}

TASK: Fix the syntax errors (missing commas, unescaped quotes, trailing commas, etc.).
OUTPUT: Return ONLY the corrected raw JSON object.

MALFORMED STRING:
${malformedString}
`;

  try {
    const response = await hf.chatCompletion({
      model: "meta-llama/Llama-3.1-8B-Instruct", // Or a smaller/faster model
      messages: [{ role: "system", content: repairPrompt }],
      max_tokens: 1500,
      temperature: 0.1,
    });

    return response.choices[0].message.content.trim();
  } catch (e) {
    console.error("Repair AI failed:", e.message);
    return malformedString; // Fallback
  }
}