medical-case-tracker/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── case.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── whisper_service.py
│   │   │   └── ollama_service.py
│   │   └── database.py
│   ├── requirements.txt
│   ├── setup.py
│   └── audio_files/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AudioRecorder.tsx
│   │   │   ├── CaseList.tsx
│   │   │   ├── CaseDetail.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Cases.tsx
│   │   │   └── Analytics.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── case.ts
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   └── tailwind.config.js
├── data/
│   └── cases.db (SQLite database)
├── setup.sh
├── run.sh
└── README.md