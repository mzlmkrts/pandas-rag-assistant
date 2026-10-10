# Pandas Dynamic RAG Assistant

A secure, fully local, and dynamic Retrieval-Augmented Generation (RAG) assistant designed to query Pandas documentation with zero hallucinations and full context transparency. 

Pandas Dynamic RAG Assistant is a privacy-first, fully local AI query engine that bridges dynamic Python runtime introspection with vector-search retrieval. By combining dynamic docstring extraction (inspect), persistent vector indexing in ChromaDB, and strict context-grounded LLM prompts via Ollama, it provides transparent, zero-hallucination interactive documentation for 500+ Pandas API methods without relying on external API keys or cloud infrastructure.

Built with **FastAPI**, **ChromaDB**, **Ollama (`llama3` & `nomic-embed-text`)**, and **React**.

---

## 💡 Why Pandas RAG Assistant?

 Navigating the vast Pandas documentation can be slow, complex, and frustrating. Conventional online LLMs often produce **outdated syntax or subtle hallucinations** when dealing with nuanced data manipulation methods.

**Pandas RAG Assistant** bridges the gap between complex official APIs and instant, reliable developer insights—**100% locally and completely private**.

---

## 💡 Why Pandas RAG Assistant?

 Navigating the vast Pandas documentation can be slow, complex, and frustrating. Conventional online LLMs often produce **outdated syntax or subtle hallucinations** when dealing with nuanced data manipulation methods.

**Pandas RAG Assistant** bridges the gap between complex official APIs and instant, reliable developer insights—**100% locally and completely private**.

---

## 🚀 Key Advantages & Architecture Philosophy

### 🔒 1. Fully Local & Zero-Cost Infrastructure
* **Total Privacy:** Your data and queries never leave your local machine.
* **No API Keys or Costs:** Driven completely by local instances of **Ollama (`llama3`)** and **ChromaDB**.
* **Offline-Ready:** Works seamlessly without an active internet connection once initial embeddings are created.

### ⚡ 2. Dynamic Runtime Ingestion (Zero Maintenance)
* Instead of relying on static markdown files that quickly become outdated, the backend uses Python runtime introspection (`inspect.getdoc()`) directly on the installed Pandas package.
* Automatically stays synchronized with whatever version of Pandas you have installed!

### 🎨 3. Easy UX & "Transparency First" Dashboard
Unlike opaque "black-box" AI tools, this UI prioritizes maximum auditability and developer control:

* ⏱️ **Thought Duration Timer:** Real-time metrics tracking exact model reasoning and vector retrieval latency.
* 🔍 **ChromaDB Inspector Modal:** Explore top-$k$ retrieved vector snippets and context chunks used for every query.
* 📄 **Raw Context Auditor:** Inspect the exact docstrings injected into the LLM prompt before the final answer is streamed.
* 💬 **Clean & Responsive UI:** Modern glassmorphism design built with React, Vite, and Tailwind CSS for frictionless developer workflows.

## 📐 System Architecture & Data Pipeline

### 1. Dynamic Extraction Layer
> **Python Runtime** (`inspect.getdoc()`) ➔ Extracts live docstrings from **500+ Pandas API Methods** at startup.

### 2. Vector Storage & Embedding
> **nomic-embed-text** ➔ Generates semantic embeddings stored persistently in **ChromaDB** (`backend/chroma_db`).

### 3. RAG Retrieval & Inference Engine
> **User Query** ➔ Top-K Vector Search ➔ **FastAPI Backend** ➔ Strict Guardrails (`temp: 0.1`) ➔ **Ollama (llama3)**.

### 4. Interactive Transparency UI
> **React Frontend** featuring:
> - ⏱️ Thought Duration Timer
> - 🔍 ChromaDB Inspector Modal
> - 🔍 Raw Context Auditor
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
