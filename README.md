# 🛡️ LLM Secure Integration Hub (Prompt Injection Resistant Gateway)

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![WebSockets](https://img.shields.io/badge/WebSockets-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

LLM Secure Integration Hub is a production-grade secure gateway middleware engineered to connect applications to large language models while protecting them from prompt injections, system leakage, and unsafe tool escapes. It incorporates sandboxed runtime environments, real-time firewalls, and deep policy monitoring.

---

## ⚡ Key Core Features

*   **🔍 Input Shield Normalizer & Scanner:** Translates homoglyphs, decodes obfuscated unicode/Base64 payloads, strips markdown trickery, and runs rule-based regex classifiers to index threat risks on a scale of `0-100`.
*   **🛡️ Context Isolation Engine:** Strict payload compilers that isolate system prompts and encapsulate user content in defensive XML wrappers to prevent role confusion.
*   **🚦 Interactive Sandbox & Approvals:** Classifies dynamic tools into `SAFE`, `RESTRICTED`, and `HIGH RISK` categories. Automatically halts execution on restricted/unsafe calls to request human-in-the-loop clearances.
*   **🔄 Agent Runtime Loop Breaker:** Traces execution timeouts, counts recursive tool calls to intercept infinite stack overflow loops, and monitors token/cash budgets.
*   **🧪 RAG Poisoning Sanitizer:** Scans ingested vectors, validates metadata chunks, and downgrades the trust ratings of untrusted user uploads.
*   **🚪 Post-LLM Output Guard:** Cleans assistant response text, redacting API keys, passwords, credentials, and blocking outputs mirroring core system templates.

---

## 📐 Gateway System Architecture

```mermaid
graph TD
    Client[Web Dashboard / API Client] -->|1. User Prompt / Chat| Gateway[FastAPI Secure Gateway]
    Gateway -->|2. Normalize & Scan| FirewallPre[Pre-LLM Prompt Firewall]
    FirewallPre -->|Blocked / Rejected| Audit[Audit Log & Threat Metrics]
    FirewallPre -->|Allowed / Rewritten| AgentRuntime[Agent Runtime Security & Context Isolation]
    AgentRuntime -->|Retrieve Docs| RAGSec[RAG Security Engine]
    AgentRuntime -->|3. Evaluate System Prompt & Context| LLMAdapter[Provider Adapter: OpenAI/Anthropic/Local]
    LLMAdapter -->|4. Tool Call Request| ToolSandbox[Tool Sandbox & Policy Engine]
    ToolSandbox -->|Requires Approval| Client
    ToolSandbox -->|Approved & Permitted| ExecuteTool[Tool Sandbox Execute]
    ExecuteTool -->|Tool Output| AgentRuntime
    AgentRuntime -->|5. Raw LLM Output| FirewallPost[Post-LLM Guard]
    FirewallPost -->|Leak detected / Unsafe| Regenerate[Redact / Block]
    FirewallPost -->|Clean Output| Client
    Gateway <-->|Real-time Metrics & Console| WebSocket[WebSocket Manager]
```

---

## 🚀 Quick-Start Guides

### 1. Run Python Backend
To start the FastAPI webserver:
```bash
cd backend
# Activate virtual environment
.\venv\Scripts\activate
# Start Server
python -m uvicorn app.main:app --reload --port 8000
```
*API will bind to* `http://localhost:8000`.

### 2. Run React Frontend Dashboard
To run the Vite dev server:
```bash
cd frontend
# Start dev server
npm run dev
```
*Frontend will bind to* `http://localhost:5173`.

---

## 🔐 Telemetry Portal Credentials

Upon startup, the database is seeded automatically with the following profiles:
*   **Administrator Portal:**
    *   **Username:** `admin`
    *   **Password:** `admin123`
    *   *Access:* full metric audits, database cleans, policy compilation.
*   **Operator Console:**
    *   **Username:** `operator`
    *   **Password:** `operator123`
    *   *Access:* tool registrations and threshold parameters edits.

---

## 📁 Directory Schema Mapping

*   [`/backend/app/security/`](file:///d:/current%20project/Prompt%20Injection%20Resistant/backend/app/security/) - Core security components (firewall, sandboxing, isolation, agent controls).
*   [`/backend/app/routers/`](file:///d:/current%20project/Prompt%20Injection%20Resistant/backend/app/routers/) - Modular endpoints for audits, scanning, auth, and gateway pipeline.
*   [`/backend/tests/`](file:///d:/current%20project/Prompt%20Injection%20Resistant/backend/tests/) - Pytest verification test suite.
*   [`/frontend/src/`](file:///d:/current%20project/Prompt%20Injection%20Resistant/frontend/src/) - React dashboard panels and real-time trace socket monitors.
*   [`/docs/`](file:///d:/current%20project/Prompt%20Injection%20Resistant/docs/) - System threat models and API layouts.

---

## 📸 Technical Security Visual Previews

Here are visual representations of the security innovation modules active in this gateway:

### 1. Secure LLM Gateway Authentication
*The secure entrance console validating administrator or operator credentials before opening the telemetry portal.*
![Login Console](docs/images/login_screen.png)

### 2. Gateway Security Hub (Dashboard Home)
*Real-time monitoring panel displaying transaction rates, blocked jailbreaks, risk metrics, daily firewall traffic trends, and audit logs.*
![Gateway Security Hub](docs/images/dashboard_view.png)

### 3. Real-Time Security & Isolation Console
*Live prompt firewall execution logs tracing threat scoring, scan stages, sandboxed evaluations, and intercepting injection payloads.*
![Real-Time Security Console](docs/images/security_console_flow.png)

### 4. Red Team Payload Penetration Lab
*A workspace containing a repository of common LLM attack vectors (DAN modes, Base64 obfuscation, spoofer role confusion) to test firewall defenses.*
![Red Team Payload Lab](docs/images/attack_lab_result.png)

### 5. Autonomous Red vs. Blue Lab
*Automated adversarial arena simulating agent interactions with security protocols, testing adaptive firewalls.*
![Red vs Blue Lab](docs/images/red_vs_blue_lab.png)

### 6. Multimodal Steganography Scanner
*Checks image files for hidden prompt injections or malicious instruction payloads embedded inside pixel data.*
![Stego Scanner](docs/images/steganography_scanner.png)
