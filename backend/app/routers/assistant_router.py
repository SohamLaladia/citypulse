from fastapi import APIRouter, Depends
from typing import Optional
from app.models import AssistantChatRequest
from app.auth import get_optional_user
from app.ai.assistant import CityPulseAssistant

router = APIRouter(prefix="/api/assistant", tags=["City Pulse AI Assistant"])

@router.post("/chat")
async def chat_with_assistant(
    req: AssistantChatRequest,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    assistant = CityPulseAssistant(current_user=current_user)
    result = await assistant.answer_query(
        message=req.message,
        lat=req.latitude,
        lon=req.longitude,
        locality=req.locality
    )
    return result
