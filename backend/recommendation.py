from typing import List

from schemas import StudentPerformanceRequest


def create_recommendations(data: StudentPerformanceRequest) -> List[str]:
    recommendations: List[str] = []

    if data.hours_studied < 3.5:
        recommendations.append("Increase study hours.")

    if data.sleep_hours < 6:
        recommendations.append("Maintain 6-8 hours of sleep.")

    if data.attendance_percent < 75:
        recommendations.append("Improve attendance.")

    if data.previous_scores < 68:
        recommendations.append(
            "Revise core concepts and practice more questions."
        )

    if not recommendations:
        recommendations.append(
            "Excellent academic habits. Keep maintaining your current routine."
        )

    return recommendations