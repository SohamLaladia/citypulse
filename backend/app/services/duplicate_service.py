import json
import uuid
from datetime import datetime
from app.config import DUPLICATE_RADIUS_METERS, DUPLICATE_SIMILARITY_THRESHOLD
from app.database import get_db_connection

def compute_text_similarity(text1: str, text2: str) -> float:
    """
    Computes token-level Jaccard similarity with n-gram overlap
    between two complaint descriptions.
    """
    if not text1 or not text2:
        return 0.0
    
    stop_words = {"the", "a", "an", "is", "in", "at", "of", "on", "and", "to", "for", "near", "there", "has", "been", "our", "my", "road", "area"}
    tokens1 = set([w.lower().strip(".,;:?!()") for w in text1.split() if w.lower() not in stop_words and len(w) > 2])
    tokens2 = set([w.lower().strip(".,;:?!()") for w in text2.split() if w.lower() not in stop_words and len(w) > 2])
    
    if not tokens1 or not tokens2:
        return 0.0
    
    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    jaccard = len(intersection) / len(union) if union else 0.0
    
    # Check for direct phrase matches
    phrase_boost = 0.2 if any(len(w) > 4 and w in text2.lower() for w in tokens1) else 0.0
    return min(1.0, jaccard + phrase_boost)

def find_potential_duplicates(complaint_id: str, lat: float, lon: float, category: str, description: str, radius_meters: float = DUPLICATE_RADIUS_METERS):
    """
    Finds potential duplicate complaints within geographic radius and semantic similarity.
    """
    radius_km = radius_meters / 1000.0
    conn = get_db_connection()
    
    # Query complaints within radius_km
    # SQLite has custom haversine function registered
    query = """
    SELECT id, title, description, category, latitude, longitude, address, locality, status, severity, created_at,
           haversine(latitude, longitude, ?, ?) AS distance_km
    FROM complaints
    WHERE id != ? AND status NOT IN ('resolved', 'rejected')
    AND haversine(latitude, longitude, ?, ?) <= ?
    ORDER BY distance_km ASC
    LIMIT 20
    """
    rows = conn.execute(query, (lat, lon, complaint_id, lat, lon, radius_km)).fetchall()
    conn.close()

    potential_duplicates = []
    for r in rows:
        row_dict = dict(r)
        distance_meters = round(row_dict["distance_km"] * 1000.0, 1)
        
        # Category similarity
        cat_match = 1.0 if row_dict["category"].lower() == category.lower() else 0.2
        
        # Description similarity
        desc_sim = compute_text_similarity(description, row_dict["description"])
        
        # Distance score: closer means higher score (1.0 at 0m, decaying to 0.1 at radius)
        dist_score = max(0.0, 1.0 - (distance_meters / radius_meters))
        
        # Combined score: weighted by distance (40%), category (30%), description (30%)
        combined_score = round((dist_score * 0.40) + (cat_match * 0.30) + (desc_sim * 0.30), 2)
        
        if combined_score >= 0.45 or (distance_meters < 100 and cat_match == 1.0):
            row_dict["distance_meters"] = distance_meters
            row_dict["similarity_score"] = combined_score
            row_dict["text_similarity"] = round(desc_sim, 2)
            potential_duplicates.append(row_dict)

    potential_duplicates.sort(key=lambda x: x["similarity_score"], reverse=True)
    return potential_duplicates

def merge_duplicates_into_incident(parent_id: str, duplicate_ids: list, admin_id: str, notes: str = ""):
    """
    Merges duplicate complaints under a common incident while preserving
    individual citizen complaints and their ownership.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()

    # Get parent complaint
    parent = cursor.execute("SELECT * FROM complaints WHERE id = ?", (parent_id,)).fetchone()
    if not parent:
        conn.close()
        raise ValueError(f"Parent complaint {parent_id} not found.")

    parent_dict = dict(parent)
    incident_id = parent_dict.get("incident_id")
    
    if not incident_id:
        incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
        cursor.execute("""
        INSERT INTO incidents (id, title, category, latitude, longitude, locality, ward, status, severity, assigned_department, primary_complaint_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            incident_id,
            parent_dict["title"],
            parent_dict["category"],
            parent_dict["latitude"],
            parent_dict["longitude"],
            parent_dict.get("locality"),
            parent_dict.get("ward"),
            parent_dict["status"],
            parent_dict["severity"],
            parent_dict.get("assigned_department"),
            parent_id,
            now,
            now
        ))
        
        # Link parent
        cursor.execute("UPDATE complaints SET incident_id = ? WHERE id = ?", (incident_id, parent_id))

    # Link each duplicate complaint
    all_merged = []
    for dup_id in duplicate_ids:
        dup = cursor.execute("SELECT id, user_id FROM complaints WHERE id = ?", (dup_id,)).fetchone()
        if dup:
            cursor.execute("UPDATE complaints SET incident_id = ?, status = 'merged' WHERE id = ?", (incident_id, dup_id))
            cursor.execute("""
            INSERT INTO complaint_updates (id, complaint_id, actor_id, action, notes, status_from, status_to, created_at)
            VALUES (?, ?, ?, 'MERGED_INTO_INCIDENT', ?, 'submitted', 'merged', ?)
            """, (str(uuid.uuid4()), dup_id, admin_id, f"Merged into common Incident {incident_id}. {notes}", now))
            all_merged.append(dup_id)

    # Record audit log
    cursor.execute("""
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, timestamp)
    VALUES (?, ?, 'MERGE_DUPLICATES', 'incident', ?, ?, ?)
    """, (str(uuid.uuid4()), admin_id, incident_id, json.dumps({"parent": parent_id, "merged_duplicates": all_merged, "notes": notes}), now))

    conn.commit()
    conn.close()

    return {
        "incident_id": incident_id,
        "parent_complaint_id": parent_id,
        "merged_complaints": all_merged,
        "status": "success"
    }
