from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, database, auth_utils

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=schemas.UserResponse, status_code=201)
def signup(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    """Naya Harvester Owner Register Karna"""
    existing = crud.get_user_by_username(db, user.username)
    if existing:
        raise HTTPException(status_code=400, detail="Ye username pehle se registered hai bhai, dusra try karo!")
    return crud.create_user(db, user)


@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(database.get_db)):
    """Login Karke Access Token Lena"""
    user = crud.get_user_by_username(db, credentials.username)
    if not user or not auth_utils.verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Username ya password galat hai!")

    token = auth_utils.create_access_token(data={"sub": user.username})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "display_name": user.display_name,
    }


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user=Depends(auth_utils.get_current_user)):
    """Login kiya hua user kaun hai, check karne ke liye"""
    return current_user