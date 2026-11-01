from fastapi import APIRouter, HTTPException, status
from app.models import ComplaintAnalysisRequest, ComplaintAnalysisResponse
from app.ai.gemini_client import analyze_complaint_ai_connector

router = APIRouter(prefix="/api/ai", tags=["AI Connector"])

@router.post("/analyze-complaint", response_model=ComplaintAnalysisResponse)
async def analyze_complaint_endpoint(req: ComplaintAnalysisRequest):
    if len(req.description.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Description must be at least 3 characters long for AI analysis."
        )

    try:
        result = await analyze_complaint_ai_connector(
            description=req.description,
            image_base64=req.image_base64
        )
        return result
    except Exception as e:
        # Extra safety boundary: never crash the endpoint, return robust fallback
        from app.ai.gemini_client import fallback_rule_based_classification
        fallback = fallback_rule_based_classification(req.description)
        return {
            "category": fallback["category"],
            "priority": fallback["priority"],
            "department": fallback["department"],
            "summary": fallback["summary"],
            "suggested_next_action": fallback["suggested_next_action"],
            "confidence_score": 0.70,
            "source": "fallback_classifier",
            "disclaimer": "Preliminary AI triage suggestion. Does not represent confirmed municipal action."
        }
