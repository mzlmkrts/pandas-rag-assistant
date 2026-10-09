# 🐼 Pandas Dynamic RAG Assistant

A secure, fully local, and dynamic Retrieval-Augmented Generation (RAG) assistant designed to query Pandas documentation with zero hallucinations and full context transparency. 

Pandas Dynamic RAG Assistant is a privacy-first, fully local AI query engine that bridges dynamic Python runtime introspection with vector-search retrieval. By combining dynamic docstring extraction (inspect), persistent vector indexing in ChromaDB, and strict context-grounded LLM prompts via Ollama, it provides transparent, zero-hallucination interactive documentation for 500+ Pandas API methods without relying on external API keys or cloud infrastructure.

Built with **FastAPI**, **ChromaDB**, **Ollama (`llama3` & `nomic-embed-text`)**, and **React**.

---
## 📐 Architecture & Data Flow

+-------------------------------------------------------------------------------+
|                             PYTHON RUNTIME                                   |
|  pd.DataFrame / pd.Series / pd  --->  inspect.getdoc()                       |
|                                            |                                  |
|                                            v                                  |
|                                  [ 514 Raw Docstrings ]                       |
+--------------------------------------------+----------------------------------+
|
v
+-------------------------------------------------------------------------------+
|                             VECTOR DATABASE                                   |
|  nomic-embed-text  --->  ChromaDB (Persistent Storage: backend/chroma_db)    |
+--------------------------------------------+----------------------------------+
|
v
+-------------------------------------------------------------------------------+
|                            FASTAPI BACKEND API                                |
|  - RAG Retrieval: Top-K Vector Search                                         |
|  - Strict Prompt Guardrails (temperature: 0.1, zero hallucination)            |
|  - Ollama Integration (llama3)                                                |
+--------------------------------------------+----------------------------------+
|
v
+-------------------------------------------------------------------------------+
|                              REACT FRONTEND                                   |
|  - Interactive Chat Interface with response timer                             |
|  - Responses from LLM with reference to pandas documentation                  |
|  - ChromaDB Inspector & Docstring Viewer Modal                                |
|  - Raw Context Auditor (View exact chunks fed to LLM)                         |
+-------------------------------------------------------------------------------+

---

## ✨ Key Features

- **Dynamic Runtime Extraction**: Dynamically extracts live API docstrings (`pd.DataFrame`, `pd.Series`, `pd`) via Python's `inspect` module directly at startup (no static hardcoded JSON files).
- **Persistent Vector Store**: Uses ChromaDB `PersistentClient` to maintain vector embeddings across server restarts without re-indexing friction.
- **Strict Anti-Hallucination Guardrails**: Fine-tuned system prompts with zero creativity (`temperature: 0.1`) that force citation sources (`### 📚 Citation Sources`) and strict context grounding.
- **Full Transparency UI**: React frontend features a live **Thought Duration Timer**, **ChromaDB Inspector Modal** with pagination & search, and a **Raw Context Viewer** to audit exact chunks fed into the LLM.
- **100% Local & Private**: Runs completely offline using Ollama models with no data escaping your machine.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.12, FastAPI, ChromaDB, Ollama, Pandas, Uvicorn
- **Frontend**: React, Vite, Axios, React-Markdown, Lucide Icons

---

## 🚀 Getting Started

### Prerequisites

1. Install and run **[Ollama](https://ollama.com/)**.
2. Pull the required models:
   ```bash
   ollama pull llama3
   ollama pull nomic-embed-text
   ```

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate
pip install fastapi uvicorn chromadb pandas requests pydantic
uvicorn main:app --reload
```
*Backend API runs at `http://127.0.0.1:8000` (Docs available at `/docs`).*

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at `http://localhost:5173`.*

---

## 🧪 Testing Zero-Hallucination Defense

Ask the bot about non-existent Pandas methods (e.g., *"How do I use `pd.DataFrame.teleport_rows()`?"*). 

The assistant will strictly adhere to the grounded context and refuse to generate fabricated parameters:
> *"I cannot find information about this in the indexed Pandas documentation."*