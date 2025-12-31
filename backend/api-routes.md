# AI Learning Platform – Unified API Documentation

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

* `student`
* `upskiller`
* `casual`
* `seasoned_dev`

---

# Module 2: Document & Syllabus Management

## Upload PDF (Ingest)

**Endpoint:** `POST /ingest`
**Content-Type:** `multipart/form-data`

**Body**

* `file`: PDF document

**Response**

```json
{ "success": true, "pdf_id": 123 }
```

*Used for AI-based syllabus generation.*

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
  "answers": [
    { "q_index": 0, "selected": 2, "is_correct": true }
  ]
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

