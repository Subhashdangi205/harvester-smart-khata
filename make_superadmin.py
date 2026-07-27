from app.database import SessionLocal
from app import models

db = SessionLocal()

print("\n--- Sabhi Registered Users ---")
users = db.query(models.User).all()

if not users:
    print("Koi user nahi mila! Pehle app mein signup karo.")
else:
    for u in users:
        print(f"ID: {u.id} | Username: {u.username} | Role: {u.role}")

    print("\n--- Superadmin Banane Ke Liye ---")
    chosen_username = input("Jis username ko superadmin banana hai, wo yaha type karo: ").strip()

    user = db.query(models.User).filter(models.User.username == chosen_username).first()

    if not user:
        print(f"'{chosen_username}' naam ka koi user nahi mila. Spelling check karo.")
    else:
        user.role = "superadmin"
        db.commit()
        print(f"\n✅ Ho gaya! '{user.username}' ab SUPERADMIN hai.")

db.close()