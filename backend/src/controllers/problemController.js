import { InferenceClient } from "@huggingface/inference";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();
const hf = new InferenceClient(process.env.HF_ACCESS_TOKEN);

export async function generateCodingProblem(contextChunks, level, week, concept) {
  // Logic to determine if we use PDF data or general AI knowledge
  const hasContext = contextChunks && contextChunks.length > 0;
  
  const systemPrompt = `
You are a Senior Technical Interview Engineer.
Task: Create EXACTLY ONE LeetCode-style coding problem.

CRITICAL INSTRUCTIONS:
1. Level: ${level}
2. Focus: Week ${week} - ${concept}
3. Generation Mode: ${
    hasContext 
    ? "BASE the problem on the provided technical document context to ensure alignment with the specific book material." 
    : "Use your general knowledge of the topic as this is a topic-based AI course."
  }
4. OUTPUT: Provide ONLY a valid JSON object. No prose or markdown tags like \`\`\`json.

JSON STRUCTURE:
{
  "title": "Problem Title",
  "description": "Clear statement of the problem",
  "difficulty": "${level}",
  "topics": ["${concept}"],
  "constraints": ["Constraint 1", "Constraint 2"],
  "examples": [
    { 
      "input": "...", 
      "output": "...", 
      "explanation": "..." 
    }
  ]
}
`;

  const contextBlock = hasContext 
    ? `CONTEXT FROM DOCUMENT:\n${contextChunks.join("\n---\n")}` 
    : "MODE: Topic-based generation (No document context).";

  const response = await hf.chatCompletion({
    model: "meta-llama/Llama-3.1-8B-Instruct",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `${contextBlock}\n\nGenerate a coding problem for the concept: ${concept}.` }
    ],
    max_tokens: 1000,
    temperature: 0.3, // Slightly higher for more creative problems
  });
  
  let rawContent = response.choices[0].message.content.trim();
  
  // Robust JSON cleaning
  const jsonMatch = rawContent.match(/\{[\s\S]*\}/); 
  const cleanJson = jsonMatch ? jsonMatch[0] : rawContent;

  try {
    const problem = JSON.parse(cleanJson);
    return { ...problem, id: uuidv4() };
  } catch (e) {
    console.error("AI Output failed to parse:", rawContent);
    return { error: "JSON_PARSE_ERROR", raw: rawContent };
  }
}