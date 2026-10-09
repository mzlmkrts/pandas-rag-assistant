import json
from pathlib import Path
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd

# rag_engine içerisinden collection nesnesini de içe aktarıyoruz
from rag_engine import startup_db, query_docs, collection
from llm_service import ask_pandas_assistant

app = FastAPI(title="Pandas RAG Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    question: str
    history: list[dict] = []  # Sohbet geçmişi listesi

@app.on_event("startup")
def on_startup():
    startup_db()

@app.post("/api/chat")
def chat_endpoint(request: ChatRequest):
    context = query_docs(request.question)
    answer = ask_pandas_assistant(request.question, context, request.history)
    return {
        "answer": answer,
        "context_used": context
    }

# --- VERİTABANI İNCELEME VE DIŞA AKTARMA ENDPOINT'LERİ ---

@app.get("/api/db/stats")
def get_db_stats():
    """ChromaDB'deki toplam doküman sayısını gösterir."""
    return {
        "status": "online",
        "collection_name": collection.name,
        "total_documents": collection.count()
    }

@app.get("/api/db/inspect")
def inspect_documents(
    limit: int = Query(10, ge=1, le=100), 
    offset: int = Query(0, ge=0),
    search_term: str | None = None
):
    """
    ChromaDB içindeki metin parçalarını Swagger UI üzerinden incelemenizi sağlar.
    Arama terimi (search_term) ekleyerek filtreleme yapabilirsiniz.
    """
    all_data = collection.get(include=["documents"])
    ids = all_data.get("ids", [])
    docs = all_data.get("documents", [])
    
    if search_term:
        filtered = [(i, d) for i, d in zip(ids, docs) if search_term.lower() in d.lower()]
        ids = [i[0] for i in filtered]
        docs = [i[1] for i in filtered]

    paginated_ids = ids[offset : offset + limit]
    paginated_docs = docs[offset : offset + limit]

    return {
        "total_matched": len(ids),
        "limit": limit,
        "offset": offset,
        "items": [
            {"id": doc_id, "preview": doc[:150] + "...", "full_text": doc}
            for doc_id, doc in zip(paginated_ids, paginated_docs)
        ]
    }

@app.get("/api/db/export")
def export_database_to_file(format: str = Query("json", regex="^(json|csv)$")):
    """
    ChromaDB'deki TÜM metinleri ve sayısal vektörleri (embeddings) 
    backend klasörünüze 'pandas_docs_export.json' veya '.csv' olarak kaydeder.
    """
    all_data = collection.get(include=["documents", "embeddings"])
    ids = all_data.get("ids", [])
    docs = all_data.get("documents", [])
    embeddings = all_data.get("embeddings", [])

    if format == "json":
        export_file = Path("pandas_docs_export.json")
        data_to_save = [
            {
                "id": doc_id,
                "document": doc,
                "embedding_dimension": len(emb) if emb is not None else 0,
                "embedding_vector_sample": emb[:5] if emb is not None else [],
                "full_embedding_vector": emb
            }
            for doc_id, doc, emb in zip(ids, docs, embeddings)
        ]
        with open(export_file, "w", encoding="utf-8") as f:
            json.dump(data_to_save, f, ensure_ascii=False, indent=2)
            
    else:  # CSV formatı
        export_file = Path("pandas_docs_export.csv")
        df = pd.DataFrame({
            "id": ids,
            "document": docs,
            "embedding_vector": [str(emb) for emb in embeddings]
        })
        df.to_csv(export_file, index=False, encoding="utf-8")

    return {
        "status": "success",
        "file_created": export_file.resolve().as_posix(),
        "total_records_exported": len(ids)
    }