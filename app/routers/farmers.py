from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import crud, schemas, database, models, auth_utils

router = APIRouter(
    prefix="/farmers",
    tags=["Farmers Management"]
)

@router.post("/", response_model=schemas.FarmerResponse, status_code=201)
def add_new_farmer(
    farmer: schemas.FarmerCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """1. Naya Kisan Register Karne Ki API (sirf apne khata mein)"""
    db_farmer = crud.get_farmer_by_phone(db, phone_number=farmer.phone_number, owner_id=current_user.id)
    if db_farmer:
        raise HTTPException(status_code=400, detail="Yeh mobile number pehle se register hai bhai!")

    return crud.create_farmer(db=db, farmer=farmer, owner_id=current_user.id)


@router.get("/search", response_model=List[schemas.FarmerResponse])
def search_farmers(
    name: Optional[str] = Query(None, description="Kisan ka naam search karne ke liye query"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """2. Smart Search API: sirf logged-in owner ke apne farmers dikhega
       (Superadmin ke liye sabke farmers alag route se milenge: /farmers/all)"""
    if current_user.role == "superadmin":
        if not name or not name.strip():
            return crud.get_all_farmers(db=db)
        return crud.search_farmers_by_name(db=db, name_query=name.strip())

    return crud.get_farmers_by_owner(db=db, owner_id=current_user.id, name_query=name)


@router.get("/all", response_model=List[schemas.FarmerResponse])
def get_all_farmers_admin(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """3. SIRF SUPERADMIN: Sabhi harvesters ke saare farmers ek saath"""
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Ye sirf super admin ke liye hai bhai!")
    return crud.get_all_farmers(db=db)