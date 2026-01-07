# Zentellect Backend API Documentation

## Authentication

All protected routes require an `Authorization` header:
`Authorization: Bearer <your_supabase_jwt_token>`

---

## 1. Authentication Routes

| Method   | Endpoint    | Description         | Request Body                            |
| -------- | ----------- | ------------------- | --------------------------------------- |
| **POST** | `/register` | Register a new user | `{ "email": "...", "password": "..." }` |
| **POST** | `/login`    | Authenticate user   | `{ "email": "...", "password": "..." }` |

---

## 2. Document & Ingestion Routes

| Method     | Endpoint          | Description                        | Request Body / Params        |
| ---------- | ----------------- | ---------------------------------- | ---------------------------- |
| **POST**   | `/ingest`         | Upload PDF and generate embeddings | `multipart/form-data` (file) |
| **GET**    | `/list-pdfs`      | List all uploaded PDFs             | None                         |
| **DELETE** | `/delete-pdf/:id` | Delete PDF and its embeddings      | `id` (Path Parameter)        |

---

## 3. Syllabus & Course Management

| Method     | Endpoint                   | Description                          | Request Body                                                           |
| ---------- | -------------------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| **POST**   | `/generate-syllabus`       | Create syllabus from a PDF           | `{ "pdf_id": 1, "duration": "4 weeks", "level": "Beginner" }`          |
| **POST**   | `/generate-topic-syllabus` | Create syllabus from a topic         | `{ "topic": "React", "duration": "2 weeks", "level": "Intermediate" }` |
| **GET**    | `/my-courses`              | Get list of user's generated courses | None                                                                   |
| **GET**    | `/get-syllabus/:id`        | Fetch specific syllabus details      | `id` (Path Parameter)                                                  |
| **DELETE** | `/syllabus/:id`            | Delete a specific syllabus           | `id` (Path Parameter)                                                  |

---

## 4. AI Learning & Chat

| Method   | Endpoint         | Description                      | Request Body                                                            |
| -------- | ---------------- | -------------------------------- | ----------------------------------------------------------------------- |
| **POST** | `/chat`          | Chat with the AI regarding a PDF | `{ "syllabus_id": 1, "question": "...", "level": "Beginner" }`          |
| **POST** | `/chat/syllabus` | Chat with the AI regarding a PDF | `{ "syllabus_id": 1, "question": "...", "level": "Beginner" }`          |
| **POST** | `/problem/guide` | Get Socratic guidance/hints      | `{ "problem_details": {...}, "user_query": "...", "user_code": "..." }` |

---

## 5. Coding Problems & Execution

| Method     | Endpoint            | Description                     | Request Body                                                                  |
| ---------- | ------------------- | ------------------------------- | ----------------------------------------------------------------------------- |
| **POST**   | `/generate-problem` | Generate a new coding problem   | `{ "syllabus_id": 1, "week_number": 1, "concept": "Loops", "level": "Hard" }` |
| **GET**    | `/problems`         | List problems (optional filter) | `?syllabus_id=X` (Query Parameter)                                            |
| **GET**    | `/problems/:id`     | Fetch detailed problem by ID    | `id` (Path Parameter)                                                         |
| **POST**   | `/problem/solution` | Generate/Fetch AI solution      | `{ "problem_id": "..." }`                                                     |
| **POST**   | `/compile`          | Execute code snippet            | `{ "language": "python", "version": "3.10", "source_code": "..." }`           |
| **POST**   | `/compile/submit`   | Run code against hidden tests   | `{ "problem_id": "...", "language": "...", "source_code": "..." }`            |
| **DELETE** | `/problems/:id`     | Delete a coding problem         | `id` (Path Parameter)                                                         |

---

## 6. User Profile & Assessment

| Method   | Endpoint                | Description                     | Request Body                                                                     |
| -------- | ----------------------- | ------------------------------- | -------------------------------------------------------------------------------- |
| **GET**  | `/assessment/questions` | Fetch adaptive test questions   | None                                                                             |
| **POST** | `/assessment/submit`    | Submit answers and update level | `{ "answers": [...] }`                                                           |
| **GET**  | `/profile/me`           | Fetch current user profile      | None                                                                             |
| **POST** | `/profile/setup`        | Update/Setup user profile       | `{ "full_name": "...", "interests": [...] }`                                     |
| **GET**  | `/profile/settings`     | Fetch user-specific settings    | None                                                                             |
| **POST** | `/profile/settings`     | Update editor/AI settings       | `{ "default_language": "...", "socratic_level": "...", "editor_config": {...} }` |

---

## Error Responses

The API generally returns standard HTTP status codes:

- `200/201`: Success
- `400`: Bad Request (Missing parameters)
- `401`: Unauthorized (Invalid or missing token)
- `403`: Forbidden (Persona restrictions)
- `404`: Not Found
- `500`: Internal Server Error
