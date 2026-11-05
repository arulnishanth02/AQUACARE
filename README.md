# AquaCare – Hybrid AI Provider Integration (Gemini + Ollama)

**AquaCare** is an Intelligent Generative AI Agent for fish pond problem detection and solution recommendation, featuring a resilient **Hybrid AI Provider Architecture** supporting both **Google Gemini API (Cloud AI)** and **Ollama (Local AI)** with zero-configuration automatic fallback.

---

## 🌟 Key Features

### 1. Hybrid AI Provider System
- **Mode A: Automatic Mode (Recommended)**:
  - Intelligently detects availability of Google Gemini and local Ollama.
  - Prefers Gemini for complex reasoning and speed.
  - Automatically and seamlessly falls back to Ollama if Gemini encounters rate limits, quota exhaustion, network issues, or service spikes (503).
  - Explicitly notifies the user with a fallback banner when a transition occurs.
- **Mode B: Google Gemini Mode**:
  - Exclusively uses Google Gemini Cloud AI (`gemini-3.1-flash-lite`, `gemini-3.5-flash`, `gemini-3.1-pro-preview`).
  - Keeps credentials securely in server `.env` (never exposed to React frontend).
- **Mode C: Ollama Local Mode**:
  - Exclusively uses locally hosted Ollama (`qwen2.5:7b`, `llama3.2`, etc.).
  - 100% offline-capable, zero data leaves the farm.
- **Real-Time Switching**: Switch provider modes on the fly without restarting either backend or frontend.
- **Unified Context Preservation**: Conversation history persists seamlessly when switching providers mid-session.

### 2. Deterministic Water Quality Lab & Pathology Engine
- **Safety-Critical Determinism**: Critical water quality calculations ($pH$, Dissolved Oxygen $DO$, Total Ammonia Nitrogen $TAN$, Nitrite $NO_2^-$, Temperature) are calculated using certified aquaculture biology rules.
- **Species Profiles**: Pre-calibrated safe and lethal thresholds for Nile Tilapia, African Catfish, Major Carp, and Freshwater Shrimp.
- **Pathology Detector**: Matches physical and behavioral symptoms against verified fish diseases (White Spot/Ich, Columnaris, Dropsy, Ammonia Poisoning, Hypoxia, Brown Blood Disease).
- **Emergency Mortality Advisory**: Automatically flags emergencies if mortality exceeds 5%.

### 3. Grounded Aquaculture RAG Engine
- Shared knowledge base of scientific aquaculture treatment protocols and standard operating procedures (SOPs).
- Verified interventions: safe coarse salt baths, emergency aeration protocols, agricultural limestone ($CaCO_3$) dosing, water exchange procedures.
- Grounded citations returned with every AI response.

---

## 🚀 Quick Start Guide

### Prerequisites
1. **Node.js**: v18+ (tested on Node.js v24)
2. **Ollama**: Installed and running locally
3. **Google Gemini API Key**: Configured in backend `.env`

---

### Step 1: Clone & Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

---

### Step 2: Environment Configuration

Create or verify `server/.env`:

```env
PORT=5000
MONGODB_URI=
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.1-flash-lite
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:7b
DEFAULT_AI_PROVIDER=auto
AI_REQUEST_TIMEOUT=60000
```

---

### Step 3: Run Ollama Local AI

In a terminal:
```bash
# 1. Start Ollama server
ollama serve

# 2. Download the recommended model (Qwen 2.5 7B)
ollama pull qwen2.5:7b
```

---

### Step 4: Start the Application

You can start the backend and frontend simultaneously:

```bash
# Terminal 1: Start Backend Server (runs on http://localhost:5000)
cd server
npm start

# Terminal 2: Start Frontend Development Server (runs on http://localhost:3000)
cd client
npm run dev
```

Alternatively, the Express backend serves the built production client directly at **http://localhost:5000/**.

---

## 🧪 Testing the 3 Provider Modes

### 1. Test Automatic Mode
1. Open **http://localhost:5000** or **http://localhost:3000**.
2. Go to **AI Settings** &rarr; Verify **Automatic Mode** is active.
3. In the chat, send:
   > *"My tilapia are gasping at the surface early morning. DO is 2.2 mg/L and pH is 6.8. What should I do?"*
4. Notice Gemini responds in ~2-4s. If Gemini is unavailable or rate-limited, Ollama takes over automatically and displays the Fallback Active badge.

### 2. Test Google Gemini Mode
1. Go to **AI Settings** &rarr; Select **Google Gemini**.
2. Click **Test Gemini Connection** &rarr; Observe connection latency and status.
3. Send a message in chat &rarr; Response is generated purely by Gemini.

### 3. Test Ollama Local Mode
1. Go to **AI Settings** &rarr; Select **Ollama Local**.
2. Click **Test Ollama Connection** &rarr; Confirms connection to `http://127.0.0.1:11434`.
3. Send a message in chat &rarr; Response is generated locally by `qwen2.5:7b`.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/ai/providers` | Lists provider statuses and active settings |
| `GET` | `/api/ai/status` | Returns real-time health and active provider |
| `GET` | `/api/ai/models` | Retrieves available Gemini & Ollama models |
| `POST` | `/api/ai/provider` | Updates mode (`auto`/`gemini`/`ollama`) and models |
| `POST` | `/api/ai/test-connection`| Tests connection to a specific provider |
| `POST` | `/api/chat` | Main conversational diagnosis endpoint |
| `POST` | `/api/pond/analyze` | Direct deterministic water quality analysis |
| `GET` | `/api/knowledge` | Grounded aquaculture knowledge search |

