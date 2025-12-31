import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";

dotenv.config();
const hf = new InferenceClient(process.env.HF_ACCESS_TOKEN);

export async function generateTopicSyllabus(topic, duration, level) {
  const systemPrompt = `
You are a Professional Academic Architect.
Task: Design a complete study syllabus for a specific topic.

CONSTRAINTS:
1. Target Level: ${level} (Adjust complexity and depth accordingly)
2. Duration: ${duration}
3. OUTPUT: Return ONLY a raw JSON object. No intro/outro text.

JSON SCHEMA:
{
  "syllabus_title": "Comprehensive Course on ${topic}",
  "target_audience": "${level}",
  "prerequisites": ["Required Skill 1", "Required Skill 2"],
  "weeks": [
    {
      "week_number": 1,
      "theme": "Introduction to ${topic}",
      "learning_objectives": ["obj1", "obj2"],
      "key_concepts": ["concept1", "concept2"],
      "activities": ["Project 1", "Self-Assessment"]
    }
  ]
}
`;

  const response = await hf.chatCompletion({
    model: "meta-llama/Llama-3.1-8B-Instruct",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Generate a ${duration} syllabus for a ${level} student to learn about: ${topic}` }
    ],
    max_tokens: 1500,
    temperature: 0.4,
  });

  const rawContent = response.choices[0].message.content.trim();
  const cleanJson = rawContent.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Topic Syllabus AI Error:", rawContent);
    return { error: "Failed to generate structured syllabus", raw: rawContent };
  }
}