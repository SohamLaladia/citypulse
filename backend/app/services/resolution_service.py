import uuid
import json
from datetime import datetime
from app.database import get_db_connection
from app.ai.gemini_client import verify_resolution_images

async def submit_resolution_evidence(complaint_id: str, admin_id: str, after_image_url: str, notes: str = ""):
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()

    complaint = cursor.execute("SELECT * FROM complaints WHERE id = ?", (complaint_id,)).fetchone()
    if not complaint:
        conn.close()
        raise ValueError(f"Complaint {complaint_id} not found.")

    c_dict = dict(complaint)
    original_media = json.loads(c_dict.get("media_urls") or "[]")
    original_image = original_media[0] if original_media else None

    # Run AI Vision Verification
    ai_report = await verify_resolution_images(original_image, after_image_url, notes)

    evidence_id = str(uuid.uuid4())
    cursor.execute("""
    INSERT INTO resolution_evidence (id, complaint_id, uploaded_by, image_url, notes, ai_verification, citizen_confirmed, created_at)
    VALUES (?, ?, ?, ?, ?, ?, NULL, ?)
    """, (evidence_id, complaint_id, admin_id, after_image_url, notes, json.dumps(ai_report), now))

    # Update complaint status to resolution_pending
    cursor.execute("""
    UPDATE complaints SET status = 'resolution_pending', updated_at = ? WHERE id = ?
    """, (now, complaint_id))

    cursor.execute("""
    INSERT INTO complaint_updates (id, complaint_id, actor_id, action, notes, status_from, status_to, created_at)
    VALUES (?, ?, ?, 'RESOLUTION_EVIDENCE_SUBMITTED', ?, ?, 'resolution_pending', ?)
    """, (str(uuid.uuid4()), complaint_id, admin_id, f"Work completion proof uploaded: {notes}", c_dict["status"], now))

    conn.commit()
    conn.close()

    return {
        "evidence_id": evidence_id,
        "complaint_id": complaint_id,
        "status": "resolution_pending",
        "ai_verification": ai_report
    }

def handle_citizen_resolution_feedback(complaint_id: str, user_id: str, confirmed: bool, dispute_reason: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()

    complaint = cursor.execute("SELECT * FROM complaints WHERE id = ?", (complaint_id,)).fetchone()
    if not complaint:
        conn.close()
        raise ValueError(f"Complaint {complaint_id} not found.")

    c_dict = dict(complaint)
    # Check that current user owns this complaint or is admin
    if c_dict["user_id"] != user_id:
        conn.close()
        raise PermissionError("Only the reporting citizen can confirm or dispute this resolution.")

    new_status = "resolved" if confirmed else "disputed"
    action = "CITIZEN_CONFIRMED_RESOLUTION" if confirmed else "CITIZEN_DISPUTED_RESOLUTION"
    notes = "Citizen verified that work is satisfactory." if confirmed else f"Citizen disputed resolution: {dispute_reason}"

    cursor.execute("""
    UPDATE resolution_evidence
    SET citizen_confirmed = ?, dispute_reason = ?
    WHERE id = (
        SELECT id FROM resolution_evidence WHERE complaint_id = ? ORDER BY created_at DESC LIMIT 1
    )
    """, (1 if confirmed else 0, dispute_reason, complaint_id))

    cursor.execute("""
    UPDATE complaints SET status = ?, updated_at = ? WHERE id = ?
    """, (new_status, now, complaint_id))

    cursor.execute("""
    INSERT INTO complaint_updates (id, complaint_id, actor_id, action, notes, status_from, status_to, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (str(uuid.uuid4()), complaint_id, user_id, action, notes, c_dict["status"], new_status, now))

    conn.commit()
    conn.close()

    return {
        "complaint_id": complaint_id,
        "status": new_status,
        "citizen_confirmed": confirmed,
        "dispute_reason": dispute_reason
    }
