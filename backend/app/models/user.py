import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class RolUsuario(str, enum.Enum):
    ADMINISTRADOR = "ADMINISTRADOR"
    FARMACEUTICO = "FARMACEUTICO"
    CAJERO = "CAJERO"

class Usuario(Base):
    __tablename__ = "usuarios"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmacia_id = Column(UUID(as_uuid=True), ForeignKey("farmacias.id"), nullable=False)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    nombre_completo = Column(String(200), nullable=False)
    rol = Column(Enum(RolUsuario), nullable=False)
    activo = Column(Boolean, default=True)
    ultimo_acceso = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    farmacia = relationship("Farmacia", back_populates="usuarios")
    ventas = relationship("Venta", back_populates="usuario")
    movimientos_inventario = relationship("MovimientoInventario", back_populates="usuario")
    cajas = relationship("Caja", back_populates="usuario")
    auditorias = relationship("Auditoria", back_populates="usuario")
