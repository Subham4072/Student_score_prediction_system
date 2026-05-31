from fastapi import APIRouter

from .predict import router as predict_router

router = APIRouter()
router.include_router(predict_router)
