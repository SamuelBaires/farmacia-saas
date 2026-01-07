from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.dependencies import get_current_user, get_farmaceutico_or_admin
from app.models.user import Usuario
from app.models.proveedor import Proveedor
from app.models.inventario import MovimientoInventario
from app.schemas.proveedor import ProveedorCreate, ProveedorUpdate, ProveedorResponse

router = APIRouter(prefix="/proveedores", tags=["Proveedores"])

@router.get("", response_model=List[ProveedorResponse])
async def get_proveedores(
    skip: int = 0,
    limit: int = 100,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all providers for the pharmacy"""
    proveedores = db.query(Proveedor).filter(
        Proveedor.farmacia_id == current_user.farmacia_id
    ).offset(skip).limit(limit).all()
    return proveedores

@router.post("", response_model=ProveedorResponse, status_code=status.HTTP_201_CREATED)
async def create_proveedor(
    proveedor_data: ProveedorCreate,
    current_user: Usuario = Depends(get_farmaceutico_or_admin),
    db: Session = Depends(get_db)
):
    """Create new provider"""
    proveedor = Proveedor(
        **proveedor_data.dict(),
        farmacia_id=current_user.farmacia_id
    )
    db.add(proveedor)
    db.commit()
    db.refresh(proveedor)
    return proveedor

@router.get("/{proveedor_id}", response_model=ProveedorResponse)
async def get_proveedor(
    proveedor_id: str,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get provider by ID"""
    proveedor = db.query(Proveedor).filter(
        Proveedor.id == proveedor_id,
        Proveedor.farmacia_id == current_user.farmacia_id
    ).first()
    
    if not proveedor:
        raise HTTPException(status_code=404, detail="Provider not found")
    return proveedor

@router.put("/{proveedor_id}", response_model=ProveedorResponse)
async def update_proveedor(
    proveedor_id: str,
    proveedor_data: ProveedorUpdate,
    current_user: Usuario = Depends(get_farmaceutico_or_admin),
    db: Session = Depends(get_db)
):
    """Update provider"""
    proveedor = db.query(Proveedor).filter(
        Proveedor.id == proveedor_id,
        Proveedor.farmacia_id == current_user.farmacia_id
    ).first()
    
    if not proveedor:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    for field, value in proveedor_data.dict(exclude_unset=True).items():
        setattr(proveedor, field, value)
        
    db.commit()
    db.refresh(proveedor)
    return proveedor

# Note: Control de entradas usually involves MovimientoInventario. 
# We'll need to link MovimientoInventario to Proveedor if not already linked, 
# or track it via referencia/observaciones for now as the model doesnt have provider_id yet.
# Actually, Medicamento has proveedor_id. So we can find movements related to medications of this provider.

@router.get("/{proveedor_id}/entradas")
async def get_proveedor_entradas(
    proveedor_id: str,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get inventory entries related to medications from this provider"""
    # This is a bit indirect but works with current model
    movimientos = db.query(MovimientoInventario).join(
        MovimientoInventario.medicamento
    ).filter(
        MovimientoInventario.farmacia_id == current_user.farmacia_id,
        MovimientoInventario.tipo_movimiento == "ENTRADA",
        MovimientoInventario.medicamento.has(proveedor_id=proveedor_id)
    ).order_by(MovimientoInventario.fecha_movimiento.desc()).all()
    
    return movimientos
