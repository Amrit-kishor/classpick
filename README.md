# ClassPick 🎓 — Production-Ready College Random Student Selection Platform

**ClassPick** is a full-stack, responsive, production-level web platform built for college faculty to manage classroom student rosters and randomly select students during lectures, seminars, quizzes, and live classroom discussions.

ClassPick eliminates selection bias, creates engaging suspense through a high-fidelity animated polling stage, and supports both **Unbiased Random Mode** and a stateful **Fair Round Mode** (where every student is guaranteed a turn before repeats).

---

## 🌟 Key Highlights & Features

### 1. High-Quality Poll Animation Stage (Framer Motion)
- **Phase 1 (Start):** Button disables, labels change to *"Selecting Student..."*, glowing indigo backdrop halo activates.
- **Phase 2 (Shuffle):** Fast cycling through student names and roll numbers, rotating central ring indicators, smooth gradual deceleration to build suspense.
- **Phase 3 (Final Selection):** Gentle scale & fade reveal of the official student card with a checkmark badge, subtle confetti effect via Canvas Confetti, and an optional chime audio cue.
- **Strict Terminology:** Displays exact label **"Selected Student"** — zero winner/competition jargon.
- **Integrity Guarantee:** Selection is cryptographically generated and authorized on the backend. The animation strictly visualizes the validated result.

### 2. Professional Sound Effects & Audio Experience (Web Audio API)
- **Startup Sound:** Subtle rising electronic tone when polling begins.
- **Continuous Suspense Loop:** Pleasant rhythmic electronic ticking/pulse while student names cycle, gradually intensifying as selection nears conclusion.
- **Synchronized Confirmation Chime:** Harmonious major chord chime plays exactly when the selected student is revealed.
- **Zero Audio Leakage:** Suspense loop stops immediately upon selection, component unmount, reset, or error.
- **Volume & Mute Controls:** Independent volume slider (0% to 100%) and instant mute toggle, persisted in `localStorage`.
- **Autoplay Safe & Zero Dependencies:** Synthesized entirely using native Web Audio API oscillators, biquad filters, and gain envelopes. No external MP3 downloads required.

### 3. Dual Selection Modes
- **Random Mode (With Replacement):** Unbiased cryptographic integer generation (`crypto.randomInt`). Each active student has an equal probability; students may be drawn again in subsequent calls.
- **Fair Round Mode (Without Replacement):** Implements a cryptographically shuffled Fisher-Yates draw pool. Guarantees no student is drawn twice in the same round. Live progress bar shows selected vs remaining counts, with automatic round completion notices and round reset capabilities.

### 3. Faculty Authentication & Security
- Secure registration and login using **bcrypt** password hashing (10 salt rounds).
- **JWT tokens** delivered in HTTP-only cookies and Bearer headers.
- Protected API routes with faculty ownership validation (faculty cannot see or modify other professors' classrooms or students).
- Helmet security headers, CORS origin verification, and rate limiting to prevent spam and double-click draw spam.

### 4. Classroom Management
- Create, view, search, edit, and delete classrooms with metadata: Name, Department, Subject, Section, and Academic Year.
- Cascade deletion: Deleting a classroom cleanly removes its student rosters, fair round trackers, and selection history logs.

### 5. Student Management & CSV Import/Export
- Add students individually with validation.
- Roll number uniqueness enforced per classroom.
- **CSV Roster Import:** Parses CSV uploads (`fullName`, `rollNumber`), validates against duplicates within the classroom and the uploaded file, and returns clear summary diagnostics.
- **CSV Roster Export:** Exports classroom roster as a standardized `.csv` file.
- Active/Inactive student status toggle (inactive students are automatically excluded from draws).

### 6. Classroom Projector Full-Screen Presentation Mode
- Designed specifically for large lecture halls and classroom projectors.
- High-contrast, large-format typography readable from the back of lecture halls.
- Hide unnecessary navigation with one click or press <kbd>F11</kbd> / <kbd>Esc</kbd>.

### 7. Selection History Audit Log
- Persistent historical records: Student ID, Full Name, Roll Number, Classroom, Timestamp, Selection Mode, and Round Number.
- Filtering by Classroom, Mode, and Date.
- Clear history with confirmation dialog.

### 8. Light Mode & Dark Mode
- Theme toggle persisted in `localStorage`.
- Tailored palette: Navy and slate backgrounds for dark mode, crisp clean whites for light mode.

---

## 🛠 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, JavaScript, Tailwind CSS v3, Framer Motion, Lucide React, Canvas Confetti |
| **Audio** | HTML5 Web Audio API (zero external sound file dependencies) |
| **Backend** | Node.js (v20+), Express.js, Multer, CSV-Parser, CSV-Stringify, Helmet, Express-Rate-Limit, Cookie-Parser, BcryptJS, JSONWebToken |
| **Database** | MongoDB & Mongoose (with embedded `mongodb-memory-server` fallback for instant zero-config local development and testing) |
| **Testing** | Node.js Native Test Runner (`node:test`, `node:assert`) |

---

## 📁 Repository Structure

```
classpick/
├── package.json                # Root package with concurrent dev and install scripts
├── README.md                   # Complete documentation & deployment guide
├── sample_data/
│   └── sample_students.csv     # Ready-to-test CSV roster with 20 sample students
├── client/                     # Frontend (React + Vite + Tailwind + Framer Motion)
│   ├── index.html
│   ├── vite.config.js          # Proxies /api to backend port 5001
│   ├── tailwind.config.js      # Custom brand indigo and navy dark theme palettes
│   └── src/
│       ├── components/         # PollAnimationStage, Sidebar, Navbar, Modal, ConfirmDialog, etc.
│       ├── context/            # AuthContext, ThemeContext, SoundContext
│       ├── pages/              # Dashboard, Classrooms, StudentManagement, RandomPicker, History, etc.
│       ├── services/           # api.js, authService, classroomService, studentService, selectionService
│       ├── utils/              # soundEffects.js (Web Audio synthesizer)
│       └── App.jsx
└── server/                     # Backend API (Express + Mongoose + JWT)
    ├── package.json
    ├── .env.example
    ├── src/
    │   ├── config/             # db.js (MongoDB / in-memory Mongo), env.js
    │   ├── controllers/        # auth, classroom, student, selection, stats controllers
    │   ├── middleware/         # authMiddleware, rateLimiter, errorMiddleware
    │   ├── models/             # Faculty, Classroom, Student, SelectionRound, SelectionHistory
    │   ├── routes/             # authRoutes, classroomRoutes, studentRoutes, selectionRoutes, statsRoutes
    │   ├── utils/              # randomPicker.js, csvHelper.js, seedData.js
    │   └── server.js
    └── tests/                  # Automated unit and integration tests
        ├── randomPicker.test.js
        ├── fairRound.test.js
        └── api.test.js
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18 or higher; tested on Node.js v24)
- npm (v9 or higher)

### 1. Installation
Clone or navigate to the project directory:
```bash
cd /Users/amritkishor/.gemini/antigravity-ide/scratch/classpick
npm run install:all
```

### 2. Configure Environment Variables
In `server/.env`:
```env
PORT=5001
NODE_ENV=development
# Leave MONGODB_URI empty to automatically start an in-memory MongoDB instance!
# Or provide your MongoDB Atlas / local MongoDB URI:
MONGODB_URI=
JWT_SECRET=super_secret_classpick_jwt_faculty_key_2026_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5180
```

> **Note:** If `MONGODB_URI` is left blank, ClassPick automatically boots an in-memory MongoDB instance via `mongodb-memory-server` and seeds it with demo faculty and classrooms. Zero external database configuration required!

### 3. Start Development Servers
Run both backend and frontend concurrently:
```bash
npm run dev
```

- **Frontend:** [http://localhost:5180](http://localhost:5180)
- **Backend API:** [http://localhost:5001](http://localhost:5001)

### 4. Demo Login Credentials
For instant demonstration:
- **Email:** `dr.sharma@college.edu`
- **Password:** `faculty1234`
*(Or click the **"Fill Demo Faculty Credentials"** button on the login screen, or create your own account via Register).*

---

## 🧪 Running Automated Tests

Run backend unit and integration tests:
```bash
npm test
```
Or directly in `server`:
```bash
cd server
npm test
```

Tests verify:
- Cryptographic bounds and uniform distribution of random integer generation.
- Statistical uniformity across buckets.
- Fisher-Yates array permutation integrity and immutability.
- Fair Round non-repetition invariant (each student picked exactly once per round).
- Round replenishment on reset.
- Live API health check and full Faculty registration/authentication lifecycle.

---

## 🚢 Deployment Guide

### Deploy Backend to Render

1. Create a free MongoDB database at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a new **Web Service** on [Render](https://render.com).
3. Connect your repository and configure:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Set Environment Variables on Render:
   - `PORT`: `5001` (or `10000`)
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<Your MongoDB Atlas connection URI>`
   - `JWT_SECRET`: `<A strong random secret string>`
   - `CLIENT_URL`: `https://<your-vercel-frontend-domain>.vercel.app`

### Deploy Frontend to Vercel

1. Import your repository in [Vercel](https://vercel.com).
2. Configure project settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. In `client/vite.config.js` or via environment variables, ensure API requests route to your Render backend URL:
   - For example, set `VITE_API_URL` to `https://classpick-backend.onrender.com/api`.
