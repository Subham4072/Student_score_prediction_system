from pydantic import BaseModel, Field, confloat


class StudentPerformanceRequest(BaseModel):
    hours_studied: confloat(ge=0, le=12) = Field(
        ..., example=5.0, description="Hours studied per day"
    )
    sleep_hours: confloat(ge=0, le=12) = Field(
        ..., example=7.0, description="Sleep hours per day"
    )
    attendance_percent: confloat(ge=0, le=100) = Field(
        ..., example=80, description="Attendance percentage"
    )
    previous_scores: confloat(ge=0, le=100) = Field(
        ..., example=70, description="Previous average score"
    )


class PredictionResponse(BaseModel):
    predicted_score: float = Field(
        ..., description="Predicted exam score rounded to two decimals"
    )
    performance_level: str = Field(
        ..., description="Performance level classification"
    )
    recommendations: list[str] = Field(
        ..., description="Actionable recommendations for improvement"
    )
