# Import all models here for Alembic migrations
from app.core.database import Base
from app.models.farmacia import Farmacia
from app.models.user import Usuario, RolUsuario
from app.models.proveedor import Proveedor
from app.models.medicamento import Medicamento
from app.models.cliente import Cliente
from app.models.inventario import MovimientoInventario, TipoMovimiento
from app.models.venta import Venta, DetalleVenta, MetodoPago
from app.models.caja import Caja, EstadoCaja
from app.models.auditoria import Auditoria

__all__ = [
    "Base",
    "Farmacia",
    "Usuario",
    "RolUsuario",
    "Proveedor",
    "Medicamento",
    "Cliente",
    "MovimientoInventario",
    "TipoMovimiento",
    "Venta",
    "DetalleVenta",
    "MetodoPago",
    "Caja",
    "EstadoCaja",
    "Auditoria",
]
