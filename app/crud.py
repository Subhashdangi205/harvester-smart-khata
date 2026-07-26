from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from . import models, schemas

# ==================== 1. FARMER CRUD LOGIC ====================

def get_farmer_by_phone(db: Session, phone_number: str):
    return db.query(models.Farmer).filter(models.Farmer.phone_number == phone_number).first()

def get_all_farmers(db: Session):
    return db.query(models.Farmer).all()

def create_farmer(db: Session, farmer: schemas.FarmerCreate):
    db_farmer = models.Farmer(
        name=farmer.name,
        father_name=farmer.father_name,
        phone_number=farmer.phone_number,
        village=farmer.village
    )
    db.add(db_farmer)
    db.commit()
    db.refresh(db_farmer)
    return db_farmer

def search_farmers_by_name(db: Session, name_query: str):
    return db.query(models.Farmer).filter(models.Farmer.name.ilike(f"%{name_query}%")).all()


# ==================== 2. KATAI LOG LOGIC ====================

def create_katai_log(db: Session, katai: schemas.KataiLogCreate):
    total_amount = katai.bigha * katai.rate_per_bigha
    amount_remaining = total_amount - katai.amount_received

    db_katai = models.KataiLog(
        farmer_id=katai.farmer_id,
        khet_name=katai.khet_name,
        fasal_name=katai.fasal_name,
        bigha=katai.bigha,
        rate_per_bigha=katai.rate_per_bigha,
        amount_received=katai.amount_received,
        total_amount=total_amount,
        amount_remaining=amount_remaining,
        season_year=katai.season_year,
        created_at=katai.created_at,
        due_date=katai.due_date,  # 🆕 NAYI LINE
    )
    db.add(db_katai)
    db.commit()
    db.refresh(db_katai)

    update_farmer_outstanding_dues(db, farmer_id=katai.farmer_id)
    db.refresh(db_katai, attribute_names=["farmer"])
    return db_katai

def update_farmer_outstanding_dues(db: Session, farmer_id: int):
    total_dues = db.query(func.sum(models.KataiLog.amount_remaining)).filter(
        models.KataiLog.farmer_id == farmer_id
    ).scalar() or 0.0
    
    farmer = db.query(models.Farmer).filter(models.Farmer.id == farmer_id).first()
    if farmer:
        farmer.total_outstanding_dues = total_dues
        db.commit()


# ==================== 3. JAMA PAYMENT LOGIC ====================

def add_payment_entry(db: Session, payment: schemas.PaymentCreate):
    pay_date = payment.date or date.today()

    # 1. Save Payment in Table
    db_payment = models.PaymentLog(
        farmer_id=payment.farmer_id,
        amount=payment.amount,
        payment_mode=payment.payment_mode or "Cash",
        date=pay_date
    )
    db.add(db_payment)

    # 2. Adjust Katai Log Dues
    remaining_payment = payment.amount
    entries = db.query(models.KataiLog).filter(
        models.KataiLog.farmer_id == payment.farmer_id,
        models.KataiLog.amount_remaining > 0
    ).order_by(models.KataiLog.created_at.asc()).all()

    for entry in entries:
        if remaining_payment <= 0:
            break
        
        pay_amount = min(entry.amount_remaining, remaining_payment)
        entry.amount_received += pay_amount
        entry.amount_remaining -= pay_amount
        remaining_payment -= pay_amount

    db.commit()
    db.refresh(db_payment)

    # 3. Master Dues Refresh
    update_farmer_outstanding_dues(db, farmer_id=payment.farmer_id)
    return db_payment


# ==================== 4. EXPENSE CRUD LOGIC ====================

def create_expense(db: Session, expense: schemas.ExpenseCreate):
    db_expense = models.ExpenseLog(
        expense_type=expense.expense_type,
        amount=expense.amount,
        details=expense.details,
        season_year=expense.season_year,
        date=expense.date
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

def get_expenses_by_year(db: Session, year: int):
    return db.query(models.ExpenseLog).filter(models.ExpenseLog.season_year == year).order_by(models.ExpenseLog.date.desc()).all()


# ==================== 5. OWNER DASHBOARD ANALYTICS ====================

def get_profit_analysis(db: Session, year: int):
    total_gross = db.query(func.sum(models.KataiLog.total_amount)).filter(
        models.KataiLog.season_year == year
    ).scalar() or 0.0

    total_cash = db.query(func.sum(models.KataiLog.amount_received)).filter(
        models.KataiLog.season_year == year
    ).scalar() or 0.0

    total_exp = db.query(func.sum(models.ExpenseLog.amount)).filter(
        models.ExpenseLog.season_year == year
    ).scalar() or 0.0

    net_profit = total_cash - total_exp

    return {
        "season_year": year,
        "total_gross_income": total_gross,
        "total_cash_collected": total_cash,
        "total_expenses": total_exp,
        "net_profit": net_profit
    }