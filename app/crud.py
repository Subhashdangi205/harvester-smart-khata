from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from typing import Optional
from . import models, schemas
from .auth_utils import hash_password

# ==================== 0. USER / AUTH CRUD ====================

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(
        username=user.username,
        password_hash=hash_password(user.password),
        display_name=user.display_name or user.username,
        role="owner",
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_all_users(db: Session):
    return db.query(models.User).filter(models.User.role == "owner").all()


# ==================== 1. FARMER CRUD LOGIC ====================

def get_farmer_by_phone(db: Session, phone_number: str, owner_id: int):
    return db.query(models.Farmer).filter(
        models.Farmer.phone_number == phone_number,
        models.Farmer.owner_id == owner_id
    ).first()

def get_all_farmers(db: Session):
    """Superadmin ke liye — sabke farmers"""
    return db.query(models.Farmer).all()

def get_farmers_by_owner(db: Session, owner_id: int, name_query: Optional[str] = None):
    q = db.query(models.Farmer).filter(models.Farmer.owner_id == owner_id)
    if name_query and name_query.strip():
        q = q.filter(models.Farmer.name.ilike(f"%{name_query.strip()}%"))
    return q.all()

def create_farmer(db: Session, farmer: schemas.FarmerCreate, owner_id: int):
    db_farmer = models.Farmer(
        name=farmer.name,
        father_name=farmer.father_name,
        phone_number=farmer.phone_number,
        village=farmer.village,
        owner_id=owner_id,
    )
    db.add(db_farmer)
    db.commit()
    db.refresh(db_farmer)
    return db_farmer

def search_farmers_by_name(db: Session, name_query: str):
    """Superadmin ke liye — sabke farmers mein search"""
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
        due_date=katai.due_date,
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

    db_payment = models.PaymentLog(
        farmer_id=payment.farmer_id,
        amount=payment.amount,
        payment_mode=payment.payment_mode or "Cash",
        date=pay_date
    )
    db.add(db_payment)

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

    update_farmer_outstanding_dues(db, farmer_id=payment.farmer_id)
    return db_payment


# ==================== 4. EXPENSE CRUD LOGIC ====================

def create_expense(db: Session, expense: schemas.ExpenseCreate, owner_id: int):
    db_expense = models.ExpenseLog(
        expense_type=expense.expense_type,
        amount=expense.amount,
        details=expense.details,
        season_year=expense.season_year,
        date=expense.date,
        owner_id=owner_id,
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

def get_expenses_by_year(db: Session, year: int, owner_id: Optional[int] = None):
    q = db.query(models.ExpenseLog).filter(models.ExpenseLog.season_year == year)
    if owner_id is not None:
        q = q.filter(models.ExpenseLog.owner_id == owner_id)
    return q.order_by(models.ExpenseLog.date.desc()).all()


# ==================== 5. OWNER DASHBOARD ANALYTICS ====================

def get_profit_analysis(db: Session, year: int, owner_id: Optional[int] = None):
    farmer_ids_q = db.query(models.Farmer.id)
    katai_q = db.query(models.KataiLog).filter(models.KataiLog.season_year == year)
    expense_q = db.query(models.ExpenseLog).filter(models.ExpenseLog.season_year == year)

    if owner_id is not None:
        farmer_ids_q = farmer_ids_q.filter(models.Farmer.owner_id == owner_id)
        owned_farmer_ids = [f.id for f in farmer_ids_q.all()]
        katai_q = katai_q.filter(models.KataiLog.farmer_id.in_(owned_farmer_ids or [-1]))
        expense_q = expense_q.filter(models.ExpenseLog.owner_id == owner_id)

    total_gross = sum(k.total_amount for k in katai_q.all())
    total_cash = sum(k.amount_received for k in katai_q.all())
    total_exp = sum(e.amount for e in expense_q.all())
    net_profit = total_cash - total_exp

    return {
        "season_year": year,
        "total_gross_income": total_gross,
        "total_cash_collected": total_cash,
        "total_expenses": total_exp,
        "net_profit": net_profit,
    }


# ==================== 6. SUPERADMIN — SABKE HARVESTERS KA SUMMARY ====================

def get_all_owners_summary(db: Session, year: int):
    owners = db.query(models.User).filter(models.User.role == "owner").all()
    summary = []
    for owner in owners:
        analysis = get_profit_analysis(db, year=year, owner_id=owner.id)
        farmer_count = db.query(models.Farmer).filter(models.Farmer.owner_id == owner.id).count()
        total_dues = db.query(func.sum(models.Farmer.total_outstanding_dues)).filter(
            models.Farmer.owner_id == owner.id
        ).scalar() or 0.0

        summary.append({
            "owner_id": owner.id,
            "username": owner.username,
            "display_name": owner.display_name,
            "total_farmers": farmer_count,
            "total_gross_income": analysis["total_gross_income"],
            "total_cash_collected": analysis["total_cash_collected"],
            "total_expenses": analysis["total_expenses"],
            "net_profit": analysis["net_profit"],
            "total_outstanding_dues": total_dues,
        })
    return summary