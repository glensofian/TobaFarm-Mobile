import torch
from langchain_community.cache import RedisCache
from langchain_core.globals import set_llm_cache
import uvicorn
from threading import Thread
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from transformers import Qwen3VLForConditionalGeneration, AutoProcessor, TextIteratorStreamer
from src.search import RAGSearch
import redis
import asyncio
import json
import os

# Set PyTorch allocation configuration to avoid fragmentation
os.environ["PYTORCH_ALLOC_CONF"] = "expandable_segments:True"
# Ensure we use a specific GPU if CUDA_VISIBLE_DEVICES is not set by environment
# For this server, GPU 5 seems to have the most free space.
# os.environ["CUDA_VISIBLE_DEVICES"] = "0,1,2,3,4,5,6,7" 

from contextlib import asynccontextmanager
from collections import defaultdict, deque

# --- Configuration ---
MODEL_NAME = "./models/qwen3-vl-8b-instruct"
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
OUTPUT_FILE = "./retrieval_search_output.txt"  # Fixed typo: "retreival" → "retrieval"

# Global state
processor = None
model = None
rag_engine = None
r_client = None  # Redis client (optional)

# ── In-Memory Fallback Store ───────────────────────────────────────
# Used when Redis is unavailable. Session → deque of messages (maxlen=20)
chat_memory_store: dict[str, deque] = defaultdict(lambda: deque(maxlen=20))


def load_chat_history(session_id: str, limit: int = 6) -> list[dict]:
    """
    Load the last N messages for a session.
    Tries Redis first, falls back to in-memory store.
    """
    # Try Redis
    if r_client is not None:
        try:
            history_key = f"chat_history:{session_id}"
            raw_history = r_client.lrange(history_key, -limit, -1)
            # Log raw history for debugging
            with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
                f.write(f"\n[Redis] Raw history of {session_id}: {raw_history}\n")
            return [json.loads(m) for m in raw_history]
        except Exception as e:
            with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
                f.write(f"\n[Warning] Redis load failed for {session_id}: {e}\n")
            # Fall through to in-memory

    # Fallback to in-memory store
    history = list(chat_memory_store[session_id])
    return history[-limit:] if len(history) > limit else history


def save_chat_message(session_id: str, message: dict) -> None:
    """
    Append a new message to session history.
    Tries Redis first, falls back to in-memory store.
    """
    msg_json = json.dumps(message)

    # Try Redis
    if r_client is not None:
        try:
            history_key = f"chat_history:{session_id}"
            r_client.rpush(history_key, msg_json)
            r_client.ltrim(history_key, -20, -1)  # Keep last 20
            r_client.expire(history_key, 86400 * 10)  # 10 days TTL
            return
        except Exception as e:
            with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
                f.write(f"\n[Warning] Redis save failed for {session_id}: {e}\n")
            # Fall through to in-memory

    # Fallback to in-memory store
    chat_memory_store[session_id].append(message)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ─────────────────────────────────────────────────────
    global processor, model, rag_engine, r_client

    print("=" * 60)
    print("STARTING RAG SERVER LIFESPAN")
    print("=" * 60)

    with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
        f.write("\n" + "=" * 60 + "\nSTARTING RAG SERVER LIFESPAN\n" + "=" * 60 + "\n")

    # 1. Redis Initialization (Optional)
    print(f"Attempting Redis connection: {REDIS_URL}")
    try:
        r_client = redis.from_url(REDIS_URL, decode_responses=True)
        r_client.ping()  # Test connection

        # Initialize LangChain cache with Redis
        try:
            set_llm_cache(RedisCache(redis_=r_client))
        except TypeError:
            try:
                set_llm_cache(RedisCache(redis_client=r_client))
            except TypeError:
                set_llm_cache(RedisCache(redis_url=REDIS_URL))

        print("✅ Redis Cache initialized.")
        with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
            f.write("✅ Redis Cache initialized.\n")

    except Exception as e:
        print(f"⚠️ Redis unavailable, using in-memory fallback: {e}")
        with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
            f.write(f"⚠️ Redis unavailable, using in-memory fallback: {e}\n")
        r_client = None  # Ensure fallback is used

    # 2. Model Loading
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device}")
    print(f"Loading Model: {MODEL_NAME}...")

    with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
        f.write(f"\nDevice: {device}\nLoading Model: {MODEL_NAME}...\n")

    try:
        processor = AutoProcessor.from_pretrained(
            MODEL_NAME,
            trust_remote_code=True,
            local_files_only=True
        )
        model = Qwen3VLForConditionalGeneration.from_pretrained(
            MODEL_NAME,
            device_map="auto",
            trust_remote_code=True,
            low_cpu_mem_usage=True,
            use_safetensors=True,
            local_files_only=True,
            torch_dtype=torch.bfloat16
        )
        print("✅ Model loaded successfully!")
        with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
            f.write("✅ Model loaded successfully!\n")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
            f.write(f"❌ Error loading model: {e}\n")
        yield  # Exit early if model fails
        return

    # 3. RAG Search Initialization
    print("Initializing RAG Search...")
    try:
        rag_engine = RAGSearch(persist_dir="chromaDB", collection_name="pdf_files")
        print("✅ RAG Engine Ready.")
        with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
            f.write("✅ RAG Engine Ready.\n" + "=" * 60 + "\n")
    except Exception as e:
        print(f"⚠️ RAG Engine initialization warning: {e}")
        rag_engine = None

    yield  # Application runs here

    # ── Shutdown ────────────────────────────────────────────────────
    print("Shutting down RAG Server...")
    with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
        f.write("\nShutting down RAG Server...\n")
    # Optional: Clear in-memory store on shutdown
    chat_memory_store.clear()


app = FastAPI(lifespan=lifespan)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health Check Endpoint ─────────────────────────────────────────
@app.get("/")
async def health():
    redis_status = "disconnected"
    if r_client is not None:
        try:
            if r_client.ping():
                redis_status = "connected"
        except:
            redis_status = "error"

    return {
        "status": "running",
        "service": "ToFa RAG Server",
        "redis": redis_status,
        "model_loaded": model is not None,
        "rag_ready": rag_engine is not None,
        "device": "cuda" if torch.cuda.is_available() else "cpu"
    }

@app.websocket("/ws-rag")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    if model is None:
        print("❌ Model not loaded, inform client")
        await websocket.send_text("⚠️ Server starting (loading 8B model)... Please wait 1-2 mins.")
        await asyncio.sleep(1)
        await websocket.close()
        return

    print(f"🔌 Client connected (RAG): {websocket.client}")

    try:
        while True:
            raw_data = await websocket.receive_text()

            with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
                f.write(f"\n[RAW] Received: {raw_data}\n")

            # Parse session_id and query
            session_id = "default_session"
            user_query = raw_data

            try:
                data = json.loads(raw_data)
                if isinstance(data, dict):
                    user_query = data.get("query", data.get("message", raw_data))
                    session_id = data.get("session_id", data.get("conversation_id", "default_session"))
            except json.JSONDecodeError:
                pass

            print(f"💬 [{session_id}] Query: {user_query[:100]}...")

            # Handle quit commands
            if str(user_query).lower().strip() in ['quit', 'exit', '/bye']:
                await websocket.send_text("👋 Goodbye! Session ended.")
                break

            # Retrieve context from RAG
            context_text = ""
            if rag_engine is not None:
                try:
                    context_text = rag_engine.retrieve_context(
                        query_text=user_query,
                        text_top_k=5,
                        image_top_k=2
                    )
                except Exception as e:
                    print(f"⚠️ RAG retrieval error: {e}")
                    context_text = "No relevant information found in the documents."
            else:
                context_text = "RAG engine not available."

            # Load chat history
            chat_history = load_chat_history(session_id, limit=6)

            # Build system prompt
            system_prompt = f"""You are a helpful assistant that specialises in agriculture in the Lake Toba Region in North Sumatra, Indonesia. 
Your name is ToFa (stands for Toba Farm). You answer questions based on your knowledge, with some added knowledge from the context below. 
Pay attention to what language the user messages, so you can reply in the user's language. 

IMPORTANT: The context below may contain descriptions of images from the documents, marked as "[Visual Content: ...]". Use these descriptions to answer questions about figures, photos, or diagrams.

You must answer based on the knowledge provided and our previous conversation.
If you don't know the answer, just say: I'm sorry, I cannot answer that.
--------------------

The context:
{context_text}
"""

            # Build messages array
            messages = [{"role": "system", "content": system_prompt}]
            messages.extend(chat_history[-6:])
            messages.append({"role": "user", "content": str(user_query)})

            # Apply chat template
            prompt_text = processor.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True
            )

            # Prepare model inputs
            model_inputs = processor(text=[prompt_text], return_tensors="pt").to(model.device)

            # Setup streaming
            streamer = TextIteratorStreamer(
                processor.tokenizer,
                skip_prompt=True,
                skip_special_tokens=True,
                timeout=20
            )

            generation_kwargs = dict(
                **model_inputs,
                streamer=streamer,
                max_new_tokens=512,
                temperature=0.7,
                top_p=0.9,
                repetition_penalty=1.1,
                do_sample=True,
                pad_token_id=processor.tokenizer.eos_token_id
            )

            # Run generation in background thread
            thread = Thread(target=model.generate, kwargs=generation_kwargs)
            thread.start()

            # ✅ Stream response to client (FIXED: regular for loop)
            full_response = ""
            for new_text in streamer:  # ← Regular for, NOT async for
                if new_text:
                    full_response += new_text
                    await websocket.send_text(new_text)
                    await asyncio.sleep(0)  # Yield to event loop

            # Wait for generation thread to complete
            thread.join(timeout=30)

            # Save conversation to history
            save_chat_message(session_id, {"role": "user", "content": str(user_query)})
            save_chat_message(session_id, {"role": "assistant", "content": full_response})

    except WebSocketDisconnect:
        print(f"🔌 Client disconnected (RAG): {websocket.client}")
    except Exception as e:
        print(f"❌ Error in /ws-rag: {e}")
        with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
            f.write(f"\n❌ Error in /ws-rag: {e}\n")
        try:
            await websocket.send_text(f"⚠️ Error: {str(e)}")
        except:
            pass
@app.websocket("/ws-base")
async def websocket_base_endpoint(websocket: WebSocket):
    await websocket.accept()

    if model is None:
        print("❌ Model not loaded, informing client and closing connection")
        try:
            await websocket.send_text("⚠️ Server is still starting up or model failed to load. Please try again in 1-2 minutes.")
            await asyncio.sleep(1)
        except:
            pass
        await websocket.close()
        return

    print(f"🔌 Client connected (BASE): {websocket.client}")

    try:
        while True:
            raw_data = await websocket.receive_text()

            # Parse session_id and query
            session_id = "default_session"
            user_query = raw_data

            try:
                data = json.loads(raw_data)
                if isinstance(data, dict):
                    user_query = data.get("query", data.get("message", raw_data))
                    session_id = data.get("session_id", data.get("conversation_id", "default_session"))
            except json.JSONDecodeError:
                pass

            print(f"💬 [BASE/{session_id}] Query: {user_query[:100]}...")

            # Handle quit commands
            if str(user_query).lower().strip() in ['quit', 'exit', '/bye']:
                await websocket.send_text("👋 Goodbye! Session ended.")
                break

            # Load chat history
            chat_history = load_chat_history(session_id, limit=6)

            # Build system prompt (no RAG context)
            system_prompt = """You are ToFa (Toba Farm), a helpful assistant that specialises in 
agriculture in the Lake Toba Region in North Sumatra, Indonesia.
Pay attention to what language the user messages, so you can reply in the user's language.
If you don't know the answer, just say: I'm sorry, I cannot answer that."""

            # Build messages array
            messages = [{"role": "system", "content": system_prompt}]
            messages.extend(chat_history[-6:])
            messages.append({"role": "user", "content": str(user_query)})

            # Apply chat template
            prompt_text = processor.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True
            )

            # Prepare model inputs
            model_inputs = processor(text=[prompt_text], return_tensors="pt").to(model.device)

            # Setup streaming
            streamer = TextIteratorStreamer(
                processor.tokenizer,
                skip_prompt=True,
                skip_special_tokens=True,
                timeout=20
            )

            generation_kwargs = dict(
                **model_inputs,
                streamer=streamer,
                max_new_tokens=1024,
                temperature=0.7,
                top_p=0.9,
                repetition_penalty=1.1,
                do_sample=True,
                pad_token_id=processor.tokenizer.eos_token_id
            )

            # Run generation in background thread
            thread = Thread(target=model.generate, kwargs=generation_kwargs)
            thread.start()

            # ✅ Stream response to client (FIXED: regular for loop)
            full_response = ""
            for new_text in streamer:  # ← Regular for, NOT async for
                if new_text:
                    full_response += new_text
                    await websocket.send_text(new_text)
                    await asyncio.sleep(0)  # Yield to event loop

            # Wait for generation thread
            thread.join(timeout=30)

            # Save conversation to history
            save_chat_message(session_id, {"role": "user", "content": str(user_query)})
            save_chat_message(session_id, {"role": "assistant", "content": full_response})

    except WebSocketDisconnect:
        print(f"🔌 Client disconnected (BASE): {websocket.client}")
    except Exception as e:
        print(f"❌ Error in /ws-base: {e}")
        with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
            f.write(f"\n❌ Error in /ws-base: {e}\n")
        try:
            await websocket.send_text(f"⚠️ Error: {str(e)}")
        except:
            pass

# ── Entry Point ───────────────────────────────────────────────────
if __name__ == "__main__":
    # For Jupyter: use nest_asyncio if running async code directly in cells
    try:
        import nest_asyncio
        nest_asyncio.apply()
        print("🔧 nest_asyncio applied for Jupyter compatibility")
    except ImportError:
        pass

    print(f"🚀 Starting ToFa RAG Server on http://0.0.0.0:8000")
    print(f"📝 Logs appended to: {OUTPUT_FILE}")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")