from pydantic import BaseModel, Field
from datetime import date as date_type
from typing import List, Optional

# ==================== 0. AUTH SCHEMAS ====================
class UserCreate(BaseModel):
    username: str
    password: str
    display_name: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    display_name: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    display_name: Optional[str] = None
    role: str

    class Config:
        from_attributes = True


# ==================== 1. EXPENSE SCHEMAS ====================
class ExpenseBase(BaseModel):
    expense_type: str = Field(..., description="'diesel', 'maintenance', 'repair', 'labor', ya 'other'")
    amount: float
    details: Optional[str] = None
    liters: Optional[float] = 0.0
    machine_name: Optional[str] = "Kartar 4000"
    season_year: int = 2026

class ExpenseCreate(ExpenseBase):
    date: date_type

class ExpenseResponse(ExpenseBase):
    id: int
    date: date_type
    owner_id: Optional[int] = None

    class Config:
        from_attributes = True


# ==================== 2. PAYMENT SCHEMAS ====================
class PaymentCreate(BaseModel):
    farmer_id: int
    amount: float
    payment_mode: Optional[str] = "Cash"
    date: Optional[date_type] = None

class PaymentResponse(BaseModel):
    id: int
    farmer_id: int
    amount: float
    payment_mode: Optional[str] = "Cash"
    date: Optional[date_type] = None

    class Config:
        from_attributes = True


# ==================== MINI FARMER SCHEMA ====================
class FarmerMiniResponse(BaseModel):
    id: int
    name: str
    father_name: str
    village: str

    class Config:
        from_attributes = True


# ==================== 3. KATAI (KHET) SCHEMAS ====================
class KataiLogBase(BaseModel):
    khet_name: str
    fasal_name: str
    bigha: float
    rate_per_bigha: float
    amount_received: float = 0.0
    machine_name: Optional[str] = "Kartar 4000"
    start_hour: Optional[float] = 0.0
    end_hour: Optional[float] = 0.0
    total_hours: Optional[float] = 0.0
    season_year: int = 2026
    due_date: Optional[date_type] = None

class KataiLogCreate(KataiLogBase):
    farmer_id: int
    created_at: date_type

class KataiLogResponse(KataiLogBase):
    id: int
    total_amount: float
    amount_remaining: float
    created_at: date_type
    farmer: Optional[FarmerMiniResponse] = None

    class Config:
        from_attributes = True


# ==================== 4. FARMER SCHEMAS ====================
class FarmerBase(BaseModel):
    name: str
    father_name: str
    phone_number: str
    village: str

class FarmerCreate(FarmerBase):
    pass

class FarmerResponse(FarmerBase):
    id: int
    owner_id: Optional[int] = None
    total_outstanding_dues: float
    katai_entries: List[KataiLogResponse] = []
    payment_entries: List[PaymentResponse] = []

    class Config:
        from_attributes = True


# ==================== 5. ANALYTICS SCHEMA ====================
class ProfitAnalysisResponse(BaseModel):
    season_year: int
    total_gross_income: float
    total_cash_collected: float
    total_expenses: float
    net_profit: float
    owner_username: Optional[str] = None


# ==================== 6. SUPERADMIN "ALL HARVESTERS" SCHEMA ====================
class OwnerSummary(BaseModel):
    owner_id: int
    username: str
    display_name: Optional[str] = None
    total_farmers: int
    total_gross_income: float
    total_cash_collected: float
    total_expenses: float
    net_profit: float
    total_outstanding_dues: float