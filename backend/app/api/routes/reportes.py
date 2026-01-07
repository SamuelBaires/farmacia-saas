from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
import pandas as pd
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import Usuario
from app.models.venta import Venta, DetalleVenta
from app.models.medicamento import Medicamento
from app.models.inventario import MovimientoInventario

router = APIRouter(prefix="/reportes", tags=["Reportes"])

@router.get("/dashboard")
async def get_dashboard_metrics(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener métricas clave para el dashboard"""
    today = datetime.now().date()
    first_day_month = today.replace(day=1)

    # Ventas de hoy
    ventas_hoy = db.query(func.sum(Venta.total)).filter(
        Venta.farmacia_id == current_user.farmacia_id,
        func.date(Venta.fecha_venta) == today
    ).scalar() or 0

    # Ventas del mes
    ventas_mes = db.query(func.sum(Venta.total)).filter(
        Venta.farmacia_id == current_user.farmacia_id,
        Venta.fecha_venta >= first_day_month
    ).scalar() or 0

    # Conteo de productos con stock bajo
    stock_bajo_count = db.query(func.count(Medicamento.id)).filter(
        Medicamento.farmacia_id == current_user.farmacia_id,
        Medicamento.activo == True,
        Medicamento.stock_actual <= Medicamento.stock_minimo
    ).scalar() or 0

    # Total de productos activos
    total_productos = db.query(func.count(Medicamento.id)).filter(
        Medicamento.farmacia_id == current_user.farmacia_id,
        Medicamento.activo == True
    ).scalar() or 0

    # Productos más vendidos (Top 5)
    top_productos = db.query(
        Medicamento.nombre_comercial,
        func.sum(DetalleVenta.cantidad).label("vendidos"),
        func.sum(DetalleVenta.subtotal).label("total_venta")
    ).join(DetalleVenta, Medicamento.id == DetalleVenta.medicamento_id)\
     .join(Venta, Venta.id == DetalleVenta.venta_id)\
     .filter(Venta.farmacia_id == current_user.farmacia_id)\
     .group_by(Medicamento.id)\
     .order_by(func.sum(DetalleVenta.cantidad).desc())\
     .limit(5).all()

    # Formatear top productos
    top_productos_list = [
        {"nombre": p[0], "cantidad": p[1], "total": float(p[2])} for p in top_productos
    ]

    # Alertas de inventario crítico (Top 5 con menos stock relativo)
    alertas_inventario = db.query(Medicamento).filter(
        Medicamento.farmacia_id == current_user.farmacia_id,
        Medicamento.activo == True,
        Medicamento.stock_actual <= Medicamento.stock_minimo
    ).order_by(Medicamento.stock_actual.asc()).limit(5).all()

    alertas_list = [
        {
            "nombre": m.nombre_comercial,
            "stock_actual": m.stock_actual,
            "stock_minimo": m.stock_minimo
        } for m in alertas_inventario
    ]

    return {
        "ventas_hoy": float(ventas_hoy),
        "ventas_mes": float(ventas_mes),
        "stock_bajo_count": stock_bajo_count,
        "total_productos": total_productos,
        "top_productos": top_productos_list,
        "alertas_inventario": alertas_list
    }

@router.get("/descargar/{tipo}/{formato}")
async def descargar_reporte(
    tipo: str,
    formato: str,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generar y descargar reportes en PDF o Excel"""
    data = []
    headers = []
    filename = f"reporte_{tipo}_{datetime.now().strftime('%Y%m%d')}"

    if tipo == "ventas":
        # Reporte de ventas de los últimos 30 días
        ventas = db.query(Venta).filter(
            Venta.farmacia_id == current_user.farmacia_id,
            Venta.fecha_venta >= datetime.now() - timedelta(days=30)
        ).order_by(Venta.fecha_venta.desc()).all()
        
        headers = ["Fecha", "N° Venta", "Total", "Método Pago"]
        data = [[
            v.fecha_venta.strftime("%Y-%m-%d %H:%M"),
            v.numero_venta,
            f"${float(v.total):.2f}",
            v.metodo_pago
        ] for v in ventas]

    elif tipo == "inventario":
        meds = db.query(Medicamento).filter(
            Medicamento.farmacia_id == current_user.farmacia_id,
            Medicamento.activo == True
        ).all()
        headers = ["Medicamento", "Stock Actual", "Mínimo", "Precio Venta", "Lote"]
        data = [[
            m.nombre_comercial,
            m.stock_actual,
            m.stock_minimo,
            f"${float(m.precio_venta):.2f}",
            m.lote or "N/A"
        ] for m in meds]

    elif tipo == "vencimientos":
        # Medicamentos que vencen en los próximos 60 días
        proximos_vence = db.query(Medicamento).filter(
            Medicamento.farmacia_id == current_user.farmacia_id,
            Medicamento.activo == True,
            Medicamento.fecha_vencimiento <= datetime.now().date() + timedelta(days=60)
        ).all()
        headers = ["Medicamento", "Fecha Vencimiento", "Lote", "Stock"]
        data = [[
            m.nombre_comercial,
            m.fecha_vencimiento.strftime("%Y-%m-%d") if m.fecha_vencimiento else "N/A",
            m.lote or "N/A",
            m.stock_actual
        ] for m in proximos_vence]

    elif tipo == "controlados":
        meds = db.query(Medicamento).filter(
            Medicamento.farmacia_id == current_user.farmacia_id,
            Medicamento.activo == True,
            Medicamento.es_controlado == True
        ).all()
        headers = ["Medicamento", "Stock", "Receta Requerida", "Lote"]
        data = [[
            m.nombre_comercial,
            m.stock_actual,
            "Sí" if m.requiere_receta else "No",
            m.lote or "N/A"
        ] for m in meds]
    else:
        raise HTTPException(status_code=400, detail="Tipo de reporte inválido")

    if formato == "excel":
        df = pd.DataFrame(data, columns=headers)
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Reporte')
        
        return Response(
            content=output.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}.xlsx"}
        )

    elif formato == "pdf":
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()

        # Título
        elements.append(Paragraph(f"Reporte de {tipo.capitalize()}", styles['Title']))
        elements.append(Spacer(1, 12))
        elements.append(Paragraph(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
        elements.append(Paragraph(f"Farmacia ID: {current_user.farmacia_id}", styles['Normal']))
        elements.append(Spacer(1, 24))

        # Tabla
        table_data = [headers] + data
        t = Table(table_data)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(t)
        doc.build(elements)
        
        return Response(
            content=buffer.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}.pdf"}
        )
    
    raise HTTPException(status_code=400, detail="Formato de reporte inválido")
