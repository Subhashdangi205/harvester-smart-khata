from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import crud, schemas, database

# Router initialize kar rahe hain
router = APIRouter(
    prefix="/farmers",
    tags=["Farmers Management"]
)

@router.post("/", response_model=schemas.FarmerResponse, status_code=201)
def add_new_farmer(farmer: schemas.FarmerCreate, db: Session = Depends(database.get_db)):
    """1. Naya Kisan Register Karne Ki API"""
    # Check karenge ki yeh phone number pehle se toh register nahi hai
    db_farmer = crud.get_farmer_by_phone(db, phone_number=farmer.phone_number)
    if db_farmer:
        raise HTTPException(status_code=400, detail="Yeh mobile number pehle se register hai bhai!")
    
    return crud.create_farmer(db=db, farmer=farmer)


@router.get("/search", response_model=List[schemas.FarmerResponse])
def search_farmers(
    name: Optional[str] = Query(None, description="Kisan ka naam search karne ke liye query"), 
    db: Session = Depends(database.get_db)
):
    """2. Smart Search API: Naam blank ho toh saari list, aur query ho toh filtered list dikhana"""
    # Agar search query nahi di ya empty string di hai, toh saare farmers return honge
    if not name or not name.strip():
        return crud.get_all_farmers(db=db) if hasattr(crud, 'get_all_farmers') else db.query(database.models.Farmer if hasattr(database, 'models') else crud.models.Farmer).all()
        
    farmers = crud.search_farmers_by_name(db=db, name_query=name.strip())
    # 404 throw karne ke bajaye empty list return karenge taaki React frontend crash na ho
    return farmers if farmers else []