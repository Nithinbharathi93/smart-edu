src/
├── components/          # Reusable UI (Button, Card, Layout, Editor)
├── hooks/              # API logic (useAuth, useSyllabus, useCompiler)
├── pages/
│   ├── Landing.jsx - done
│   ├── Auth/
│   │   ├── Login.jsx - done
│   │   └── Register.jsx - done
│   ├── Dashboard/
│   │   ├── Overview.jsx
│   │   └── SyllabusList.jsx
│   ├── Syllabus/
│   │   ├── SyllabusDetail.jsx
│   │   └── CreateSyllabus.jsx
│   ├── Assessment/
│   │   └── LevelBreaker.jsx
│   └── Practice/
│       └── CodingLab.jsx    <-- The complex multi-pane view
└── services/           # Axios instance & API route definitions