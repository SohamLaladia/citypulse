import os
import re
import uuid
import json
import aiofiles
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Header, status
from app.config import UPLOAD_DIR, CATEGORIES, CATEGORY_TO_DEPARTMENT
from app.database import get_db_connection
from app.auth import get_current_user, get_optional_user
from app.models import DisputeResolutionRequest, ComplaintAnalysisRequest, ComplaintAnalysisResponse
from app.ai.gemini_client import classify_complaint_multimodal, analyze_complaint_ai_connector
from app.services.severity_service import calculate_severity_score
from app.services.duplicate_service import find_potential_duplicates
from app.services.resolution_service import handle_citizen_resolution_feedback

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".svg", ".mp4", ".mp3", ".wav", ".m4a"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

def _extract_duration_days(text: str) -> int:
    text_lower = text.lower()
    word_to_num = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "week": 7}
    for word, val in word_to_num.items():
        if f"{word} day" in text_lower or f"{word} week" in text_lower:
            return val
    m = re.search(r"(\d+)\s*day", text_lower)
    if m:
        return int(m.group(1))
    return 1

@router.post("/analyze", response_model=ComplaintAnalysisResponse)
async def analyze_complaint_route(req: ComplaintAnalysisRequest):
    return await analyze_complaint_ai_connector(req.description, req.image_base64)

@router.post("", status_code=status.HTTP_201_CREATED)
async def submit_complaint(
    title: Optional[str] = Form(None),
    description: str = Form(...),
    category: Optional[str] = Form(None),
    priority: Optional[str] = Form(None),
    assigned_department: Optional[str] = Form(None),
    ai_summary: Optional[str] = Form(None),
    suggested_next_action: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    address: Optional[str] = Form(None),
    locality: Optional[str] = Form(None),
    ward: Optional[str] = Form(None),
    is_public: int = Form(1),
    images: List[UploadFile] = File(default=[]),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    current_user: dict = Depends(get_current_user)
):
    if len(description.strip()) < 3:
        raise HTTPException(status_code=400, detail="Description must be at least 3 characters.")

    conn = get_db_connection()
    cursor = conn.cursor()

    if idempotency_key:
        existing = cursor.execute(
            "SELECT * FROM complaints WHERE idempotency_key = ? AND user_id = ?",
            (idempotency_key, current_user["id"])
        ).fetchone()
        if existing:
            conn.close()
            ex = dict(existing)
            return {
                "id": ex["id"],
                "title": ex["title"],
                "category": ex["category"],
                "status": ex["status"],
                "severity": ex["severity"],
                "severity_score": ex["severity_score"],
                "severity_factors": json.loads(ex.get("severity_factors") or "{}"),
                "assigned_department": ex["assigned_department"],
                "ai_classification": json.loads(ex.get("ai_classification") or "{}"),
                "ai_status": ex.get("ai_status", "success"),
                "latitude": ex["latitude"],
                "longitude": ex["longitude"],
                "media_urls": json.loads(ex.get("media_urls") or "[]"),
                "potential_duplicates_count": 0,
                "potential_duplicates": [],
                "created_at": ex["created_at"],
                "idempotent_replay": True
            }

    saved_media_urls = []
    first_image_path = None

    for file in images:
        if file.filename:
            ext = os.path.splitext(file.filename)[1].lower()
            if ext not in ALLOWED_EXTENSIONS:
                conn.close()
                raise HTTPException(status_code=400, detail=f"Unsupported file format: {ext}")
            content = await file.read()
            if len(content) > MAX_FILE_SIZE_BYTES:
                conn.close()
                raise HTTPException(status_code=400, detail="File exceeds 10MB limit.")
            if len(content) == 0:
                conn.close()
                raise HTTPException(status_code=400, detail="Uploaded file is empty or corrupted.")

            unique_filename = f"{uuid.uuid4().hex[:12]}{ext}"
            file_path = UPLOAD_DIR / unique_filename
            async with aiofiles.open(file_path, 'wb') as out_file:
                await out_file.write(content)

            file_url = f"/uploads/{unique_filename}"
            saved_media_urls.append(file_url)
            if not first_image_path and ext in {".jpg", ".jpeg", ".png", ".webp"}:
                first_image_path = str(file_path)

    complaint_id = f"CP-2026-{uuid.uuid4().hex[:6].upper()}"
    now = datetime.now().isoformat()
    duration_days = _extract_duration_days(description)

    if category and category in CATEGORIES and priority in ["Low", "Medium", "High", "Critical"]:
        final_category = category
        final_department = assigned_department or CATEGORY_TO_DEPARTMENT.get(final_category, "Public Works & General Civic Administration")
        ai_result = {
            "primary_category": final_category,
            "category": final_category,
            "secondary_category": "Citizen-reviewed classification",
            "problem_description": ai_summary or description[:120],
            "extracted_entities": [locality] if locality else [],
            "potential_safety_concerns": [f"Citizen reviewed priority: {priority}"],
            "suggested_department": final_department,
            "suggested_severity": priority,
            "duration_days": duration_days,
            "confidence_score": 0.95,
            "missing_information": [] if (latitude is not None and longitude is not None) else ["GPS coordinates missing"],
            "suggested_next_action": suggested_next_action or f"Dispatch field technician from {final_department}."
        }
        ai_status = "success"
    else:
        try:
            ai_result = await classify_complaint_multimodal(description, first_image_path)
            ai_result["duration_days"] = duration_days
            ai_status = "success"
        except Exception:
            ai_result = {
                "primary_category": category or "Other civic issues",
                "secondary_category": "General civic issue",
                "problem_description": description[:100],
                "extracted_entities": [],
                "potential_safety_concerns": ["Moderate local disruption"],
                "suggested_department": "Public Works & General Civic Administration",
                "suggested_severity": priority or "Medium",
                "duration_days": duration_days,
                "confidence_score": 0.5,
                "missing_information": ["AI service temporarily unavailable; queued for manual review"],
                "suggested_next_action": "Administrative review required"
            }
            ai_status = "failed"

        final_category = category if (category and category in CATEGORIES) else ai_result.get("primary_category", "Other civic issues")
        final_department = assigned_department or CATEGORY_TO_DEPARTMENT.get(final_category, "Public Works & General Civic Administration")

    sev_calc = calculate_severity_score(
        category=final_category,
        description=description,
        safety_concerns=ai_result.get("potential_safety_concerns", []),
        upvotes=0,
        duration_days=duration_days
    )

    if priority in ["Low", "Medium", "High", "Critical"]:
        final_severity = priority
        score_map = {"Critical": 90.0, "High": 75.0, "Medium": 45.0, "Low": 20.0}
        severity_score = max(sev_calc["severity_score"], score_map.get(priority, 50.0))
    else:
        final_severity = sev_calc["severity_level"]
        severity_score = sev_calc["severity_score"]

    factor_breakdown = sev_calc["factor_breakdown"]

    has_coords = (latitude is not None and longitude is not None)
    initial_status = "submitted" if has_coords else "location_pending"

    final_title = title.strip() if (title and len(title.strip()) > 3) else f"{final_category.title()} near {locality or address or 'Reported Area'}"

    cursor.execute("""
    INSERT INTO complaints (
        id, user_id, title, description, category, subcategory,
        latitude, longitude, address, locality, ward,
        media_urls, status, severity, severity_score, severity_factors,
        assigned_department, upvotes_count, ai_classification, ai_status,
        is_public, idempotency_key, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)
    """, (
        complaint_id,
        current_user["id"],
        final_title,
        description,
        final_category,
        ai_result.get("secondary_category"),
        latitude,
        longitude,
        address or locality,
        locality,
        ward or "Ward 150",
        json.dumps(saved_media_urls),
        initial_status,
        final_severity,
        severity_score,
        json.dumps(factor_breakdown),
        final_department,
        json.dumps(ai_result),
        ai_status,
        is_public,
        idempotency_key,
        now,
        now
    ))

    cursor.execute("""
    INSERT INTO complaint_updates (id, complaint_id, actor_id, action, notes, status_from, status_to, created_at)
    VALUES (?, ?, ?, 'SUBMITTED', ?, NULL, ?, ?)
    """, (
        str(uuid.uuid4()),
        complaint_id,
        current_user["id"],
        "Complaint registered by citizen." if has_coords else "Complaint saved with location pending manual selection.",
        initial_status,
        now
    ))

    cursor.execute("""
    INSERT INTO notifications (id, user_id, complaint_id, title, message, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, 0, ?)
    """, (
        str(uuid.uuid4()),
        current_user["id"],
        complaint_id,
        f"Complaint {complaint_id} Registered",
        f"Your complaint '{final_title}' has been logged under {final_department}.",
        now
    ))

    conn.commit()
    conn.close()

    duplicates = []
    if has_coords:
        duplicates = find_potential_duplicates(
            complaint_id=complaint_id,
            lat=latitude,
            lon=longitude,
            category=final_category,
            description=description
        )

    return {
        "id": complaint_id,
        "title": final_title,
        "category": final_category,
        "status": initial_status,
        "severity": final_severity,
        "severity_score": severity_score,
        "severity_factors": factor_breakdown,
        "assigned_department": final_department,
        "ai_classification": ai_result,
        "ai_status": ai_status,
        "latitude": latitude,
        "longitude": longitude,
        "media_urls": saved_media_urls,
        "potential_duplicates_count": len(duplicates),
        "potential_duplicates": duplicates[:3],
        "created_at": now
    }

@router.get("")
def list_complaints(
    status: Optional[str] = None,
    category: Optional[str] = None,
    locality: Optional[str] = None,
    my_only: bool = False,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    conn = get_db_connection()
    query = """
    SELECT c.*, u.name as citizen_name
    FROM complaints c
    JOIN users u ON c.user_id = u.id
    WHERE 1=1
    """
    params = []

    if my_only:
        if not current_user:
            conn.close()
            raise HTTPException(status_code=401, detail="Authentication required.")
        query += " AND c.user_id = ?"
        params.append(current_user["id"])
    else:
        if not current_user or current_user.get("role") != "admin":
            if current_user:
                query += " AND (c.is_public = 1 OR c.user_id = ?)"
                params.append(current_user["id"])
            else:
                query += " AND c.is_public = 1"

    if status and status != "all":
        query += " AND c.status = ?"
        params.append(status)

    if category and category != "all":
        query += " AND c.category = ?"
        params.append(category)

    if locality and locality != "all":
        query += " AND LOWER(c.locality) LIKE LOWER(?)"
        params.append(f"%{locality}%")

    query += " ORDER BY c.created_at DESC LIMIT 100"
    rows = conn.execute(query, tuple(params)).fetchall()
    conn.close()

    result = []
    for r in rows:
        item = dict(r)
        item["media_urls"] = json.loads(item.get("media_urls") or "[]")
        item["ai_classification"] = json.loads(item.get("ai_classification") or "{}")
        item["severity_factors"] = json.loads(item.get("severity_factors") or "{}")
        result.append(item)
    return result

@router.get("/{complaint_id}")
def get_complaint_details(complaint_id: str, current_user: Optional[dict] = Depends(get_optional_user)):
    conn = get_db_connection()
    c = conn.execute("""
        SELECT c.*, u.name as citizen_name
        FROM complaints c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
    """, (complaint_id,)).fetchone()

    if not c:
        conn.close()
        raise HTTPException(status_code=404, detail="Complaint not found.")

    complaint_dict = dict(c)

    if complaint_dict.get("is_public") == 0:
        if not current_user or (current_user["id"] != complaint_dict["user_id"] and current_user.get("role") != "admin"):
            conn.close()
            raise HTTPException(status_code=403, detail="Unauthorized access to private complaint record.")

    complaint_dict["media_urls"] = json.loads(complaint_dict.get("media_urls") or "[]")
    complaint_dict["ai_classification"] = json.loads(complaint_dict.get("ai_classification") or "{}")
    complaint_dict["severity_factors"] = json.loads(complaint_dict.get("severity_factors") or "{}")

    updates = conn.execute("""
        SELECT cu.*, u.name as actor_name, u.role as actor_role
        FROM complaint_updates cu
        LEFT JOIN users u ON cu.actor_id = u.id
        WHERE cu.complaint_id = ?
        ORDER BY cu.created_at ASC
    """, (complaint_id,)).fetchall()
    complaint_dict["timeline"] = [dict(u) for u in updates]

    evidence = conn.execute("""
        SELECT * FROM resolution_evidence WHERE complaint_id = ? ORDER BY created_at DESC LIMIT 1
    """, (complaint_id,)).fetchone()

    if evidence:
        ev_dict = dict(evidence)
        ev_dict["ai_verification"] = json.loads(ev_dict.get("ai_verification") or "{}")
        complaint_dict["resolution_evidence"] = ev_dict
    else:
        complaint_dict["resolution_evidence"] = None

    user_supported = False
    if current_user:
        up = conn.execute("SELECT id FROM complaint_supports WHERE complaint_id = ? AND user_id = ?", (complaint_id, current_user["id"])).fetchone()
        user_supported = bool(up)
    complaint_dict["user_supported"] = user_supported

    conn.close()
    return complaint_dict

@router.post("/{complaint_id}/support")
def support_complaint(complaint_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()

    c = cursor.execute("SELECT id, upvotes_count FROM complaints WHERE id = ?", (complaint_id,)).fetchone()
    if not c:
        conn.close()
        raise HTTPException(status_code=404, detail="Complaint not found.")

    existing = cursor.execute("SELECT id FROM complaint_supports WHERE complaint_id = ? AND user_id = ?", (complaint_id, current_user["id"])).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="You have already supported this complaint.")

    now = datetime.now().isoformat()
    cursor.execute("""
    INSERT INTO complaint_supports (id, complaint_id, user_id, created_at)
    VALUES (?, ?, ?, ?)
    """, (str(uuid.uuid4()), complaint_id, current_user["id"], now))

    new_count = c["upvotes_count"] + 1
    cursor.execute("UPDATE complaints SET upvotes_count = ? WHERE id = ?", (new_count, complaint_id))

    conn.commit()
    conn.close()

    return {"message": "Complaint endorsed successfully", "upvotes_count": new_count}

@router.post("/{complaint_id}/dispute")
def dispute_or_confirm(complaint_id: str, req: DisputeResolutionRequest, current_user: dict = Depends(get_current_user)):
    try:
        res = handle_citizen_resolution_feedback(
            complaint_id=complaint_id,
            user_id=current_user["id"],
            confirmed=req.confirmed,
            dispute_reason=req.dispute_reason
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.get("/{complaint_id}/duplicates")
def get_duplicates_for_complaint(complaint_id: str):
    conn = get_db_connection()
    c = conn.execute("SELECT id, latitude, longitude, category, description FROM complaints WHERE id = ?", (complaint_id,)).fetchone()
    conn.close()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found.")
    if c["latitude"] is None or c["longitude"] is None:
        return {"complaint_id": complaint_id, "duplicates": []}

    dups = find_potential_duplicates(
        complaint_id=complaint_id,
        lat=c["latitude"],
        lon=c["longitude"],
        category=c["category"],
        description=c["description"]
    )
    return {"complaint_id": complaint_id, "duplicates": dups}
