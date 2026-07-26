from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from .database import Base

class Farmer(Base):
    """1. Kisaan Ki Profile Table"""
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    father_name = Column(String, index=True, nullable=False)
    phone_number = Column(String, unique=True, index=True, nullable=False)
    village = Column(String, index=True, nullable=False)
    
    total_outstanding_dues = Column(Float, default=0.0)

    katai_entries = relationship("KataiLog", back_populates="farmer", cascade="all, delete-orphan")
    payment_entries = relationship("PaymentLog", back_populates="farmer", cascade="all, delete-orphan")


class KataiLog(Base):
    """2. Har Khet Ki Katai Aur Paise Ka Hisab"""
    __tablename__ = "katai_logs"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    
    khet_name = Column(String, nullable=False)
    fasal_name = Column(String, nullable=False)
    
    bigha = Column(Float, nullable=False)
    rate_per_bigha = Column(Float, nullable=False)
    amount_received = Column(Float, default=0.0)
    
    total_amount = Column(Float, nullable=False)
    amount_remaining = Column(Float, nullable=False)
    
    season_year = Column(Integer, default=2026, index=True)
    created_at = Column(Date, nullable=False)
    due_date = Column(Date, nullable=True)  # 🆕 NAYA COLUMN

    farmer = relationship("Farmer", back_populates="katai_entries")


class PaymentLog(Base):
    """3. Kisan Ka Jama Payment History"""
    __tablename__ = "payment_logs"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    
    amount = Column(Float, nullable=False)
    payment_mode = Column(String, default="Cash")
    date = Column(Date, nullable=False)

    farmer = relationship("Farmer", back_populates="payment_entries")


class ExpenseLog(Base):
    """4. Diesel Aur Maintenance Ka Kharcha Book"""
    __tablename__ = "expense_logs"

    id = Column(Integer, primary_key=True, index=True)
    expense_type = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    details = Column(String, nullable=True)
    
    season_year = Column(Integer, default=2026, index=True)
    date = Column(Date, nullable=False)