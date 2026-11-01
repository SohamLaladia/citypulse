import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status
from app.database import get_db_connection
from app.models import UserRegisterRequest, UserLoginRequest, TokenResponse
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register_user(req: UserRegisterRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if email exists
    existing = cursor.execute("SELECT id FROM users WHERE email = ?", (req.email,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now().isoformat()
    pwd_hash = hash_password(req.password)
    role = req.role if req.role in ["citizen", "admin"] else "citizen"

    cursor.execute("""
    INSERT INTO users (id, name, email, password_hash, role, phone, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (user_id, req.name, req.email, pwd_hash, role, req.phone, now))
    conn.commit()
    conn.close()

    token = create_access_token(user_id=user_id, role=role, email=req.email, name=req.name)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": req.name,
            "email": req.email,
            "role": role,
            "phone": req.phone
        }
    }

@router.post("/login", response_model=TokenResponse)
def login_user(req: UserLoginRequest):
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (req.email,)).fetchone()
    conn.close()

    if not user or not verify_password(user["password_hash"], req.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    user_dict = dict(user)
    token = create_access_token(
        user_id=user_dict["id"],
        role=user_dict["role"],
        email=user_dict["email"],
        name=user_dict["name"]
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_dict["id"],
            "name": user_dict["name"],
            "email": user_dict["email"],
            "role": user_dict["role"],
            "phone": user_dict.get("phone")
        }
    }

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {"user": current_user}
