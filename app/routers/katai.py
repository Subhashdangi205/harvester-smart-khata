from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, database
from ..models import Farmer

router = APIRouter(
    prefix="/katai",
    tags=["Katai logs (Khet Entries)"]
)

@router.post("/", response_model=schemas.KataiLogResponse, status_code=201)
def add_katai_entry(katai: schemas.KataiLogCreate, db: Session = Depends(database.get_db)):
    """Khet ki katai ki entry karne ki API (Math calculation backend khud karega)"""
    
    # 1. Pehle check karenge ki kisan database mein exist karta hai ya nahi
    db_farmer = db.query(Farmer).filter(Farmer.id == katai.farmer_id).first()
    if not db_farmer:
        raise HTTPException(status_code=404, detail="Yeh kisan database mein nahi mila bhai!")
        
    # 2. Agar kisan mil gaya, toh entry save karo aur calculation run karo
    return crud.create_katai_log(db=db, katai=katai)