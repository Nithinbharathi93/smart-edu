# 🧠 AI-Powered Adaptive Learning Platform (Backend)

This is the backend server for an intelligent learning platform that adapts to the user's skill level. It features AI-generated syllabi, real-time code analysis, compiler integration, and a "Chat with your PDF" system using Vector RAG (Retrieval-Augmented Generation).

## 🛠️ Tech Stack

* **Runtime:** Node.js & Express.js
* **Database:** Supabase (PostgreSQL + pgvector)
* **AI Models:** * **Gemini 1.5 Flash:** Syllabus generation & Assessment
    * **Hugging Face:** Embeddings (`all-MiniLM-L6-v2`) & Chat (`gemma-2-2b-it`)
* **Compiler:** Piston API (Sandboxed code execution)
* **Auth:** Supabase Auth (JWT)

---

## 🚀 Setup Instructions

### 1. Installation
```bash
git clone <your-repo-url>
cd backend
npm install

```

### 2. Environment Variables (`.env`)

Create a `.env` file in the root directory:

```env
PORT=5000
# AI Keys
HF_API_KEY="hf_..."
GEMINI_API_KEY="AIza..."

# Supabase Configuration
SUPABASE_URL="[https://your-project.supabase.co](https://your-project.supabase.co)"
# ⚠️ IMPORTANT: Use the SERVICE ROLE Key (starts with ey...), NOT the Anon Key
SUPABASE_SERVICE_KEY="ey..."

```

### 3. Database Setup (Supabase SQL)

Run the following SQL in your Supabase SQL Editor to enable Vector Search:

```sql
-- Enable Vector Extension
create extension if not exists vector;

-- Documents Table
create table documents (
  id bigserial primary key,
  filename text not null,
  user_id uuid references auth.users(id) not null,
  upload_date timestamp with time zone default timezone('utc'::text, now())
);

-- Chunks Table (Vectors)
create table document_chunks (
  id bigserial primary key,
  document_id bigint references documents(id) on delete cascade,
  content text,
  embedding vector(384)
);

-- Search Function (Security: Filters by User ID)
create or replace function match_documents (
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  filter_user_id uuid
)
returns table (
  id bigint,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    document_chunks.id,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  join documents on documents.id = document_chunks.document_id
  where 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  and documents.user_id = filter_user_id
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;

```

### 4. Run Server

```bash
node index.js
# Server runs on http://localhost:5000

```

---

## 📡 API Documentation

**Global Header:**
Except for Auth & Compiler routes, add this header to requests:
`Authorization: Bearer <YOUR_ACCESS_TOKEN>`

### 🔐 1. Authentication

**POST** `/api/auth/register`

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}

```

**POST** `/api/auth/login`

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
// Returns: { "token": "ey...", "user": {...} }

```

### 🧠 2. AI Learning Engine

**POST** `/api/ai/assess-level`
*Determines if user is Beginner, Intermediate, or Advanced.*

```json
{
  "topic": "ReactJS",
  "quizAnswers": [
    { "question": "What is State?", "userAnswer": "Internal storage" },
    { "question": "Explain useEffect", "userAnswer": "It handles side effects" }
  ]
}

```

**POST** `/api/ai/generate-syllabus`
*Creates a custom learning path.*

```json
{
  "topics": "Node.js Architecture",
  "level": "Intermediate",
  "duration": "2 weeks"
}

```

**POST** `/api/ai/generate-coding-questions`
*Generates LeetCode-style problems.*

```json
{
  "topic": "Dynamic Programming",
  "difficulty": "Hard",
  "count": 1
}

```

**POST** `/api/ai/code-comments`
*AI Mentor gives hints on broken code.*

```json
{
  "code": "function sum(a,b) { return a * b; } // Bug here"
}

```

### 📚 3. PDF & RAG (Study Material)

**POST** `/api/pdf/upload-pdf`

* **Body Type:** `form-data`
* **Key:** `pdf` (File)

**POST** `/api/pdf/chat`
*Ask questions about the uploaded document.*

```json
{
  "question": "Summarize the chapter on Redux from my file."
}

```

### ⚡ 4. Code Compiler

**POST** `/api/compiler/run`
*Executes code safely.*

```json
{
  "language": "python",
  "code": "print('Hello World')",
  "input": ""
}

```

