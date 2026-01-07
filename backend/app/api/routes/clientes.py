from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import Usuario
from app.models.cliente import Cliente
from app.models.venta import Venta
from app.schemas.cliente import ClienteCreate, ClienteUpdate, ClienteResponse
from app.schemas.venta import VentaResponse

router = APIRouter(prefix="/clientes", tags=["Clientes"])

@router.get("", response_model=List[ClienteResponse])
async def get_clientes(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all clients for the pharmacy"""
    query = db.query(Cliente).filter(Cliente.farmacia_id == current_user.farmacia_id)
    
    if search:
        query = query.filter(Cliente.nombre.ilike(f"%{search}%"))
        
    clientes = query.offset(skip).limit(limit).all()
    return clientes

@router.post("", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED)
async def create_cliente(
    cliente_data: ClienteCreate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new client"""
    cliente = Cliente(
        **cliente_data.dict(),
        farmacia_id=current_user.farmacia_id
    )
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return cliente

@router.get("/{cliente_id}", response_model=ClienteResponse)
async def get_cliente(
    cliente_id: str,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get client by ID"""
    cliente = db.query(Cliente).filter(
        Cliente.id == cliente_id,
        Cliente.farmacia_id == current_user.farmacia_id
    ).first()
    
    if not cliente:
        raise HTTPException(status_code=404, detail="Client not found")
    return cliente

@router.put("/{cliente_id}", response_model=ClienteResponse)
async def update_cliente(
    cliente_id: str,
    cliente_data: ClienteUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update client"""
    cliente = db.query(Cliente).filter(
        Cliente.id == cliente_id,
        Cliente.farmacia_id == current_user.farmacia_id
    ).first()
    
    if not cliente:
        raise HTTPException(status_code=404, detail="Client not found")
    
    for field, value in cliente_data.dict(exclude_unset=True).items():
        setattr(cliente, field, value)
        
    db.commit()
    db.refresh(cliente)
    return cliente

@router.get("/{cliente_id}/historial", response_model=List[VentaResponse])
async def get_cliente_historial(
    cliente_id: str,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get client purchase history"""
    ventas = db.query(Venta).filter(
        Venta.cliente_id == cliente_id,
        Venta.farmacia_id == current_user.farmacia_id
    ).order_by(Venta.fecha_venta.desc()).all()
    return ventas
