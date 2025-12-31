import { InferenceClient } from "@huggingface/inference";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();
const hf = new InferenceClient(process.env.HF_ACCESS_TOKEN);

export async function generateCodingProblem(contextChunks, level, week, concept) {
  const isBookBased = contextChunks && contextChunks.length > 0;
  
  const systemPrompt = `
You are a Technical Interview Engineer.
Task: Create EXACTLY ONE LeetCode-style coding problem.

CRITICAL INSTRUCTIONS:
1. Level: ${level}
2. Focus: Week ${week} - ${concept}
3. Type: ${isBookBased ? "Base this on the provided technical document context." : "Use your general knowledge of the topic."}
4. OUTPUT: Provide ONLY a valid JSON object. No prose or markdown.

JSON STRUCTURE:
{
  "id": "generated_uuid",
  "title": "Problem Title",
  "description": "Full statement",
  "difficulty": "${level}",
  "topics": ["topic1"],
  "constraints": ["Constraint 1"],
  "examples": [{ "input": "...", "output": "...", "explanation": "..." }]
}
`;

  const contextBlock = isBookBased ? contextChunks.join("\n\n---\n\n") : "No specific document context. Use general expertise.";

  const response = await hf.chatCompletion({
    model: "meta-llama/Llama-3.1-8B-Instruct",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Generate a problem for ${concept} at a ${level} level.` }
    ],
    max_tokens: 1000,
    temperature: 0.2,
  });
  
  let rawContent = response.choices[0].message.content.trim();
  
  // Robust JSON cleaning
  const jsonMatch = rawContent.match(/\{[\s\S]*\}/); // Regex to find the first JSON object
  const cleanJson = jsonMatch ? jsonMatch[0] : rawContent;

  try {
    const problem = JSON.parse(cleanJson);
    return { ...problem, id: uuidv4() };
  } catch (e) {
    console.error("AI Output failed to parse. Content:", rawContent);
    return { error: "JSON_PARSE_ERROR", raw: rawContent };
  }
}