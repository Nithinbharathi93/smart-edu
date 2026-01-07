# 🎓 Zentellect: AI-Powered Learning Companion

Zentellect is a full-stack RAG (Retrieval-Augmented Generation) application designed to transform static PDF documents into interactive, personalized learning experiences. Users can upload textbooks, chat with them based on their expertise level, and generate structured, time-bound syllabi.

## 🚀 Features

* **PDF Ingestion & Vectorization**: Extracts text from PDFs, chunks it intelligently, and stores it as 384-dimensional vectors in Supabase (`pgvector`).
* **Adaptive Level-Based Chat**: Personalized tutor that adjusts its vocabulary and explanation depth based on user level (**Beginner**, **Intermediate**, **Advanced**).
* **Dynamic Syllabus Generation**: Creates a structured JSON course plan including weekly themes, learning objectives, and activities based on the book's content.
* **Smart Caching**: Syllabi are stored in Supabase to ensure instant retrieval and reduced API costs for repeat requests.
* **Concurrency Management**: Uses `p-limit` to handle large document ingestion without hitting API rate limits or network resets.

## 🛠️ Tech Stack

* **Runtime**: Node.js (v22+)
* **Framework**: Fastify (High-performance web framework)
* **Database**: Supabase + PostgreSQL (`pgvector` for vector similarity search)
* **AI Inference**: Hugging Face Inference API
* **Embeddings**: `sentence-transformers/all-MiniLM-L6-v2` (384-dim)
* **LLM**: `meta-llama/Llama-3.1-8B-Instruct`


* **Text Processing**: LangChain (`RecursiveCharacterTextSplitter`) & `pdf-parse`

---

## 📁 Project Structure

```text
src/
├── controllers/
│   ├── aiController.js        # Hugging Face logic (Embeddings & Chat)
│   ├── textExtractor.js       # PDF parsing and text chunking
│   ├── documentController.js   # Document metadata management
│   └── syllabusController.js   # AI Curriculum design logic
├── server.js                  # Fastify server and API routes
└── .env                       # Environment variables (not tracked)

```

---

## ⚙️ Setup Instructions

### 1. Database Configuration

Run the following script in your **Supabase SQL Editor** to establish the schema:

```sql
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TABLE documents (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  filename text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE document_sections (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  document_id bigint REFERENCES documents(id) ON DELETE CASCADE,
  content text NOT NULL,
  embedding extensions.vector(384)
);

CREATE TABLE syllabi (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  document_id bigint REFERENCES documents(id) ON DELETE CASCADE,
  syllabus_data jsonb NOT NULL,
  duration text,
  level text
);

```

### 2. Environment Variables

Create a `.env` file in the root directory:

```bash
PORT=3000
HF_ACCESS_TOKEN=your_huggingface_token
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

```

### 3. Installation

```bash
npm install
node src/server.js

```

---

## 📡 API Endpoints

### **Ingestion**

* **POST** `/ingest`: Upload a PDF file.
* *Body*: `multipart/form-data` with `file`.



### **Learning & Chat**

* **POST** `/chat`: Query a specific document.
* *Body*: `{"pdf_id": 5, "question": "...", "level": "Beginner"}`


* **POST** `/generate-syllabus`: Generate a JSON course plan.
* *Body*: `{"pdf_id": 5, "duration": "4 weeks", "level": "Intermediate"}`



### **Management**

* **GET** `/list-pdfs`: List all uploaded document IDs and names.
* **GET** `/my-courses`: List all generated syllabi and their metadata.

---

## 🧠 Core Logic: Adaptive Learning

The system uses a specialized system prompt to adjust the "VectorBot" personality. Depending on the `level` parameter, the AI switches between:

* **Beginner**: Analogies and jargon-free explanations.
* **Advanced**: Precise, technical, and high-density information.
