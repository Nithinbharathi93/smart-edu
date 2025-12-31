import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const resultsFile = 'api_results.txt';

// Configuration for testing
const testData = {
  email: `nithinbharathi9325@gmail.com`,
  password: "admin123",
  pdfPath: '..assets/html5ForWebDesigners.pdf', // Ensure this file exists in your directory
};

let authToken = '';
let lastPdfId = null;
let lastSyllabusId = null;

const logToFile = (title, data) => {
  const content = `\n=== ${title} ===\n${JSON.stringify(data, null, 2)}\n${'-'.repeat(30)}\n`;
  fs.appendFileSync(resultsFile, content);
  console.log(`✅ Logged: ${title}`);
};

async function runTests() {
  // Clear previous results
  fs.writeFileSync(resultsFile, `API TEST RESULTS - ${new Date().toISOString()}\n`);

  try {

    // 2. Login (to get Token)
    const loginRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testData.email, password: testData.password })
    });
    const loginData = await loginRes.json();
    authToken = loginData.token;
    logToFile('Login', loginData);

    const authHeader = { 'Authorization': `Bearer ${authToken}` };

    // 3. Ingest PDF (Multipart)
    if (fs.existsSync(testData.pdfPath)) {
      const formData = new FormData();
      const blob = new Blob([fs.readFileSync(testData.pdfPath)]);
      formData.append('file', blob, 'sample.pdf');

      const ingestRes = await fetch(`${BASE_URL}/ingest`, {
        method: 'POST',
        headers: authHeader,
        body: formData
      });
      const ingestData = await ingestRes.json();
      lastPdfId = ingestData.pdf_id;
      logToFile('Ingest PDF', ingestData);
    }

    // 4. List PDFs
    const listRes = await fetch(`${BASE_URL}/list-pdfs`, { headers: authHeader });
    logToFile('List PDFs', await listRes.json());

    // 5. Generate Syllabus from Topic
    const topicRes = await fetch(`${BASE_URL}/generate-topic-syllabus`, {
      method: 'POST',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: "JavaScript", duration: "1 week", level: "Beginner" })
    });
    const topicData = await topicRes.json();
    lastSyllabusId = topicData.id;
    logToFile('Generate Topic Syllabus', topicData);

    // 6. Generate Syllabus from PDF (if PDF was uploaded)
    if (lastPdfId) {
      const sylRes = await fetch(`${BASE_URL}/generate-syllabus`, {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_id: lastPdfId, duration: "2 weeks", level: "Intermediate" })
      });
      logToFile('Generate PDF Syllabus', await sylRes.json());
    }

    // 7. Get Specific Syllabus
    if (lastSyllabusId) {
      const getSylRes = await fetch(`${BASE_URL}/get-syllabus/${lastSyllabusId}`, { headers: authHeader });
      logToFile('Get Syllabus By ID', await getSylRes.json());
    }

    // 8. List My Courses
    const coursesRes = await fetch(`${BASE_URL}/my-courses`);
    logToFile('My Courses', await coursesRes.json());

    // 9. Chat with PDF
    if (lastPdfId) {
      const chatRes = await fetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_id: lastPdfId, question: "What is this about?", level: "Beginner" })
      });
      logToFile('Chat Response', await chatRes.json());
    }

    // 10. Generate Coding Problem
    if (lastSyllabusId) {
      const probRes = await fetch(`${BASE_URL}/generate-problem`, {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ syllabus_id: lastSyllabusId, week_number: 1, concept: "Variables" })
      });
      logToFile('Generate Problem', await probRes.json());
    }

    console.log("\nAll tests complete. Check 'api_results.txt' for details.");

  } catch (error) {
    console.error("Test execution failed:", error);
    fs.appendFileSync(resultsFile, `\nFATAL ERROR: ${error.message}`);
  }
}

runTests();