import requests

def ask_pandas_assistant(question: str, context: str, history: list = None) -> str:
    # Geçmiş mesajları formatlama
    formatted_history = ""
    if history:
        for msg in history:
            role = "User" if msg.get("sender") == "user" else "Assistant"
            formatted_history += f"{role}: {msg.get('text')}\n"

    # STRICT RAG & CITATION SYSTEM PROMPT
    prompt = f"""You are an expert Python Data Science assistant specializing in Pandas.

CRITICAL GROUNDING & STRICT RAG RULES:
1. Answer the user's question USING ONLY the facts explicitly provided in the "RETRIEVED PANDAS DOCUMENTATION" section below.
2. Do NOT use your general pre-trained knowledge or make assumptions outside the provided documentation.
3. If the answer cannot be found or deduced directly from the provided documentation, you MUST strictly respond with:
   "I cannot find information about this in the indexed Pandas documentation."
4. Every time you state a feature, function, or code behavior, cite the exact Pandas method/class name from the reference (e.g., [pd.DataFrame.groupby]).
5. At the very end of your response, add a section titled "### 📚 Citation Sources" listing the exact API References you used from the documentation.

CONVERSATIONAL INSTRUCTIONS:
- Keep text explanations clean, professional, and straight to the point.
- Provide clean Python code snippets only when directly supported by the retrieved documentation.
- Maintain context from the conversation history if applicable.

PREVIOUS CONVERSATION HISTORY:
{formatted_history if formatted_history else "No previous history."}

RETRIEVED PANDAS DOCUMENTATION:
{context}

USER QUESTION:
{question}
"""

    # Ollama API İsteği
    payload = {
        "model": "llama3",  # Kullanmakta olduğunuz Ollama modeli (örn: llama3, qwen2.5)
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.1,  # 0.1 yaparak yaratıcılığı/uydurmayı engelliyoruz, doğrudan bilgiye odaklanıyor
            "num_ctx": 2048     # Context boyutunu sınırlayarak LLM düşünme süresini (1.5 dk -> 15-30 sn) düşürüyoruz
        }
    }

    try:
        response = requests.post("http://localhost:11434/api/generate", json=payload)
        response.json()
        return response.json().get("response", "No response generated.")
    except Exception as e:
        return f"Error connecting to Ollama: {str(e)}"