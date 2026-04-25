from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import parse, sentences
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="PDF Parser API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(parse.router)
app.include_router(sentences.router)

@app.get("/health")
def health():
    return {"status": "ok"}
