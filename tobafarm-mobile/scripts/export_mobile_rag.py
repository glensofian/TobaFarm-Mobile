import chromadb
import json
import os
from sentence_transformers import SentenceTransformer
import numpy as np
from pathlib import Path

# Configuration
CHROMA_PATH = "./data/chromaDB"
COLLECTION_NAME = "pdf_files"
OUTPUT_PATH = "./assets/mobile_rag_data.json"
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2" # Mobile-compatible 384D model

def export_for_mobile():
    print(f"--- Mobile RAG Export Tool ---")
    
    # Check if chroma exists
    if not os.path.exists(CHROMA_PATH):
        print(f"Error: ChromaDB not found at {CHROMA_PATH}")
        return

    # 1. Initialize Chroma Client
    print(f"Connecting to ChromaDB at {CHROMA_PATH}...")
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    
    try:
        collection = client.get_collection(COLLECTION_NAME)
    except Exception as e:
        print(f"Error: Could not find collection '{COLLECTION_NAME}': {e}")
        return

    print(f"Found {collection.count()} items in collection.")

    # 2. Get all data
    # Note: We get documents and metadatas. We ignore original embeddings (1536-D).
    results = collection.get(include=['documents', 'metadatas'])
    
    documents = results['documents']
    metadatas = results['metadatas']
    ids = results['ids']

    if not documents:
        print("No documents found to export.")
        return

    # 3. Initialize Mobile Embedding Model (on laptop)
    print(f"Loading mobile-compatible model: {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)

    # 4. Re-embed everything
    print(f"Re-embedding {len(documents)} items (this might take a minute)...")
    embeddings = model.encode(documents, show_progress_bar=True)

    # 5. Build export structure
    export_data = []
    for i in range(len(documents)):
        export_data.append({
            "id": ids[i],
            "document": documents[i],
            "metadata": metadatas[i],
            "embedding": embeddings[i].tolist()
        })

    # 6. Save to JSON
    print(f"Saving to {OUTPUT_PATH}...")
    # Ensure assets dir exists
    Path(os.path.dirname(OUTPUT_PATH)).mkdir(parents=True, exist_ok=True)
    
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, ensure_ascii=False)

    print(f"Done! Created {OUTPUT_PATH}")
    print(f"Next: The mobile app can now use 'vectorStore.addBatch(export_data)' to load this.")

if __name__ == "__main__":
    export_for_mobile()
