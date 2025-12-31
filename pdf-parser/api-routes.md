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