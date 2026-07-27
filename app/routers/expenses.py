from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, database, models, auth_utils

router = APIRouter(
    prefix="/expenses",
    tags=["Expenses & Owner Analytics"]
)

@router.post("/", response_model=schemas.ExpenseResponse, status_code=201)
def add_new_expense(
    expense: schemas.ExpenseCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """1. Diesel ya Maintenance ka kharcha register karne ki API (apne khata mein)"""
    return crud.create_expense(db=db, expense=expense, owner_id=current_user.id)


@router.get("/", response_model=List[schemas.ExpenseResponse])
def list_expenses(
    year: int = Query(2026, description="Jis saal ke expenses chahiye"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """2. Saal ke hisaab se saare expenses ki list (apne khata ke)"""
    owner_filter = None if current_user.role == "superadmin" else current_user.id
    return crud.get_expenses_by_year(db=db, year=year, owner_id=owner_filter)


@router.get("/profit-analysis", response_model=schemas.ProfitAnalysisResponse)
def get_season_profit(
    year: int = Query(2026, description="Jis saal ka munafa dekhna ho"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """3. Owner Dashboard API: apne season ka total kharcha aur net profit"""
    owner_filter = None if current_user.role == "superadmin" else current_user.id
    result = crud.get_profit_analysis(db=db, year=year, owner_id=owner_filter)
    result["owner_username"] = current_user.username
    return result


@router.get("/all-harvesters-summary", response_model=List[schemas.OwnerSummary])
def all_harvesters_summary(
    year: int = Query(2026),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """4. SIRF SUPERADMIN: Sabhi harvester owners ka kamai/kharcha summary"""
    if current_user.role != "superadmin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Ye sirf super admin ke liye hai bhai!")
    return crud.get_all_owners_summary(db=db, year=year)