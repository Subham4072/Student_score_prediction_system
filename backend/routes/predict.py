from fastapi import APIRouter, HTTPException, Request

from backend.recommendation import create_recommendations
from backend.schemas import PredictionResponse, StudentPerformanceRequest

router = APIRouter()


def determine_performance_level(score: float) -> str:
    if score <= 40:
        return "Needs Improvement"
    if score <= 60:
        return "Average"
    if score <= 80:
        return "Good"
    return "Excellent"


@router.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Predict student performance using the ScholarSense AI model",
)
def predict_student_performance(
    request: Request, payload: StudentPerformanceRequest
) -> PredictionResponse:
    model = request.app.state.model
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded.")

    try:
        prediction = model.predict(
            [
                [
                    payload.hours_studied,
                    payload.sleep_hours,
                    payload.attendance_percent,
                    payload.previous_scores,
                ]
            ]
        )
        predicted_score = round(float(prediction[0]), 2)
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Prediction failed. Please try again later.",
        ) from error

    return PredictionResponse(
        predicted_score=predicted_score,
        performance_level=determine_performance_level(predicted_score),
        recommendations=create_recommendations(payload),
    )
