from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.api.dependencies import get_current_user, get_farmaceutico_or_admin
from app.models.user import Usuario
from app.models.medicamento import Medicamento
from app.schemas.medicamento import MedicamentoCreate, MedicamentoUpdate, MedicamentoResponse

router = APIRouter(prefix="/medicamentos", tags=["Medicamentos"])

@router.get("", response_model=List[MedicamentoResponse])
async def get_medicamentos(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    es_controlado: Optional[bool] = None,
    activo: bool = True,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all medications for the pharmacy"""
    query = db.query(Medicamento).filter(
        Medicamento.farmacia_id == current_user.farmacia_id,
        Medicamento.activo == activo
    )
    
    if search:
        query = query.filter(
            or_(
                Medicamento.nombre_comercial.ilike(f"%{search}%"),
                Medicamento.nombre_generico.ilike(f"%{search}%"),
                Medicamento.codigo_barras.ilike(f"%{search}%")
            )
        )
    
    if es_controlado is not None:
        query = query.filter(Medicamento.es_controlado == es_controlado)
    
    medicamentos = query.offset(skip).limit(limit).all()
    return medicamentos

@router.get("/barcode/{codigo_barras}", response_model=MedicamentoResponse)
async def get_medicamento_by_barcode(
    codigo_barras: str,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get medication by barcode"""
    medicamento = db.query(Medicamento).filter(
        Medicamento.farmacia_id == current_user.farmacia_id,
        Medicamento.codigo_barras == codigo_barras,
        Medicamento.activo == True
    ).first()
    
    if not medicamento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication not found"
        )
    
    return medicamento

@router.post("", response_model=MedicamentoResponse, status_code=status.HTTP_201_CREATED)
async def create_medicamento(
    medicamento_data: MedicamentoCreate,
    current_user: Usuario = Depends(get_farmaceutico_or_admin),
    db: Session = Depends(get_db)
):
    """Create new medication"""
    # Check if barcode already exists
    existing = db.query(Medicamento).filter(
        Medicamento.farmacia_id == current_user.farmacia_id,
        Medicamento.codigo_barras == medicamento_data.codigo_barras
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Medication with this barcode already exists"
        )
    
    medicamento = Medicamento(
        **medicamento_data.dict(),
        farmacia_id=current_user.farmacia_id
    )
    
    db.add(medicamento)
    db.commit()
    db.refresh(medicamento)
    
    return medicamento

@router.put("/{medicamento_id}", response_model=MedicamentoResponse)
async def update_medicamento(
    medicamento_id: str,
    medicamento_data: MedicamentoUpdate,
    current_user: Usuario = Depends(get_farmaceutico_or_admin),
    db: Session = Depends(get_db)
):
    """Update medication"""
    medicamento = db.query(Medicamento).filter(
        Medicamento.id == medicamento_id,
        Medicamento.farmacia_id == current_user.farmacia_id
    ).first()
    
    if not medicamento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication not found"
        )
    
    for field, value in medicamento_data.dict(exclude_unset=True).items():
        setattr(medicamento, field, value)
    
    db.commit()
    db.refresh(medicamento)
    
    return medicamento

@router.get("/alertas/stock-minimo", response_model=List[MedicamentoResponse])
async def get_alertas_stock_minimo(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get medications with low stock"""
    medicamentos = db.query(Medicamento).filter(
        Medicamento.farmacia_id == current_user.farmacia_id,
        Medicamento.activo == True,
        Medicamento.stock_actual <= Medicamento.stock_minimo
    ).all()
    
    return medicamentos
