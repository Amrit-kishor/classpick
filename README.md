# ClassPick 🎓 — Production-Ready College Random Student Selection Platform

**ClassPick** is a full-stack, responsive, production-level web platform built for college faculty to manage classroom student rosters and randomly select students during lectures, seminars, quizzes, and live classroom discussions.

ClassPick eliminates selection bias, creates engaging suspense through a high-fidelity animated polling stage, and supports both **Unbiased Random Mode** and a stateful **Fair Round Mode** (where every student is guaranteed a turn before repeats).

---

## 🌟 Key Highlights & Features

### 1. High-Quality Poll Animation Stage (Framer Motion)
- **Phase 1 (Start):** Button disables, labels change to *"Selecting Student..."*, glowing indigo backdrop halo activates.
- **Phase 2 (Shuffle):** Fast cycling through student names and roll numbers, rotating central ring indicators, smooth gradual deceleration to build suspense.
- **Phase 3 (Final Selection):** Gentle scale & fade reveal of the official student card with a checkmark badge, subtle confetti effect via Canvas Confetti, and synchronized confirmation chime.
- **Strict Terminology:** Displays exact label **"Selected Student"** — zero winner/competition jargon.
- **Integrity Guarantee:** Selection is cryptographically generated and authorized on the backend. The animation strictly visualizes the validated result.

### 2. Professional Sound Effects & Audio Experience (Web Audio API)
- **Startup Sound:** Subtle rising electronic tone when polling begins.
- **Continuous Suspense Loop:** Pleasant rhythmic electronic pulse while student names cycle, gradually intensifying as selection nears conclusion.
- **Synchronized Confirmation Chime:** Short, pleasant chime plays exactly once when the selected student is finalized.
- **Strict Audio Lifecycle:** Suspense loop stops immediately upon selection, component unmount, reset, API failure, or cancellation. No runaway timers or leaked oscillators.
- **Volume & Mute Controls:** Independent volume slider (0% to 100%) and instant mute toggle, persisted in `localStorage`.
- **Autoplay Safe & Zero Dependencies:** Synthesized entirely using native Web Audio API oscillators, biquad filters, and gain envelopes. No external sound assets required.

### 3. Dual Selection Modes & Concurrency Protection
- **Random Mode (With Replacement):** Unbiased cryptographic integer generation (`crypto.randomInt`). Each active student has an equal probability; students may be drawn again in subsequent calls.
- **Fair Round Mode (Without Replacement):** Implements an **atomic claim update** in MongoDB (`findOneAndUpdate` with `$pull` and `$push`) to guarantee **zero duplicate student selections across simultaneous requests**. Live progress bar tracks selected vs remaining students, with automatic round exhaustion and round reset.

### 4. Faculty Authentication & Security Hardening
- Secure registration and login using **bcrypt** password hashing (10 salt rounds).
- **HTTP-Only Cookies:** Session JWTs are transported exclusively via HTTP-only cookies (`sameSite: 'none'` in HTTPS production, `lax` in local dev). Tokens are never returned in response JSON bodies or stored in `localStorage`, eliminating XSS token theft.
- **CSRF Defense:** Custom header verification (`X-Requested-With: XMLHttpRequest`) protects all cookie-authenticated state-changing operations.
- **Strict Ownership Checks:** Every classroom, student, and selection round requires explicit faculty ownership verification.
- **Safe Error Responses:** Production error responses sanitize internal exceptions and suppress stack traces.
- **Rate Limiting:** IP-based rate limiting on authentication and draw endpoints with proxy trust configured for reverse proxies (Render, Cloudflare).

### 5. Classroom Management & Roster Management
- Create, view, search, edit, and delete classrooms with metadata: Name, Department, Subject, Section, and Academic Year.
- Cascade deletion: Deleting a classroom cleanly removes its student rosters, fair round trackers, and selection history logs.
- Roll number uniqueness enforced per classroom.
- **CSV Roster Import:** Parses CSV uploads (`fullName`, `rollNumber`), validates against duplicates within the classroom and the uploaded file, and returns clear summary diagnostics.
- **CSV Roster Export:** Exports classroom roster as a standardized `.csv` file.
- Active/Inactive student status toggle (inactive students are automatically excluded from draws).

### 6. Classroom Projector Full-Screen Presentation Mode
- Designed specifically for large lecture halls and classroom projectors.
- High-contrast, large-format typography readable from the back of lecture halls.
- Hide navigation with one click or press <kbd>F11</kbd> / <kbd>Esc</kbd>.

### 7. Light Mode & Dark Mode
- Theme toggle persisted in `localStorage`.
- Tailored palette: Navy and slate backgrounds for dark mode, crisp clean whites for light mode.

---

## 🛠 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, JavaScript, Tailwind CSS v3, Framer Motion, Lucide React, Canvas Confetti |
| **Audio** | HTML5 Web Audio API (zero external sound file dependencies) |
| **Backend** | Node.js (v20+), Express.js, Multer, CSV-Parser, CSV-Stringify, Helmet, Express-Rate-Limit, Cookie-Parser, BcryptJS, JSONWebToken |
| **Database** | MongoDB & Mongoose (with embedded `mongodb-memory-server` fallback strictly isolated to local development and testing) |
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
│   ├── vite.config.js          # Proxies /api to backend port 5001 for local dev
│   ├── vercel.json             # Optional SPA rewrite configuration for Vercel
│   ├── tailwind.config.js      # Custom brand indigo and navy dark theme palettes
│   └── src/
│       ├── components/         # PollAnimationStage, Sidebar, Navbar, Modal, etc.
│       ├── context/            # AuthContext, ThemeContext, SoundContext
│       ├── pages/              # Dashboard, Classrooms, StudentManagement, RandomPicker, etc.
│       ├── services/           # api.js, authService, classroomService, studentService, selectionService
│       ├── utils/              # soundEffects.js (Web Audio synthesizer)
│       └── App.jsx
└── server/                     # Backend API (Express + Mongoose + JWT)
    ├── package.json
    ├── .env.example            # Environment template with secure instructions
    ├── src/
    │   ├── config/             # db.js (Production MongoDB / dev in-memory fallback), env.js
    │   ├── controllers/        # auth, classroom, student, selection, stats controllers
    │   ├── middleware/         # authMiddleware, rateLimiter, errorMiddleware
    │   ├── models/             # Faculty, Classroom, Student, SelectionRound, SelectionHistory
    │   ├── routes/             # authRoutes, classroomRoutes, studentRoutes, selectionRoutes, statsRoutes
    │   ├── utils/              # randomPicker.js, csvHelper.js, seedData.js, runSeed.js
    │   └── server.js
    └── tests/                  # Automated unit, integration, concurrency, and security tests
        ├── api.test.js
        ├── envValidation.test.js
        ├── fairRound.test.js
        ├── fairRoundConcurrency.test.js
        ├── randomPicker.test.js
        ├── securityAndOwnership.test.js
        └── soundEngine.test.js
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18 or higher; tested on Node.js v24)
- npm (v9 or higher)

### 1. Installation
Clone or navigate to the project directory:
```bash
npm run install:all
```

### 2. Configure Environment Variables
Copy the template in `server/.env.example` to `server/.env`:
```bash
cp server/.env.example server/.env
```

Local development settings in `server/.env`:
```env
PORT=5001
NODE_ENV=development
# Leave MONGODB_URI empty for instant in-memory MongoDB, or specify a local/remote MongoDB URI:
MONGODB_URI=
ALLOW_IN_MEMORY_DB=true
SEED_DEMO_DATA=true
JWT_SECRET=dev_jwt_secret_key_minimum_32_characters_long_for_dev
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5180
COOKIE_SAME_SITE=lax
COOKIE_SECURE=false
```

### 3. Start Development Servers
Run both backend and frontend concurrently:
```bash
npm run dev
```

- **Frontend:** [http://localhost:5180](http://localhost:5180)
- **Backend API:** [http://localhost:5001](http://localhost:5001)

### 4. Seeding Development Data
To explicitly seed or re-seed sample faculty (`dr.sharma@college.edu`) and classrooms:
```bash
cd server
npm run seed:dev
```
*(Demo accounts are strictly blocked from normal startup in production).*

---

## 🧪 Running Automated Tests

Run the full backend test suite:
```bash
npm test
```
Or directly in `server/`:
```bash
cd server
npm test
```

The test suite executes 25 automated tests covering:
- Environment variable validation and fail-fast production rules.
- Production demo seeding prevention (`dr.sharma@college.edu` startup block).
- HTTP-only cookie authentication and logout cookie clearing.
- **Fair Round Concurrency**: Simultaneous `Promise.all` requests asserting 0 duplicate student selections.
- Faculty classroom and student ownership access control.
- Invalid resource ID sanitization (400 Bad Request instead of 500).
- Web Audio suspense loop and confirmation chime state machine.
- Cryptographic randomness uniform distribution and Fisher-Yates array permutation.

---

## 🚢 Production Deployment Guide

ClassPick is designed for deployment with **Vercel** (Frontend SPA) and **Render** (Backend API), connecting to **MongoDB Atlas** (Persistent Database).

### 1. Persistent Database Setup (MongoDB Atlas)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user with read/write permissions.
3. In **Network Access**, add `0.0.0.0/0` (allow access from anywhere) so Render backend instances can connect.
4. Copy your connection string (e.g. `mongodb+srv://<user>:<password>@cluster0.abcde.mongodb.net/classpick?retryWrites=true&w=majority`).

### 2. Generate Strong Production JWT Secret
Generate a cryptographically secure 256-bit secret string (minimum 32 characters):
```bash
openssl rand -hex 32
# Or using Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Deploy Backend to Render

1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your Git repository.
3. Configure service settings:
   - **Root Directory:** `server`
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Configure Backend Environment Variables in Render Dashboard:

| Variable | Recommended Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Enforces production security checks |
| `PORT` | `10000` | Port assigned by Render |
| `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster.mongodb.net/classpick` | **Required**. Real persistent MongoDB URI |
| `JWT_SECRET` | *(64-character hex generated above)* | **Required**. Must be >= 32 characters |
| `JWT_EXPIRES_IN` | `7d` | Session duration |
| `CLIENT_URL` | `https://your-classpick-app.vercel.app` | **Required**. Exact Vercel domain (NO wildcard `*`) |
| `COOKIE_SAME_SITE` | `none` | **Required** for cross-domain HTTPS cookies |
| `COOKIE_SECURE` | `true` | **Required** for HTTPS cookies |
| `ALLOW_IN_MEMORY_DB` | `false` | Block in-memory database |
| `SEED_DEMO_DATA` | `false` | Prevent demo user creation in production |

> ⚠️ **CRITICAL SECURITY NOTE:** Never prefix backend secrets (`JWT_SECRET`, `MONGODB_URI`) with `VITE_`. Any variable starting with `VITE_` is bundled into frontend JavaScript and made public.

### 4. Deploy Frontend to Vercel

1. Import your Git repository into [Vercel](https://vercel.com).
2. Configure project settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Configure Frontend Environment Variable in Vercel Dashboard:

| Variable | Example Value | Description |
|---|---|---|
| `VITE_API_URL` | `https://classpick-backend.onrender.com/api` | Full URL to your Render backend API |

*(Note: `client/src/services/api.js` automatically normalizes trailing slashes and prevents duplicate `/api/api` paths).*

---

## 🔍 Post-Deployment Verification Checklist

After deploying frontend and backend:

1. **Backend Health Check:**
   Visit `https://<render-backend-url>/api/health` in your browser. Verify the response is:
   ```json
   {
     "status": "healthy",
     "timestamp": "...",
     "service": "ClassPick Production API",
     "environment": "production"
   }
   ```
2. **Fail-Fast Safety Check:**
   Check Render service logs. Confirm no configuration error was logged and server started cleanly.
3. **Faculty Registration & Login:**
   Register a new faculty account from the Vercel frontend. Open Developer Tools > Network tab:
   - Confirm response status is `201 Created`.
   - Confirm the response body contains `faculty` object with **NO `token` property**.
   - Confirm the `Set-Cookie` response header sets `token=...; Path=/; HttpOnly; Secure; SameSite=None`.
4. **Database Persistence:**
   Create a classroom and add 3 students. Restart the Render web service. Refresh the page to verify all classrooms and students persist.
5. **Fair Round & Audio Experience:**
   Start a Fair Round draw:
   - Confirm electronic startup sound begins.
   - Confirm suspense ticking loops smoothly during the shuffle animation.
   - Confirm suspense sound immediately stops and confirmation chime plays once when the student is revealed.
   - Confirm subsequent picks draw remaining students without duplicate picks.
