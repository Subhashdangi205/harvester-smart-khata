from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, database, models, auth_utils
from ..models import Farmer

router = APIRouter(
    prefix="/katai",
    tags=["Katai logs (Khet Entries)"]
)

@router.post("/", response_model=schemas.KataiLogResponse, status_code=201)
def add_katai_entry(
    katai: schemas.KataiLogCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """Khet ki katai ki entry karne ki API (Math calculation backend khud karega)"""

    # 1. Farmer check — aur ye confirm karo ki farmer isi owner ka hai
    db_farmer = db.query(Farmer).filter(Farmer.id == katai.farmer_id).first()
    if not db_farmer:
        raise HTTPException(status_code=404, detail="Yeh kisan database mein nahi mila bhai!")

    if current_user.role != "superadmin" and db_farmer.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ye kisan tumhare khata ka nahi hai!")

    return crud.create_katai_log(db=db, katai=katai)