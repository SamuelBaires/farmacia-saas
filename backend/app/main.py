from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.api.routes import auth, medicamentos, pos, clientes, proveedores, reportes, configuracion

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Sistema SaaS de Gestión de Farmacia - El Salvador"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(medicamentos.router, prefix="/api")
app.include_router(pos.router, prefix="/api")
app.include_router(clientes.router, prefix="/api")
app.include_router(proveedores.router, prefix="/api")
app.include_router(reportes.router, prefix="/api")
app.include_router(configuracion.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "Farmacia SaaS API",
        "version": settings.APP_VERSION,
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
