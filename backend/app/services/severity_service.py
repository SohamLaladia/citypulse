from typing import Dict, Any, List
from app.config import SEVERITY_WEIGHTS, SEVERITY_LEVELS

def calculate_severity_score(
    category: str,
    description: str,
    safety_concerns: List[str],
    upvotes: int = 0,
    duration_days: int = 1,
    is_arterial_road: bool = False
) -> Dict[str, Any]:
    """
    Transparent, rule-based severity and priority assessment scoring algorithm.
    Evaluates:
    - Safety Risk (0 to 40 pts)
    - Affected Population / Upvotes / Location (0 to 25 pts)
    - Infrastructure Damage Severity (0 to 20 pts)
    - Duration Unresolved (0 to 15 pts)
    """
    text_lower = description.lower()
    cat_lower = (category or "").lower()
    
    # 1. Safety Risk Score (Max 40)
    safety_score = 15.0 # Base safety score
    safety_reasons = []
    
    if len(safety_concerns) > 0:
        safety_score += min(15.0, len(safety_concerns) * 7.5)
        safety_reasons.extend(safety_concerns)
        
    if any(w in text_lower for w in ["fatal", "accident", "death", "live wire", "electrocution", "deep hole", "submerged", "choked"]):
        safety_score = min(40.0, safety_score + 15.0)
        safety_reasons.append("Critical hazard keywords detected in citizen statement")
        
    safety_score = min(40.0, round(safety_score, 1))

    # 2. Affected Population / Corridor Score (Max 25)
    pop_score = 10.0
    pop_reasons = []
    if is_arterial_road or any(w in text_lower for w in ["main road", "highway", "junction", "signal", "bus stop", "metro", "school", "hospital"]):
        pop_score += 10.0
        pop_reasons.append("High transit zone / proximity to school, hospital, or arterial intersection")
    
    if upvotes > 0:
        upvote_boost = min(5.0, upvotes * 1.5)
        pop_score += upvote_boost
        pop_reasons.append(f"{upvotes} fellow citizen endorsements")
        
    pop_score = min(25.0, round(pop_score, 1))

    # 3. Infrastructure Damage Severity (Max 20)
    damage_score = 8.0
    damage_reasons = []
    if any(k in cat_lower for k in ["road", "pothole", "drain", "water", "flood", "sewage", "leak"]):
        damage_score += 6.0
        damage_reasons.append(f"High physical asset degradation typical in {category}")
    if any(w in text_lower for w in ["massive", "huge", "broken", "burst", "cave-in", "collapsed", "severe"]):
        damage_score += 6.0
        damage_reasons.append("High structural destruction reported")
        
    damage_score = min(20.0, round(damage_score, 1))

    # 4. Duration Days Score (Max 15)
    duration_score = min(15.0, round(duration_days * 3.0, 1))
    duration_reason = f"Reported issue active for approximately {duration_days} day(s)"

    # Total Score (0 - 100)
    total_score = round(safety_score + pop_score + damage_score + duration_score, 1)

    # Determine Severity Level
    if total_score >= SEVERITY_LEVELS["Critical"]:
        severity_level = "Critical"
    elif total_score >= SEVERITY_LEVELS["High"]:
        severity_level = "High"
    elif total_score >= SEVERITY_LEVELS["Medium"]:
        severity_level = "Medium"
    else:
        severity_level = "Low"

    return {
        "severity_score": total_score,
        "severity_level": severity_level,
        "factor_breakdown": {
            "safety_risk": {
                "score": safety_score,
                "max": SEVERITY_WEIGHTS["safety_risk"],
                "reasons": safety_reasons
            },
            "affected_population": {
                "score": pop_score,
                "max": SEVERITY_WEIGHTS["affected_people"],
                "reasons": pop_reasons
            },
            "infrastructure_damage": {
                "score": damage_score,
                "max": SEVERITY_WEIGHTS["infrastructure_damage"],
                "reasons": damage_reasons
            },
            "duration": {
                "score": duration_score,
                "max": SEVERITY_WEIGHTS["duration_days"],
                "reason": duration_reason
            }
        }
    }
