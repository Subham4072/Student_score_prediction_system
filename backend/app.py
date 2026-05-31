from pathlib import Path
import pickle

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routes import router as api_router

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
MODEL_PATH = BASE_DIR / "student_model.pkl"

app = FastAPI(
    title="ScholarSense AI API",
    description="FastAPI backend for ScholarSense AI student performance prediction.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.model = None


@app.on_event("startup")
def load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")

    with MODEL_PATH.open("rb") as model_file:
        app.state.model = pickle.load(model_file)


app.include_router(api_router, prefix="/api")

app.mount(
    "/",
    StaticFiles(directory=PROJECT_ROOT / "frontend", html=True),
    name="frontend",
)