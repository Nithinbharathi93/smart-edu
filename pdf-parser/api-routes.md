## 1. Authentication Routes

### **Register**

* **Method:** `POST`
* **URL:** `{{base_url}}/register`
* **Body (JSON):**

```json
{
  "email": "user@example.com",
  "password": "yourpassword123"
}

```

### **Login**

* **Method:** `POST`
* **URL:** `{{base_url}}/login`
* **Body (JSON):**

```json
{
  "email": "user@example.com",
  "password": "yourpassword123"
}

```

---

## 2. Document Management

### **Ingest PDF (Upload)**

* **Method:** `POST`
* **URL:** `{{base_url}}/ingest`
* **Auth:** Bearer Token required
* **Body (form-data):**
* **Key:** `file` (Change type from 'Text' to 'File' in Postman)
* **Value:** `[Select your PDF file]`



### **List My PDFs**

* **Method:** `GET`
* **URL:** `{{base_url}}/list-pdfs`
* **Auth:** Bearer Token required

---

## 3. Syllabus & Learning Routes

### **Generate Syllabus from PDF**

* **Method:** `POST`
* **URL:** `{{base_url}}/generate-syllabus`
* **Auth:** Bearer Token required
* **Body (JSON):**

```json
{
  "pdf_id": 123, 
  "duration": "4 weeks",
  "level": "Intermediate"
}

```

### **Generate Syllabus from Topic (AI Knowledge)**

* **Method:** `POST`
* **URL:** `{{base_url}}/generate-topic-syllabus`
* **Auth:** Bearer Token required
* **Body (JSON):**

```json
{
  "topic": "Quantum Computing",
  "duration": "2 weeks",
  "level": "Beginner"
}

```

### **Get Specific Syllabus**

* **Method:** `GET`
* **URL:** `{{base_url}}/get-syllabus/45` (replace 45 with your syllabus ID)
* **Auth:** Bearer Token required

### **List My Courses**

* **Method:** `GET`
* **URL:** `{{base_url}}/my-courses`
* **Auth:** No explicit `authenticateUser` in your code for this route (though it likely needs it!), currently public based on the provided snippet.

---

## 4. Interaction & AI

### **Chat with PDF**

* **Method:** `POST`
* **URL:** `{{base_url}}/chat`
* **Auth:** Bearer Token required
* **Body (JSON):**

```json
{
  "pdf_id": "123",
  "question": "What are the main concepts discussed in chapter 1?",
  "level": "Beginner"
}

```

### **Generate Coding Problem**

* **Method:** `POST`
* **URL:** `{{base_url}}/generate-problem`
* **Auth:** Bearer Token required
* **Body (JSON):**

```json
{
  "syllabus_id": 45,
  "week_number": 1,
  "concept": "Loops and Conditionals"
}
```

Method: POST
URL: {{url}}/compile
Body:
JSON
{
  "language": "javascript",
  "version": "18.15.0",
  "source_code": "console.log('Hello from Smart Edu!');"
}

This is the final piece of the puzzle for your "Smart Edu" platform. By creating an AI Tutor (for guidance) and an AI Solution Architect (for full solutions), you provide students with both a safety net and a mentor.

1. Solution & Hint Controller (src/controllers/tutorController.js)
We will use two separate functions: one that provides a full, commented solution and another that acts as a "Socratic Tutor"—asking questions and giving conceptual hints without leaking code.

JavaScript

import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";

dotenv.config();
const hf = new InferenceClient(process.env.HF_ACCESS_TOKEN);

/**
 * Controller 1: Generates the full solution for a problem.
 */
export async function generateSolution(problemDetails, language = "javascript") {
  const systemPrompt = `
You are a Senior Software Engineer.
Task: Provide a clean, optimized, and well-commented solution for the coding problem.

FORMAT:
1. Briefly explain the approach.
2. Provide the code in ${language}.
3. Explain the Time and Space complexity.
`;

  const response = await hf.chatCompletion({
    model: "meta-llama/Llama-3.1-8B-Instruct",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Problem: ${problemDetails.title}\nDescription: ${problemDetails.description}\nConstraints: ${problemDetails.constraints}` }
    ],
    max_tokens: 1000,
    temperature: 0.3,
  });

  return response.choices[0].message.content;
}

/**
 * Controller 2: Provides guidance/hints without giving the answer.
 */
export async function provideGuidance(problemDetails, userQuery = "I am stuck.") {
  const systemPrompt = `
You are a helpful AI Tutor for a coding platform.
CRITICAL RULE: Do NOT give the actual code or the direct answer.
Task: Guide the student by asking leading questions and explaining concepts related to ${problemDetails.concept}.

STYLE:
1. Identify what concept they might be missing.
2. Suggest a strategy (e.g., "Think about using a Hash Map").
3. Give a hint about the constraints.
`;

  const response = await hf.chatCompletion({
    model: "meta-llama/Llama-3.1-8B-Instruct",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Student Query: ${userQuery}\nProblem Context: ${problemDetails.title} - ${problemDetails.description}` }
    ],
    max_tokens: 500,
    temperature: 0.7,
  });

  return response.choices[0].message.content;
}
2. Updated src/server.js (The Tutor Routes)
These routes take the problem details (passed from your frontend's current state) to provide context-aware help.

JavaScript

import { generateSolution, provideGuidance } from "./controllers/tutorController.js";

/**
 * Route: Get Full Solution
 */
fastify.post("/problem/solution", async (req, reply) => {
  const { problem_details, language } = req.body;
  
  const user = await authenticateUser(req, reply);
  if (!user) return;

  if (!problem_details) return reply.code(400).send({ error: "Missing problem details" });

  const solution = await generateSolution(problem_details, language || "javascript");
  return { solution };
});

/**
 * Route: Get Hint/Guidance
 */
fastify.post("/problem/guide", async (req, reply) => {
  const { problem_details, user_query } = req.body;

  const user = await authenticateUser(req, reply);
  if (!user) return;

  if (!problem_details) return reply.code(400).send({ error: "Missing problem details" });

  const hint = await provideGuidance(problem_details, user_query);
  return { hint };
});

Get Solution
URL: POST {{url}}/problem/solution
Body:
JSON
{
  "problem_details": {
    "title": "React State Counter",
    "description": "Create a counter that increments...",
    "constraints": ["Must use useState"]
  },
  "language": "javascript"
}

Get Hint
URL: POST {{url}}/problem/guide
Body:
JSON
{
  "problem_details": {
    "title": "React State Counter",
    "description": "Create a counter that increments..."
  },
  "user_query": "I don't know where to store the count value."
}