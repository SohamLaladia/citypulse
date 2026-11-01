import os
import uuid
import json
import aiofiles
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from app.config import UPLOAD_DIR
from app.database import get_db_connection
from app.auth import get_current_admin
from app.models import ComplaintStatusUpdateRequest, SeverityOverrideRequest, DuplicateMergeRequest
from app.services.duplicate_service import merge_duplicates_into_incident
from app.services.resolution_service import submit_resolution_evidence
from app.ai.triage_agent import AutonomousTriageAgent

router = APIRouter(prefix="/api/admin", tags=["Administrator Dashboard"])

@router.get("/complaints")
def admin_list_complaints(
    status: Optional[str] = None,
    category: Optional[str] = None,
    severity: Optional[str] = None,
    current_admin: dict = Depends(get_current_admin)
):
    conn = get_db_connection()
    query = """
    SELECT c.*, u.name as citizen_name, u.email as citizen_email, u.phone as citizen_phone
    FROM complaints c
    JOIN users u ON c.user_id = u.id
    WHERE 1=1
    """
    params = []
    if status and status != "all":
        query += " AND c.status = ?"
        params.append(status)
    if category and category != "all":
        query += " AND c.category = ?"
        params.append(category)
    if severity and severity != "all":
        query += " AND c.severity = ?"
        params.append(severity)

    query += " ORDER BY c.severity_score DESC, c.created_at DESC"
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

@router.post("/complaints/{complaint_id}/status")
def update_complaint_status(
    complaint_id: str,
    req: ComplaintStatusUpdateRequest,
    current_admin: dict = Depends(get_current_admin)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()

    c = cursor.execute("SELECT * FROM complaints WHERE id = ?", (complaint_id,)).fetchone()
    if not c:
        conn.close()
        raise HTTPException(status_code=404, detail="Complaint not found.")

    c_dict = dict(c)
    old_status = c_dict["status"]
    new_dept = req.assigned_department or c_dict["assigned_department"]

    cursor.execute("""
    UPDATE complaints
    SET status = ?, assigned_department = ?, updated_at = ?
    WHERE id = ?
    """, (req.status, new_dept, now, complaint_id))

    cursor.execute("""
    INSERT INTO complaint_updates (id, complaint_id, actor_id, action, notes, status_from, status_to, created_at)
    VALUES (?, ?, ?, 'STATUS_UPDATE', ?, ?, ?, ?)
    """, (str(uuid.uuid4()), complaint_id, current_admin["id"], req.notes or f"Status changed to {req.status}", old_status, req.status, now))

    cursor.execute("""
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, timestamp)
    VALUES (?, ?, 'UPDATE_STATUS', 'complaint', ?, ?, ?)
    """, (str(uuid.uuid4()), current_admin["id"], complaint_id, json.dumps({"from": old_status, "to": req.status, "dept": new_dept, "notes": req.notes}), now))

    conn.commit()
    conn.close()

    return {"message": "Status updated successfully", "complaint_id": complaint_id, "new_status": req.status}

@router.post("/complaints/{complaint_id}/override-severity")
def override_severity(
    complaint_id: str,
    req: SeverityOverrideRequest,
    current_admin: dict = Depends(get_current_admin)
):
    if req.severity not in ["Low", "Medium", "High", "Critical"]:
        raise HTTPException(status_code=400, detail="Invalid severity level.")
    if len(req.reason.strip()) < 5:
        raise HTTPException(status_code=400, detail="A valid explanation reason is required for audit logs.")

    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()

    c = cursor.execute("SELECT severity, severity_factors FROM complaints WHERE id = ?", (complaint_id,)).fetchone()
    if not c:
        conn.close()
        raise HTTPException(status_code=404, detail="Complaint not found.")

    old_severity = c["severity"]
    factors = json.loads(c["severity_factors"] or "{}")
    factors["manual_override"] = {
        "overridden_by": current_admin["name"],
        "reason": req.reason,
        "timestamp": now,
        "previous_severity": old_severity
    }

    # Recalculate score mapped to severity
    score_map = {"Critical": 90.0, "High": 70.0, "Medium": 50.0, "Low": 25.0}
    new_score = score_map.get(req.severity, 50.0)

    cursor.execute("""
    UPDATE complaints
    SET severity = ?, severity_score = ?, severity_factors = ?, updated_at = ?
    WHERE id = ?
    """, (req.severity, new_score, json.dumps(factors), now, complaint_id))

    cursor.execute("""
    INSERT INTO complaint_updates (id, complaint_id, actor_id, action, notes, status_from, status_to, created_at)
    VALUES (?, ?, ?, 'SEVERITY_OVERRIDDEN', ?, NULL, NULL, ?)
    """, (str(uuid.uuid4()), complaint_id, current_admin["id"], f"Severity adjusted from {old_severity} to {req.severity}. Reason: {req.reason}", now))

    cursor.execute("""
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, timestamp)
    VALUES (?, ?, 'OVERRIDE_SEVERITY', 'complaint', ?, ?, ?)
    """, (str(uuid.uuid4()), current_admin["id"], complaint_id, json.dumps({"old_severity": old_severity, "new_severity": req.severity, "reason": req.reason}), now))

    conn.commit()
    conn.close()

    return {"message": "Severity overridden successfully", "new_severity": req.severity, "score": new_score}

@router.post("/incidents/merge")
def merge_duplicates(req: DuplicateMergeRequest, current_admin: dict = Depends(get_current_admin)):
    try:
        res = merge_duplicates_into_incident(
            parent_id=req.parent_complaint_id,
            duplicate_ids=req.duplicate_complaint_ids,
            admin_id=current_admin["id"],
            notes=req.notes or ""
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/complaints/{complaint_id}/resolve")
async def resolve_with_photo(
    complaint_id: str,
    notes: Optional[str] = Form(""),
    resolution_photo: UploadFile = File(...),
    current_admin: dict = Depends(get_current_admin)
):
    if not resolution_photo.filename:
        raise HTTPException(status_code=400, detail="Resolution proof photograph is required.")

    ext = os.path.splitext(resolution_photo.filename)[1].lower()
    unique_name = f"resolved_{uuid.uuid4().hex[:12]}{ext}"
    dest_path = UPLOAD_DIR / unique_name

    async with aiofiles.open(dest_path, 'wb') as f:
        content = await resolution_photo.read()
        await f.write(content)

    photo_url = f"/uploads/{unique_name}"
    
    try:
        res = await submit_resolution_evidence(
            complaint_id=complaint_id,
            admin_id=current_admin["id"],
            after_image_url=photo_url,
            notes=notes or ""
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/complaints/{complaint_id}/triage")
async def trigger_autonomous_triage(complaint_id: str, current_admin: dict = Depends(get_current_admin)):
    conn = get_db_connection()
    c = conn.execute("SELECT * FROM complaints WHERE id = ?", (complaint_id,)).fetchone()
    conn.close()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    c_dict = dict(c)
    media = json.loads(c_dict.get("media_urls") or "[]")
    first_image = media[0] if media else None

    # Run Autonomous Triage Agent loop
    agent = AutonomousTriageAgent(
        complaint_id=complaint_id,
        text=c_dict["description"],
        lat=c_dict["latitude"],
        lon=c_dict["longitude"],
        image_path=str(UPLOAD_DIR / os.path.basename(first_image)) if first_image else None
    )
    triage_result = await agent.run()
    return triage_result

@router.get("/audit-logs")
def get_audit_logs(current_admin: dict = Depends(get_current_admin)):
    conn = get_db_connection()
    logs = conn.execute("""
        SELECT a.*, u.name as admin_name
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.timestamp DESC
        LIMIT 100
    """).fetchall()
    conn.close()
    
    result = []
    for l in logs:
        item = dict(l)
        item["details"] = json.loads(item.get("details") or "{}")
        result.append(item)
    return result
