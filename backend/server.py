from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import bcrypt
import jwt
from datetime import datetime, timedelta
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
import urllib.parse

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-this')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Models
class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    workshop_name: Optional[str] = None
    workshop_id: Optional[str] = None
    role: str = "owner"  # owner or employee

class UserLogin(BaseModel):
    username: str
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: Optional[str] = None
    workshop_name: Optional[str] = None
    workshop_id: str = Field(default_factory=lambda: str(uuid.uuid4()).replace('-', '').upper()[:18])
    role: str = "owner"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserDB(User):
    password: str  # Only for database storage

class CustomerCreate(BaseModel):
    name: str
    phone: str

class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    workshop_id: str
    total_debt: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ServiceSessionCreate(BaseModel):
    session_name: str
    customer_id: str

class ServiceSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_name: str
    session_date: datetime = Field(default_factory=datetime.utcnow)
    customer_id: str
    workshop_id: str

class ServiceCreate(BaseModel):
    description: str
    price: float
    service_session_id: str
    customer_id: str

class Service(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    description: str
    price: float
    service_session_id: str
    customer_id: str
    workshop_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PaymentCreate(BaseModel):
    amount: float
    description: Optional[str] = None
    service_session_id: Optional[str] = None
    customer_id: str

class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    amount: float
    description: Optional[str] = None
    service_session_id: Optional[str] = None
    customer_id: str
    workshop_id: str
    payment_date: datetime = Field(default_factory=datetime.utcnow)

# Token and Auth functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"username": username})
    if user is None:
        raise credentials_exception
    
    return User(**user)

# Auth Endpoints
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if username exists
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Hash password
    hashed_password = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt())
    
    # Create user
    user_dict = user_data.dict()
    user_dict['password'] = hashed_password.decode('utf-8')
    
    # Remove None workshop_id to let default factory work
    if user_dict.get('workshop_id') is None:
        user_dict.pop('workshop_id', None)
    
    user_obj = User(**user_dict)
    
    # If employee, validate workshop_id
    if user_data.role == "employee":
        if not user_data.workshop_id:
            raise HTTPException(status_code=400, detail="Workshop ID required for employee")
        
        # Check if workshop exists
        workshop_owner = await db.users.find_one({"workshop_id": user_data.workshop_id, "role": "owner"})
        if not workshop_owner:
            raise HTTPException(status_code=400, detail="Invalid workshop ID")
        
        user_obj.workshop_id = user_data.workshop_id
        user_obj.workshop_name = workshop_owner.get('workshop_name')
    
    # Save to database
    await db.users.insert_one(user_obj.dict())
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_obj.username}, expires_delta=access_token_expires
    )
    
    # Return user without password
    user_response = user_obj.dict()
    user_response.pop('password', None)
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_response}

@api_router.post("/auth/login")
async def login(user_credentials: UserLogin):
    user = await db.users.find_one({"username": user_credentials.username})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Verify password
    if not bcrypt.checkpw(user_credentials.password.encode('utf-8'), user['password'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user['username']}, expires_delta=access_token_expires
    )
    
    # Return user without password
    user_response = {k: v for k, v in user.items() if k != 'password'}
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_response}

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user.dict()

# Customer Endpoints
@api_router.post("/customers", response_model=Customer)
async def create_customer(customer_data: CustomerCreate, current_user: User = Depends(get_current_user)):
    customer_dict = customer_data.dict()
    customer_dict['workshop_id'] = current_user.workshop_id
    customer_obj = Customer(**customer_dict)
    
    await db.customers.insert_one(customer_obj.dict())
    return customer_obj

@api_router.get("/customers", response_model=List[Customer])
async def get_customers(current_user: User = Depends(get_current_user)):
    customers = await db.customers.find({"workshop_id": current_user.workshop_id}).to_list(1000)
    return [Customer(**customer) for customer in customers]

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, current_user: User = Depends(get_current_user)):
    # Delete customer and all related data
    await db.customers.delete_one({"id": customer_id, "workshop_id": current_user.workshop_id})
    await db.service_sessions.delete_many({"customer_id": customer_id, "workshop_id": current_user.workshop_id})
    await db.services.delete_many({"customer_id": customer_id, "workshop_id": current_user.workshop_id})
    await db.payments.delete_many({"customer_id": customer_id, "workshop_id": current_user.workshop_id})
    
    return {"message": "Customer and all related data deleted successfully"}

@api_router.get("/customers/{customer_id}/summary")
async def get_customer_summary(customer_id: str, current_user: User = Depends(get_current_user)):
    # Get customer
    customer = await db.customers.find_one({"id": customer_id, "workshop_id": current_user.workshop_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get service sessions
    service_sessions = await db.service_sessions.find(
        {"customer_id": customer_id, "workshop_id": current_user.workshop_id}
    ).sort("session_date", -1).to_list(1000)
    
    service_sessions_summary = []
    total_services_amount = 0
    total_payments_amount = 0
    
    for session in service_sessions:
        # Get services for this session
        services = await db.services.find({"service_session_id": session['id']}).to_list(1000)
        session_services_total = sum(service['price'] for service in services)
        
        # Get payments for this session
        payments = await db.payments.find({"service_session_id": session['id']}).to_list(1000)
        session_payments_total = sum(payment['amount'] for payment in payments)
        
        session_remaining_debt = session_services_total - session_payments_total
        
        # Convert to model objects to avoid ObjectId serialization issues
        session_obj = ServiceSession(**session)
        service_objs = [Service(**service) for service in services]
        payment_objs = [Payment(**payment) for payment in payments]
        
        service_sessions_summary.append({
            "session": session_obj.dict(),
            "services": [service.dict() for service in service_objs],
            "payments": [payment.dict() for payment in payment_objs],
            "services_total": session_services_total,
            "payments_total": session_payments_total,
            "remaining_debt": session_remaining_debt
        })
        
        total_services_amount += session_services_total
        total_payments_amount += session_payments_total
    
    # Calculate remaining debt
    remaining_debt = total_services_amount - total_payments_amount
    
    # Convert customer to model object
    customer_obj = Customer(**customer)
    
    return {
        "customer": customer_obj.dict(),
        "service_sessions": service_sessions_summary,
        "total_services_amount": total_services_amount,
        "total_payments_amount": total_payments_amount,
        "remaining_debt": remaining_debt
    }

# Service Session Endpoints
@api_router.post("/service-sessions", response_model=ServiceSession)
async def create_service_session(session_data: ServiceSessionCreate, current_user: User = Depends(get_current_user)):
    session_dict = session_data.dict()
    session_dict['workshop_id'] = current_user.workshop_id
    session_obj = ServiceSession(**session_dict)
    
    await db.service_sessions.insert_one(session_obj.dict())
    return session_obj

@api_router.get("/customers/{customer_id}/service-sessions")
async def get_customer_service_sessions(customer_id: str, current_user: User = Depends(get_current_user)):
    sessions = await db.service_sessions.find(
        {"customer_id": customer_id, "workshop_id": current_user.workshop_id}
    ).sort("session_date", -1).to_list(1000)
    return [ServiceSession(**session) for session in sessions]

# Service Endpoints
@api_router.post("/services", response_model=Service)
async def create_service(service_data: ServiceCreate, current_user: User = Depends(get_current_user)):
    service_dict = service_data.dict()
    service_dict['workshop_id'] = current_user.workshop_id
    service_obj = Service(**service_dict)
    
    await db.services.insert_one(service_obj.dict())
    return service_obj

@api_router.put("/services/{service_id}")
async def update_service(service_id: str, service_data: dict, current_user: User = Depends(get_current_user)):
    await db.services.update_one(
        {"id": service_id, "workshop_id": current_user.workshop_id},
        {"$set": service_data}
    )
    return {"message": "Service updated successfully"}

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, current_user: User = Depends(get_current_user)):
    await db.services.delete_one({"id": service_id, "workshop_id": current_user.workshop_id})
    return {"message": "Service deleted successfully"}

# Payment Endpoints
@api_router.post("/payments", response_model=Payment)
async def create_payment(payment_data: PaymentCreate, current_user: User = Depends(get_current_user)):
    payment_dict = payment_data.dict()
    payment_dict['workshop_id'] = current_user.workshop_id
    payment_obj = Payment(**payment_dict)
    
    await db.payments.insert_one(payment_obj.dict())
    return payment_obj

# Dashboard Endpoint
@api_router.get("/dashboard")
async def get_dashboard(current_user: User = Depends(get_current_user)):
    # Get all customers
    customers = await db.customers.find({"workshop_id": current_user.workshop_id}).to_list(1000)
    
    customers_summary = []
    
    for customer in customers:
        # Get customer stats
        services = await db.services.find({"customer_id": customer['id']}).to_list(1000)
        payments = await db.payments.find({"customer_id": customer['id']}).to_list(1000)
        service_sessions = await db.service_sessions.find({"customer_id": customer['id']}).to_list(1000)
        
        total_services_amount = sum(service['price'] for service in services)
        total_payments_amount = sum(payment['amount'] for payment in payments)
        total_debt = total_services_amount - total_payments_amount
        
        # Convert customer to model object
        customer_obj = Customer(**customer)
        
        customers_summary.append({
            "customer": customer_obj.dict(),
            "total_debt": total_debt,
            "total_services": len(services),
            "total_payments": len(payments),
            "total_service_sessions": len(service_sessions)
        })
    
    return {"customers": customers_summary}

# Helper function for datetime formatting
def format_datetime(dt_obj, format_str):
    """Format datetime object or string to specified format"""
    if isinstance(dt_obj, datetime):
        return dt_obj.strftime(format_str)
    elif isinstance(dt_obj, str):
        return datetime.fromisoformat(dt_obj).strftime(format_str)
    else:
        return str(dt_obj)

# WhatsApp Integration
@api_router.get("/customers/{customer_id}/whatsapp-message")
async def generate_whatsapp_message(
    customer_id: str, 
    session_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    # Get customer summary
    customer_summary = await get_customer_summary(customer_id, current_user)
    
    customer = customer_summary['customer']
    workshop_name = current_user.workshop_name or f"Bengkel {current_user.username}"
    
    # Build message
    message_lines = [
        f"🔧 *{workshop_name}*",
        f"📋 Detail Servis - {customer['name']}",
        f"📞 {customer['phone']}",
        f"📅 {datetime.now().strftime('%d %B %Y')}",
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    ]
    
    total_amount = 0
    total_paid = 0
    
    if session_id:
        # Single session
        session_data = next((s for s in customer_summary['service_sessions'] if s['session']['id'] == session_id), None)
        if not session_data:
            raise HTTPException(status_code=404, detail="Service session not found")
        
        message_lines.extend([
            f"📝 *{session_data['session']['session_name']}*",
            f"📅 {format_datetime(session_data['session']['session_date'], '%d %B %Y')}",
            ""
        ])
        
        # Services
        if session_data['services']:
            message_lines.append("🔧 *DETAIL SERVIS:*")
            for service in session_data['services']:
                message_lines.append(f"• {service['description']}")
                message_lines.append(f"  💰 Rp {service['price']:,.0f}")
            message_lines.append("")
        
        # Payments
        if session_data['payments']:
            message_lines.append("💳 *PEMBAYARAN:*")
            for payment in session_data['payments']:
                desc = f" ({payment['description']})" if payment['description'] else ""
                payment_date = format_datetime(payment['payment_date'], '%d/%m/%Y')
                message_lines.append(f"• {payment_date} - Rp {payment['amount']:,.0f}{desc}")
            message_lines.append("")
        
        total_amount = session_data['services_total']
        total_paid = session_data['payments_total']
    else:
        # All sessions
        for session_data in customer_summary['service_sessions']:
            message_lines.extend([
                f"📝 *{session_data['session']['session_name']}*",
                f"📅 {format_datetime(session_data['session']['session_date'], '%d %B %Y')}",
                ""
            ])
            
            # Services
            if session_data['services']:
                message_lines.append("🔧 *DETAIL SERVIS:*")
                for service in session_data['services']:
                    message_lines.append(f"• {service['description']}")
                    message_lines.append(f"  💰 Rp {service['price']:,.0f}")
                message_lines.append("")
            
            # Payments
            if session_data['payments']:
                message_lines.append("💳 *PEMBAYARAN:*")
                for payment in session_data['payments']:
                    desc = f" ({payment['description']})" if payment['description'] else ""
                    payment_date = format_datetime(payment['payment_date'], '%d/%m/%Y')
                    message_lines.append(f"• {payment_date} - Rp {payment['amount']:,.0f}{desc}")
                message_lines.append("")
            
            message_lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            message_lines.append("")
        
        total_amount = customer_summary['total_services_amount']
        total_paid = customer_summary['total_payments_amount']
    
    # Summary
    remaining_debt = total_amount - total_paid
    message_lines.extend([
        "💰 *RINGKASAN:*",
        f"Total Servis: Rp {total_amount:,.0f}",
        f"Total Bayar: Rp {total_paid:,.0f}",
        f"Sisa: Rp {remaining_debt:,.0f}",
        ""
    ])
    
    if remaining_debt > 0:
        message_lines.append("⚠️ *Mohon segera melunasi sisa pembayaran*")
    else:
        message_lines.append("✅ *Pembayaran Lunas*")
    
    message_lines.extend([
        "",
        f"Terima kasih telah mempercayakan kendaraan Anda kepada {workshop_name}! 🙏"
    ])
    
    message_text = "\n".join(message_lines)
    phone = customer['phone'].replace('+', '').replace('-', '').replace(' ', '')
    if phone.startswith('0'):
        phone = '62' + phone[1:]
    
    whatsapp_url = f"https://wa.me/{phone}?text={urllib.parse.quote(message_text)}"
    
    return {
        "message": message_text,
        "whatsapp_url": whatsapp_url
    }

# Default route
@api_router.get("/")
async def root():
    return {"message": "Workshop Management System API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()