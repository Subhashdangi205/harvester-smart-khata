from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, date
from .. import crud, schemas, database, models, auth_utils

router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)

@router.post("/", response_model=schemas.PaymentResponse, status_code=201)
async def add_payment(
    request: Request,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """Kisan Ka Jama Payment Fail-Safe Way Se Save Karna"""
    try:
        data = await request.json()

        # 1. Date Handling: Clean date parsing
        raw_date = data.get("date")
        if raw_date and str(raw_date).strip():
            if isinstance(raw_date, str):
                pay_date = datetime.strptime(raw_date[:10], "%Y-%m-%d").date()
            else:
                pay_date = raw_date
        else:
            pay_date = date.today()

        farmer_id = int(data["farmer_id"])

        # 2. Ownership check
        db_farmer = db.query(models.Farmer).filter(models.Farmer.id == farmer_id).first()
        if not db_farmer:
            raise HTTPException(status_code=404, detail="Kisan nahi mila!")
        if current_user.role != "superadmin" and db_farmer.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Ye kisan tumhare khata ka nahi hai!")

        # 3. Clean Schema Object Creation
        payment_obj = schemas.PaymentCreate(
            farmer_id=farmer_id,
            amount=float(data["amount"]),
            payment_mode=str(data.get("payment_mode", "Cash")),
            date=pay_date
        )

        # 4. Save to Database via CRUD
        db_payment = crud.add_payment_entry(db=db, payment=payment_obj)
        return db_payment

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))