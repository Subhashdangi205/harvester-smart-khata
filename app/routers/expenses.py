from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, database

router = APIRouter(
    prefix="/expenses",
    tags=["Expenses & Owner Analytics"]
)

@router.post("/", response_model=schemas.ExpenseResponse, status_code=201)
def add_new_expense(expense: schemas.ExpenseCreate, db: Session = Depends(database.get_db)):
    """1. Diesel ya Maintenance ka kharcha register karne ki API"""
    return crud.create_expense(db=db, expense=expense)


@router.get("/", response_model=List[schemas.ExpenseResponse])
def list_expenses(year: int = Query(2026, description="Jis saal ke expenses chahiye"), db: Session = Depends(database.get_db)):
    """2. Saal ke hisaab se saare expenses ki list (Excel download ke liye)"""
    return crud.get_expenses_by_year(db=db, year=year)


@router.get("/profit-analysis", response_model=schemas.ProfitAnalysisResponse)
def get_season_profit(year: int = Query(2026, description="Jis saal ka munafa dekhna ho"), db: Session = Depends(database.get_db)):
    """3. Owner Dashboard API: Pure season ka total kharcha aur net profit dekhna"""
    return crud.get_profit_analysis(db=db, year=year)