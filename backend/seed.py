"""
Run once: python seed.py
Seeds mock Covenant University data + all 6 demo subject accounts + 3 admin accounts.
"""
import hashlib
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, init_db
from models import Subject, AdminUser, DSRRequest, RequestType, RequestStatus, RiskTier
from datetime import datetime, timezone, timedelta

STUDENTS = [
    ("Aisha Bello", "aisha.bello@cu-student.edu.ng", "08031234501", "Computer Science", "student", "CSC/2021/001", "12 Adeola Street, Lagos", "2021-09-01", "enrolled"),
    ("Emeka Okafor", "emeka.okafor@cu-student.edu.ng", "08031234502", "Engineering", "student", "ENG/2020/002", "5 Palm Avenue, Ota", "2020-09-01", "enrolled"),
    ("Ngozi Eze", "ngozi.eze@cu-student.edu.ng", "08031234503", "Business Administration", "student", "BUS/2022/003", "7 Murtala Road, Ota", "2022-09-01", "enrolled"),
    ("Tunde Adeyemi", "tunde.adeyemi@cu-student.edu.ng", "08031234504", "Law", "student", "LAW/2019/004", "22 Unity Close, Lagos", "2019-09-01", "enrolled"),
    ("Blessing Obi", "blessing.obi@cu-student.edu.ng", "08031234505", "Medicine", "student", "MED/2021/005", "10 Hospital Road, Ota", "2021-09-01", "enrolled"),
    ("Chidi Nwosu", "chidi.nwosu@cu-student.edu.ng", "08031234506", "Accounting", "student", "ACC/2022/006", "3 Finance Lane, Lagos", "2022-09-01", "enrolled"),
    ("Fatimah Lawal", "fatimah.lawal@cu-student.edu.ng", "08031234507", "Architecture", "student", "ARC/2020/007", "15 Design Street, Ota", "2020-09-01", "enrolled"),
    ("Kola Adegoke", "kola.adegoke@cu-student.edu.ng", "08031234508", "Economics", "student", "ECO/2021/008", "8 Market Road, Lagos", "2021-09-01", "enrolled"),
    ("Amaka Igwe", "amaka.igwe@cu-student.edu.ng", "08031234509", "Biochemistry", "student", "BIO/2022/009", "20 Science Ave, Ota", "2022-09-01", "enrolled"),
    ("Seun Afolabi", "seun.afolabi@cu-student.edu.ng", "08031234510", "Mass Communication", "student", "MAS/2020/010", "6 Media Street, Lagos", "2020-09-01", "enrolled"),
]

STAFF = [
    ("Mrs. Helen Ogundipe", "helen.ogundipe@cu.edu.ng", "08051234501", "Human Resources", "staff", "HR/STAFF/001", "14 Staff Quarters, Ota", "2015-03-01", "staff,active"),
    ("Mr. Biodun Salami", "biodun.salami@cu.edu.ng", "08051234502", "Finance", "staff", "FIN/STAFF/002", "9 Estate Road, Ota", "2017-06-15", "staff,active"),
    ("Ms. Chioma Nwankwo", "chioma.nwankwo@cu.edu.ng", "08051234503", "IT Department", "staff", "IT/STAFF/003", "2 Tech Close, Ota", "2019-01-10", "staff,active"),
    ("Mr. Emeka Uche", "emeka.uche@cu.edu.ng", "08051234504", "Registrar's Office", "staff", "REG/STAFF/004", "11 Admin Block, Ota", "2016-09-01", "staff,active"),
    ("Mrs. Funmi Adeola", "funmi.adeola@cu.edu.ng", "08051234505", "Library", "staff", "LIB/STAFF/005", "7 Library Road, Ota", "2018-04-01", "staff,active"),
]

FACULTY = [
    ("Prof. Adewale Johnson", "adewale.johnson@cu.edu.ng", "08061234501", "Computer Science", "faculty", "CS/FAC/001", "Prof Quarters, Ota", "2010-09-01", "faculty,active"),
    ("Dr. Ngozi Okonkwo", "ngozi.okonkwo@cu.edu.ng", "08061234502", "Engineering", "faculty", "ENG/FAC/002", "Faculty Estate, Ota", "2012-01-15", "faculty,active"),
    ("Prof. Ibrahim Musa", "ibrahim.musa@cu.edu.ng", "08061234503", "Law", "faculty", "LAW/FAC/003", "Senior Staff Qtrs, Ota", "2008-09-01", "faculty,active"),
    ("Dr. Amina Yusuf", "amina.yusuf@cu.edu.ng", "08061234504", "Business Admin", "faculty", "BUS/FAC/004", "Faculty Road, Ota", "2014-03-01", "faculty,active"),
    ("Prof. Chukwuemeka Eze", "chukwuemeka.eze@cu.edu.ng", "08061234505", "Medicine", "faculty", "MED/FAC/005", "Medical Faculty, Ota", "2009-09-01", "faculty,active"),
]

ALUMNI = [
    ("Tobi Williams", "tobi.williams@alumni.cu.edu.ng", "08091234501", "Computer Science", "alumni", "CSC/2018/101", "34 Allen Avenue, Lagos", "2018-07-01", "alumni,graduated"),
    ("Ada Okeke", "ada.okeke@alumni.cu.edu.ng", "08091234502", "Business Administration", "alumni", "BUS/2019/102", "12 Victoria Island, Lagos", "2019-07-01", "alumni,graduated"),
    ("Musa Ibrahim", "musa.ibrahim@alumni.cu.edu.ng", "08091234503", "Engineering", "alumni", "ENG/2017/103", "5 Kano Road, Abuja", "2017-07-01", "alumni,graduated"),
    ("Yewande Adesanya", "yewande.adesanya@alumni.cu.edu.ng", "08091234504", "Law", "alumni", "LAW/2020/104", "8 GRA, Benin City", "2020-07-01", "alumni,graduated"),
    ("Obinna Chukwu", "obinna.chukwu@alumni.cu.edu.ng", "08091234505", "Economics", "alumni", "ECO/2018/105", "15 Broad Street, Lagos", "2018-07-01", "alumni,graduated"),
]

DEMO_SUBJECTS = [
    # name, email, phone, dept, role, reg, address, enrolled, tags, special_category
    # Scenario 1 (Access) + Scenario 3 (Modification) — use same record, Mubarak's main email
    ("James Adeleke", "salaudeenmubarakstar@gmail.com", "08011111101", "Computer Science", "student",
     "CSC/2022/301", "14 Demo Street, Lagos", "2022-09-01", "enrolled", False),
    # Scenario 2 (Deletion) + Scenario 4 (Stop Processing) — Mubarak's second email
    ("Fatima Al-Hassan", "mubaraksalaudeen123456@gmail.com", "08011111102", "Business Administration", "alumni",
     "BUS/2019/302", "22 Alumni Road, Lagos", "2019-07-15", "alumni,graduated", False),
    # Scenario 5 — Boss main email (HIGH escalation, special category data)
    ("Dr. Rotimi Balogun", "tolaniyan@dataversesolutions.org", "08011111105", "Medicine", "faculty",
     "MED/FAC/305", "Faculty Estate, Ota", "2013-09-01", "faculty,active", True),
    # Scenario 6 — Boss second email (CRITICAL escalation, pre-seeded with 3 prior requests)
    ("Kolade Fashola", "info@dataversesolutions.org", "08011111106", "Engineering", "student",
     "ENG/2020/306", "3 Bulk House, Ota", "2020-09-01", "enrolled", False),
]

ADMIN_ACCOUNTS = [
    ("DPO Admin", "dpo@cu-demo.edu.ng", "superadmin", "DPOsecure2024!"),
    ("Registrar", "registrar@cu-demo.edu.ng", "admin", "Registrar2024!"),
    ("Legal Team", "legal@cu-demo.edu.ng", "legal", "Legal2024!"),
]


def seed():
    init_db()
    db = SessionLocal()

    # Clear existing
    db.query(Subject).delete()
    db.query(AdminUser).delete()
    db.query(DSRRequest).delete()
    db.commit()

    # Seed regular mock subjects
    for name, email, phone, dept, role, reg, address, enrolled, tags in STUDENTS + STAFF + FACULTY + ALUMNI:
        db.add(Subject(
            name=name, email=email, phone=phone, department=dept, role=role,
            reg_number=reg, address=address, enrolment_date=enrolled, tags=tags,
        ))

    # Seed demo subjects
    for name, email, phone, dept, role, reg, address, enrolled, tags, special_cat in DEMO_SUBJECTS:
        db.add(Subject(
            name=name, email=email, phone=phone, department=dept, role=role,
            reg_number=reg, address=address, enrolment_date=enrolled, tags=tags,
            special_category=special_cat,
        ))

    # Seed admin accounts
    for name, email, role, password in ADMIN_ACCOUNTS:
        pw_hash = hashlib.sha256(password.encode()).hexdigest()
        db.add(AdminUser(name=name, email=email, role=role, password_hash=pw_hash))

    db.commit()

    # Pre-seed 3 prior requests for Kolade so CRITICAL scenario triggers immediately
    bulk_subject = db.query(Subject).filter(Subject.email == "info@dataversesolutions.org").first()
    for i in range(3):
        r = DSRRequest(
            subject_email="info@dataversesolutions.org",
            subject_name="Kolade Fashola",
            request_type=RequestType.ACCESS,
            status=RequestStatus.COMPLETED,
            risk_tier=RiskTier.LOW,
            otp_verified=True,
            created_at=datetime.now(timezone.utc) - timedelta(days=i + 1),
            completed_at=datetime.now(timezone.utc) - timedelta(days=i),
        )
        db.add(r)

    db.commit()
    db.close()

    print("Database seeded successfully.")
    print("\nAdmin accounts:")
    for name, email, role, password in ADMIN_ACCOUNTS:
        print(f"  {email}  /  {password}  ({role})")
    print("\nDemo subject emails:")
    for name, email, *_ in DEMO_SUBJECTS:
        print(f"  {email}  ({name})")


if __name__ == "__main__":
    seed()
