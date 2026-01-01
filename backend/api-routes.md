# SmartEdu – Unified API Documentation

This document combines **authentication, syllabus generation, assessments, coding practice, and AI tutoring** into one complete reference.

---

# Module 1: Authentication & Profile Setup

## Register

**Endpoint:** `POST /register`

**Request**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response**

```json
{
  "message": "Registration successful! Please check your email for verification.",
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "user@example.com"
    }
  }
}
```

---

## Login

**Endpoint:** `POST /login`

**Request**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1Ni...",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com"
  }
}
```

**Frontend Action:**
Store JWT in `localStorage` or cookies and attach it as:

```
Authorization: Bearer <token>
```

---

## Profile Setup

**Endpoint:** `POST /profile/setup`

**Request**

```json
{
  "persona": "upskiller"
}
```

**Valid Personas**

- `student`
- `upskiller`
- `casual`
- `seasoned_dev`

---

# Module 2: Document & Syllabus Management

## Upload PDF (Ingest)

**Endpoint:** `POST /ingest`
**Content-Type:** `multipart/form-data`

**Body**

- `file`: PDF document

**Response**

```json
{ "success": true, "pdf_id": 123 }
```

_Used for AI-based syllabus generation._

---

## Generate Syllabus (From PDF)

**Endpoint:** `POST /generate-syllabus`

**Request**

```json
{
  "pdf_id": 123,
  "duration": "4 weeks",
  "level": "Beginner"
}
```

**Response**

```json
{
  "syllabus_title": "React Foundations",
  "weeks": [
    {
      "week_number": 1,
      "theme": "Introduction to Components",
      "key_concepts": ["JSX", "Props"]
    }
  ]
}
```

---

## Generate Topic-Based Syllabus

**Endpoint:** `POST /generate-topic-syllabus`

**Request**

```json
{
  "topic": "Rust Memory Safety",
  "duration": "2 weeks",
  "level": "Expert"
}
```

---

## Fetch Syllabus

**Endpoint:** `GET /get-syllabus/:id`

**Response**

```json
{
  "id": 10,
  "syllabus_data": {
    "syllabus_title": "...",
    "weeks": [
      {
        "week_number": 1,
        "theme": "...",
        "key_concepts": ["Hooks"]
      }
    ]
  },
  "level": "Beginner",
  "document_id": 42
}
```

## Fetch All Syllabus

**Endpoint:** `GET /my-courses`

**Response**

```json
[
  {
    "id": 7,
    "syllabus_title": "Comprehensive Course on Javascript DSA",
    "level": "Beginner",
    "duration": "4 weeks",
    "created_at": "2026-01-01T07:53:30.718781+00:00",
    "documents": null
  }
]
```

---

# Module 3: Adaptive Assessment System

## Fetch Questions

**Endpoint:** `GET /assessment/questions`

**Response**

```json
[
  {
    "q": "What is a Closure?",
    "options": ["A", "B", "C", "D"],
    "correct": 0
  }
]
```

---

## Submit Assessment

**Endpoint:** `POST /assessment/submit`

**Request**

```json
{
  "score": 11,
  "answers": [{ "q_index": 0, "selected": 2, "is_correct": true }]
}
```

**Response**

```json
{
  "message": "Assessment complete! You are a Proficient",
  "level": 4,
  "name": "Proficient"
}
```

---

# Module 4: Coding Practice & Compiler

## Generate Coding Problem

**Endpoint:** `POST /generate-problem`

**Request**

```json
{
  "syllabus_id": 45,
  "week_number": 2,
  "concept": "Binary Search",
  "level": "Intermediate"
}
```

**Response**

```json
{
  "id": "uuid-789",
  "title": "Search in a Sorted Array",
  "description": "Given an array of integers...",
  "difficulty": "Medium",
  "topics": ["Arrays", "Algorithms"],
  "constraints": ["O(log n)"],
  "examples": [
    {
      "input": "[1,2,3], target=2",
      "output": "1"
    }
  ]
}
```

---

## Compile & Run Code

**Endpoint:** `POST /compile`

**Request**

```json
{
  "language": "python",
  "version": "3.10.0",
  "source_code": "print(sum([1,2,3]))"
}
```

**Response**

```json
{
  "success": true,
  "output": "6",
  "stdout": "6",
  "stderr": ""
}
```

---

# Module 5: AI Tutor (Socratic Learning)

## Get Hint

**Endpoint:** `POST /problem/guide`

**Request**

```json
{
  "problem_details": {
    "title": "...",
    "description": "..."
  },
  "user_query": "How do I start?",
  "user_code": "function main() {}"
}
```

**Response**

```json
{
  "hint_title": "Think about the return",
  "conceptual_guidance": "Break the problem into steps",
  "code_feedback": "Your function structure is correct",
  "leading_question": "What happens if the array is empty?"
}
```

---

## Get Full Solution

**Endpoint:** `POST /problem/solution`

**Request**

```json
{
  "problem_details": { "...": "..." },
  "language": "python"
}
```

**Response**

```json
{
  "approach": "Binary search logic...",
  "code": "...",
  "complexity": {
    "time": "O(log N)",
    "space": "O(1)"
  }
}
```

---

# Global Constants (Frontend Safe Enums)

| Category       | Allowed Values                                                               |
| -------------- | ---------------------------------------------------------------------------- |
| **Persona**    | `student`, `upskiller`, `casual`, `seasoned_dev`                             |
| **User Level** | `Novice`, `Advanced Beginner`, `Competent`, `Proficient`, `Expert`, `Master` |
| **Difficulty** | `Easy`, `Medium`, `Hard`                                                     |
| **Duration**   | `"1 week"` → `"12 weeks"`                                                    |
| **Languages**  | `javascript`, `python`, `java`, `cpp`, `csharp`, `go`, `rust`                |





# Latest route updates


### **1. Profile & Identity Module**

These routes now handle the persona-based logic (Student, Upskiller, etc.) and the "Stage 1-6" proficiency levels.

* **`GET /profile/me`**
* **Purpose:** Retrieves the current user's profile, rank, and goals.
* **Frontend Use:** Populates the Dashboard stats and Profile page.


* **`POST /profile/setup`**
* **Purpose:** The "Upsert" route for full name, persona, bio, and goals.
* **Request Body:** ```json
{
"full_name": "Nithinbharathi",
"persona": "upskiller",
"goals": ["Master Python", "Build an AI App"],
"bio": "Self-taught dev looking to pivot into Machine Learning."
}
```


```





---

### **2. The Course & Syllabus Module**

The biggest change here is the addition of the dedicated `syllabus_title` column for faster fetching.

* **`POST /generate-topic-syllabus`**
* **Purpose:** Generates a course purely from AI knowledge (No PDF needed).
* **Input:** `{ "topic", "duration", "level" }`


* **`POST /generate-syllabus`**
* **Purpose:** Generates a course based on an uploaded PDF.
* **Input:** `{ "pdf_id", "duration", "level" }`


* **`GET /my-courses`**
* **Purpose:** Lists all active learning paths.
* **Update:** Now returns the `syllabus_title` directly and identifies if it's a PDF or Topic course.



---

### **3. Smart Problem Generation (The "LeetCode" Engine)**

This route is now **Context-Aware**. It checks if the syllabus is linked to a book or a general topic before asking the AI for a problem.

* **`POST /generate-problem`**
* **Logic:** If `document_id` is present, it pulls text chunks. If not, it generates via general knowledge.
* **Request Body:**
```json
{
  "syllabus_id": 45,
  "week_number": 2,
  "concept": "Binary Search",
  "level": "Intermediate"
}

```





---

### **4. AI Tutor & Compiler**

These routes provide real-time support while the student is coding.

* **`POST /problem/guide`**
* **Purpose:** The **Socratic Hint** system.
* **Input:** Includes the `problem_details`, the `user_query`, and the `user_code`.
* **Response:** A JSON object with a `leading_question` and `code_feedback`.


* **`POST /compile`**
* **Purpose:** Connects to **EMKC Piston** to run the code.
* **Input:** `{ "language", "version", "source_code" }`



---

### **5. Proficiency Assessment (The "Level Breaker")**

This determines if the user is a Novice (Level 1) or a Master (Level 6).

* **`GET /assessment/questions`**
* **Response:** 15 adaptive MCQs scaling from easy to hard.


* **`POST /assessment/submit`**
* **Purpose:** Calculates the final score and updates the `profiles` table automatically.



---

### **6. Cleanup & Management**

* **`DELETE /delete-pdf/:id`**: Wipes a book and its embeddings.
* **`DELETE /delete-syllabus/:id`**: Wipes a course and all its generated problems.
