import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Auditoria(Base):
    __tablename__ = "auditoria"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmacia_id = Column(UUID(as_uuid=True), ForeignKey("farmacias.id"), nullable=False, index=True)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False, index=True)
    
    tabla = Column(String(100), nullable=False)
    accion = Column(String(20), nullable=False)  # CREATE, UPDATE, DELETE
    
    datos_anteriores = Column(JSON, nullable=True)
    datos_nuevos = Column(JSON, nullable=True)
    
    ip_address = Column(String(50))
    user_agent = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    usuario = relationship("Usuario", back_populates="auditorias")
