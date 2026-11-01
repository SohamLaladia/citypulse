import sqlite3
import math
import json
import uuid
from app.config import DATABASE_PATH, BASE_DIR

def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance in kilometers between two points
    on the earth (specified in decimal degrees).
    """
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 999999.0
    try:
        lat1, lon1, lat2, lon2 = float(lat1), float(lon1), float(lat2), float(lon2)
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2) ** 2)
        c = 2 * math.asin(math.sqrt(a))
        r = 6371.0
        return c * r
    except Exception:
        return 999999.0

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.create_function("haversine", 4, haversine)
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'citizen',
        phone TEXT,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS complaints (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        subcategory TEXT,
        latitude REAL,
        longitude REAL,
        address TEXT,
        locality TEXT,
        ward TEXT,
        media_urls TEXT,
        status TEXT NOT NULL DEFAULT 'submitted',
        severity TEXT NOT NULL DEFAULT 'Medium',
        severity_score REAL DEFAULT 50.0,
        severity_factors TEXT,
        assigned_department TEXT,
        incident_id TEXT,
        upvotes_count INTEGER DEFAULT 0,
        ai_classification TEXT,
        ai_status TEXT DEFAULT 'pending',
        is_public INTEGER DEFAULT 1,
        idempotency_key TEXT UNIQUE,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)

    existing_cols = [r["name"] for r in cursor.execute("PRAGMA table_info(complaints);").fetchall()]
    if "idempotency_key" not in existing_cols:
        cursor.execute("ALTER TABLE complaints ADD COLUMN idempotency_key TEXT;")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        locality TEXT,
        ward TEXT,
        status TEXT NOT NULL DEFAULT 'submitted',
        severity TEXT NOT NULL DEFAULT 'Medium',
        assigned_department TEXT,
        primary_complaint_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS complaint_updates (
        id TEXT PRIMARY KEY,
        complaint_id TEXT NOT NULL,
        actor_id TEXT NOT NULL,
        action TEXT NOT NULL,
        notes TEXT,
        status_from TEXT,
        status_to TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (complaint_id) REFERENCES complaints(id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS complaint_supports (
        id TEXT PRIMARY KEY,
        complaint_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(complaint_id, user_id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS resolution_evidence (
        id TEXT PRIMARY KEY,
        complaint_id TEXT NOT NULL,
        uploaded_by TEXT NOT NULL,
        image_url TEXT NOT NULL,
        notes TEXT,
        ai_verification TEXT,
        citizen_confirmed INTEGER,
        dispute_reason TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (complaint_id) REFERENCES complaints(id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        details TEXT,
        timestamp TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        complaint_id TEXT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_complaints_lat_lon ON complaints(latitude, longitude);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_complaints_user ON complaints(user_id);")
    cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_complaints_idempotency ON complaints(idempotency_key) WHERE idempotency_key IS NOT NULL;")

    conn.commit()
    conn.close()

def seed_default_data():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Seed demo users if empty
    user_count = cursor.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    if user_count == 0:
        from app.auth import hash_password
        now = "2026-10-31T10:00:00"
        cursor.execute("""
            INSERT OR IGNORE INTO users (id, name, email, password_hash, role, phone, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            "USR-CITIZEN-01",
            "Aarav Sharma",
            "citizen@citypulse.org",
            hash_password("Password123!"),
            "citizen",
            "+91 98450 12345",
            now
        ))
        cursor.execute("""
            INSERT OR IGNORE INTO users (id, name, email, password_hash, role, phone, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            "USR-ADMIN-01",
            "Er. Rajesh Verma",
            "admin@citypulse.org",
            hash_password("AdminPass123!"),
            "admin",
            "+91 98450 99999",
            now
        ))
        conn.commit()

    # 2. Seed complaints if empty
    complaint_count = cursor.execute("SELECT COUNT(*) FROM complaints").fetchone()[0]
    if complaint_count == 0:
        sample_file = BASE_DIR / "js" / "sample_complaints.json"
        if sample_file.exists():
            complaints = json.loads(sample_file.read_text(encoding="utf-8"))
            for item in complaints:
                cid = item.get("id")
                cursor.execute("""
                    INSERT OR IGNORE INTO complaints (
                        id, user_id, title, description, category, subcategory,
                        latitude, longitude, address, locality, ward,
                        media_urls, status, severity, severity_score, severity_factors,
                        assigned_department, upvotes_count, ai_classification, ai_status,
                        is_public, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
                """, (
                    cid,
                    "USR-CITIZEN-01",
                    item.get("title", "Civic Grievance"),
                    item.get("description", ""),
                    item.get("category", "Other civic issues"),
                    item.get("subcategory", "Citizen reported issue"),
                    item.get("lat"),
                    item.get("lon"),
                    item.get("address", item.get("locality", "Bengaluru")),
                    item.get("locality", "Bengaluru"),
                    item.get("ward", "Ward 150"),
                    json.dumps(item.get("media_urls", [])),
                    item.get("status", "submitted"),
                    item.get("severity", "Medium"),
                    float(item.get("severity_score", 50.0)),
                    json.dumps(item.get("severity_factors", {"safety_risk": 30, "affected_people": 20, "infrastructure_damage": 15, "duration_days": 10})),
                    item.get("assigned_department", "Public Works & General Civic Administration"),
                    int(item.get("upvotes_count", 0)),
                    json.dumps(item.get("ai_analysis", {})),
                    "success",
                    item.get("created_at", "2026-10-31T10:00:00"),
                    item.get("updated_at", "2026-10-31T10:00:00")
                ))

                for t in item.get("timeline", []):
                    cursor.execute("""
                        INSERT INTO complaint_updates (id, complaint_id, actor_id, action, notes, status_from, status_to, created_at)
                        VALUES (?, ?, ?, ?, ?, NULL, ?, ?)
                    """, (
                        str(uuid.uuid4()),
                        cid,
                        "USR-ADMIN-01" if ("Officer" in t.get("actor", "") or "Admin" in t.get("actor", "")) else "USR-CITIZEN-01",
                        t.get("title", "UPDATE"),
                        t.get("desc", ""),
                        item.get("status", "submitted"),
                        item.get("created_at", "2026-10-31T10:00:00")
                    ))

                if item.get("resolved_photo"):
                    cursor.execute("""
                        INSERT INTO resolution_evidence (id, complaint_id, uploaded_by, image_url, notes, ai_verification, citizen_confirmed, created_at)
                        VALUES (?, ?, 'USR-ADMIN-01', ?, ?, ?, ?, ?)
                    """, (
                        str(uuid.uuid4()),
                        cid,
                        item.get("resolved_photo"),
                        "Field crew repair completed and photo evidence verified.",
                        json.dumps({"issue_resolved": True, "confidence_score": 0.94, "change_summary": "Visual repair confirmed."}),
                        1 if item.get("status") == "resolved" else 0,
                        item.get("updated_at", "2026-10-31T12:00:00")
                    ))
            conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
