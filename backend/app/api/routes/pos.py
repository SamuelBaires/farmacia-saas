from typing import List
from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import Usuario
from app.models.venta import Venta, DetalleVenta
from app.models.medicamento import Medicamento
from app.models.inventario import MovimientoInventario, TipoMovimiento
from app.models.caja import Caja, EstadoCaja
from app.schemas.venta import VentaCreate, VentaResponse

router = APIRouter(prefix="/pos", tags=["POS"])

@router.post("/ventas", response_model=VentaResponse, status_code=status.HTTP_201_CREATED)
async def crear_venta(
    venta_data: VentaCreate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process a sale"""
    # Verify there's an open cash register
    caja_abierta = db.query(Caja).filter(
        Caja.farmacia_id == current_user.farmacia_id,
        Caja.usuario_id == current_user.id,
        Caja.estado == EstadoCaja.ABIERTA
    ).first()
    
    if not caja_abierta:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No open cash register found. Please open a cash register first."
        )
    
    # Calculate totals
    subtotal = Decimal("0")
    detalles_to_create = []
    
    for detalle in venta_data.detalles:
        # Get medication
        medicamento = db.query(Medicamento).filter(
            Medicamento.id == detalle.medicamento_id,
            Medicamento.farmacia_id == current_user.farmacia_id,
            Medicamento.activo == True
        ).first()
        
        if not medicamento:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Medication {detalle.medicamento_id} not found"
            )
        
        # Check stock
        if medicamento.stock_actual < detalle.cantidad:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {medicamento.nombre_comercial}"
            )
        
        # Calculate subtotal for this item
        item_subtotal = detalle.precio_unitario * detalle.cantidad
        subtotal += item_subtotal
        
        detalles_to_create.append({
            "medicamento_id": detalle.medicamento_id,
            "cantidad": detalle.cantidad,
            "precio_unitario": detalle.precio_unitario,
            "subtotal": item_subtotal,
            "lote": detalle.lote or medicamento.lote,
            "fecha_vencimiento": detalle.fecha_vencimiento or medicamento.fecha_vencimiento
        })
        
        # Update stock
        medicamento.stock_actual -= detalle.cantidad
    
    # Calculate total
    total = subtotal - venta_data.descuento
    
    # Generate sale number
    today = datetime.now().strftime("%Y%m%d")
    last_venta = db.query(Venta).filter(
        Venta.farmacia_id == current_user.farmacia_id
    ).order_by(Venta.created_at.desc()).first()
    
    if last_venta and last_venta.numero_venta.startswith(today):
        seq = int(last_venta.numero_venta.split("-")[-1]) + 1
    else:
        seq = 1
    
    numero_venta = f"{today}-{seq:04d}"
    
    # Create sale
    venta = Venta(
        farmacia_id=current_user.farmacia_id,
        usuario_id=current_user.id,
        cliente_id=venta_data.cliente_id,
        caja_id=caja_abierta.id,
        numero_venta=numero_venta,
        subtotal=subtotal,
        descuento=venta_data.descuento,
        total=total,
        metodo_pago=venta_data.metodo_pago,
        referencia_pago=venta_data.referencia_pago,
        requirio_receta=venta_data.requirio_receta,
        observaciones=venta_data.observaciones
    )
    
    db.add(venta)
    db.flush()
    
    # Create sale details and inventory movements
    for detalle_data in detalles_to_create:
        detalle = DetalleVenta(
            venta_id=venta.id,
            **detalle_data
        )
        db.add(detalle)
        
        # Create inventory movement
        movimiento = MovimientoInventario(
            farmacia_id=current_user.farmacia_id,
            medicamento_id=detalle_data["medicamento_id"],
            usuario_id=current_user.id,
            tipo_movimiento=TipoMovimiento.SALIDA,
            cantidad=detalle_data["cantidad"],
            precio_unitario=detalle_data["precio_unitario"],
            referencia=numero_venta
        )
        db.add(movimiento)
    
    db.commit()
    db.refresh(venta)
    
    return venta

@router.get("/ventas", response_model=List[VentaResponse])
async def get_ventas(
    skip: int = 0,
    limit: int = 50,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get sales history"""
    ventas = db.query(Venta).filter(
        Venta.farmacia_id == current_user.farmacia_id
    ).order_by(Venta.fecha_venta.desc()).offset(skip).limit(limit).all()
    
    return ventas
