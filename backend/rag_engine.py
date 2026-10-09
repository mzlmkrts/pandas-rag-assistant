import inspect
import pandas as pd
import chromadb
from chromadb.utils import embedding_functions

# Ollama Embedding Yapılandırması
ollama_ef = embedding_functions.OllamaEmbeddingFunction(
    url="http://localhost:11434/api/embeddings",
    model_name="nomic-embed-text:latest",
)

# 1. GEÇİCİ BELLEK YERİNE KALICI DİSK KAYDI (PersistentClient)
# Veriler projenizdeki './chroma_db' klasörüne kaydedilir ve sunucu kapansa da silinmez.
client = chromadb.PersistentClient(path="./chroma_db")

collection = client.get_or_create_collection(
    name="pandas_docs", 
    embedding_function=ollama_ef
)

def startup_db():
    """Veritabanını kontrol eder; diskte kayıtlı veri varsa indekslemeyi atlar."""
    existing_count = collection.count()
    
    # Diskte önceden indekslenmiş veri varsa direkt çıkış yapılır (Milisaniyeler sürer)
    if existing_count > 0:
        print(f"ChromaDB diskten yüklendi. Toplam {existing_count} doküman hazır. İndeksleme ATLANDI.")
        return

    print("İlk kurulum: Pandas docstring'leri taranıyor ve diske kaydediliyor...")
    
    targets = [
        ("pd.DataFrame", pd.DataFrame),
        ("pd.Series", pd.Series),
        ("pd", pd)
    ]
    
    docs_data = []
    seen_ids = set()

    for prefix, target_obj in targets:
        for name, member in inspect.getmembers(target_obj):
            if name.startswith("_"):
                continue  # Gizli metotları atla
            
            doc = inspect.getdoc(member)
            full_name = f"{prefix}.{name}"
            
            if doc and len(doc.strip()) > 50 and full_name not in seen_ids:
                seen_ids.add(full_name)
                formatted_doc = f"API Reference: {full_name}\n\nDocstring:\n{doc}"
                docs_data.append((full_name, formatted_doc))

    ids = [item[0] for item in docs_data]
    sample_docs = [item[1] for item in docs_data]
    
    # ChromaDB'ye ekliyoruz (PersistentClient otomatik olarak diske yazar)
    batch_size = 100
    for i in range(0, len(sample_docs), batch_size):
        collection.add(
            documents=sample_docs[i:i + batch_size],
            ids=ids[i:i + batch_size]
        )
        
    print(f"İlk indeksleme tamamlandı ve diske yazıldı! Toplam {len(sample_docs)} doküman eklendi.")

def query_docs(query_text: str, n_results: int = 3) -> str:
    """Soruya en yakın Pandas doküman parçalarını getirir."""
    results = collection.query(
        query_texts=[query_text],
        n_results=n_results
    )
    
    docs = results.get("documents", [[]])[0]
    return "\n\n---PANDAS DOCSTRING CHUNK---\n\n".join(docs)