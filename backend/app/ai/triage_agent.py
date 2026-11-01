import json
from typing import Dict, Any, Optional
from datetime import datetime
from app.ai.gemini_client import classify_complaint_multimodal
from app.services.duplicate_service import find_potential_duplicates
from app.services.severity_service import calculate_severity_score
from app.config import CATEGORY_TO_DEPARTMENT

class AutonomousTriageAgent:
    """
    Autonomous AI Triage Agent that follows a controlled execution loop:
    1. Parse complaint text & multimodal evidence
    2. Execute Spatial Nearby Search tool
    3. Evaluate Administrative Jurisdiction
    4. Compute Transparent Priority/Severity Score
    5. Detect Potential Duplicates
    6. Prepare Structured Triage Decision Packet for Admin Review
    """
    
    def __init__(self, complaint_id: str, text: str, lat: float, lon: float, image_path: Optional[str] = None):
        self.complaint_id = complaint_id
        self.text = text
        self.latitude = lat
        self.longitude = lon
        self.image_path = image_path
        self.execution_log = []

    def log_step(self, tool_name: str, input_args: Any, output_result: Any):
        self.execution_log.append({
            "timestamp": datetime.now().isoformat(),
            "tool": tool_name,
            "inputs": input_args,
            "summary": output_result
        })

    async def run(self) -> Dict[str, Any]:
        # Step 1: Tool Execution - Multimodal Classification
        ai_classification = await classify_complaint_multimodal(self.text, self.image_path)
        self.log_step(
            tool_name="multimodal_classifier",
            input_args={"text_length": len(self.text), "has_image": bool(self.image_path)},
            output_result={"category": ai_classification["primary_category"], "confidence": ai_classification["confidence_score"]}
        )

        category = ai_classification["primary_category"]
        safety_concerns = ai_classification["potential_safety_concerns"]

        # Step 2: Tool Execution - Geospatial Duplicate Search
        duplicates = find_potential_duplicates(
            complaint_id=self.complaint_id,
            lat=self.latitude,
            lon=self.longitude,
            category=category,
            description=self.text,
            radius_meters=500.0
        )
        self.log_step(
            tool_name="geospatial_duplicate_search",
            input_args={"lat": self.latitude, "lon": self.longitude, "radius_m": 500},
            output_result={"matches_found": len(duplicates), "top_score": duplicates[0]["similarity_score"] if duplicates else 0}
        )

        # Step 3: Tool Execution - Rule-based Severity Calculation
        severity_result = calculate_severity_score(
            category=category,
            description=self.text,
            safety_concerns=safety_concerns,
            upvotes=0,
            duration_days=1
        )
        self.log_step(
            tool_name="severity_scoring_engine",
            input_args={"category": category, "safety_count": len(safety_concerns)},
            output_result={"score": severity_result["severity_score"], "level": severity_result["severity_level"]}
        )

        # Step 4: Jurisdiction & Department Mapping
        suggested_dept = CATEGORY_TO_DEPARTMENT.get(category, "General Civic Works")
        self.log_step(
            tool_name="jurisdiction_router",
            input_args={"category": category},
            output_result={"department": suggested_dept}
        )

        # Step 5: Synthesize Triage Packet
        triage_report = {
            "agent_status": "COMPLETED",
            "complaint_id": self.complaint_id,
            "ai_classification": ai_classification,
            "severity_assessment": severity_result,
            "recommended_department": suggested_dept,
            "potential_duplicates_count": len(duplicates),
            "potential_duplicates": duplicates[:5],
            "requires_immediate_action": severity_result["severity_level"] in ["High", "Critical"],
            "execution_steps": self.execution_log,
            "recommendation": f"Route complaint to {suggested_dept} with {severity_result['severity_level']} priority. "
                              f"{'Flagged for duplicate review.' if duplicates else 'No duplicates detected.'}"
        }

        return triage_report
