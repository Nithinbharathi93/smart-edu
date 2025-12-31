import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";

dotenv.config();
const hf = new InferenceClient(process.env.HF_ACCESS_TOKEN);

export async function generateSyllabus(filename, contextChunks, duration, level) {
  const systemPrompt = `
You are an expert Academic Curriculum Designer. 
Your task is to create a structured study syllabus based on the provided document context.

CONSTRAINTS:
1. Target Level: ${level}
2. Duration: ${duration}
3. OUTPUT: Return ONLY a raw JSON object. No markdown backticks, no text before or after.

SCHEMA:
{
  "syllabus_title": "Clear course name based on ${filename}",
  "target_audience": "${level}",
  "prerequisites": ["Knowledge 1", "Knowledge 2"],
  "weeks": [
    {
      "week_number": 1,
      "theme": "Theme Title",
      "learning_objectives": ["obj1", "obj2"],
      "key_concepts": ["concept1", "concept2"],
      "activities": ["Task 1", "Quiz 1"]
    }
  ]
}
`;

  const contextBlock = contextChunks.join("\n\n---\n\n");

  const response = await hf.chatCompletion({
    model: "meta-llama/Llama-3.1-8B-Instruct",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Context:\n${contextBlock}\n\nGenerate a ${duration} syllabus for a ${level} level.` }
    ],
    max_tokens: 1500,
    temperature: 0.3,
  });

  const rawContent = response.choices[0].message.content.trim();
  const jsonString = rawContent.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("AI Output Parsing Error:", rawContent);
    return { error: "Failed to parse AI response into JSON", raw: rawContent };
  }
}