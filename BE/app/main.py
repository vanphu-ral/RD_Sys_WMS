
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter

from app.core.cache import close_cache, init_cache
from app.core.config import settings
from app.core.database import create_tables
from app.api.graphql import schema
from app.api.rest.auth import router as auth_router
from app.api.rest.misc import router as misc_router
from app.api.rest.areas import router as areas_router
from app.api.rest.locations import router as locations_router
from app.api.rest.import_requirements import router as import_req_router
from app.api.rest.inventories import router as inventories_router
from app.api.rest.iwtr import router as iwtr_router
from app.api.rest.osr import router as osr_router
from app.api.rest.external_apps import router as external_apps_router
from app.api.rest.warehouse_import import router as warehouse_import_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])

# Add Keycloak callback route
@app.get("/auth/callback")
async def auth_callback(code: str = None, state: str = None):
    """Handle Keycloak OIDC callback"""
    if code:
        # This would typically redirect to frontend with the code
        return {"message": "Authentication successful", "code": code, "state": state}
    return {"error": "No authorization code provided"}
app.include_router(misc_router, prefix="/api", tags=["Miscellaneous"])
app.include_router(areas_router, prefix="/api/areas", tags=["Areas"])
app.include_router(locations_router, prefix="/api/locations", tags=["Locations"])
app.include_router(import_req_router, prefix="/api/import-requirements", tags=["Import Requirements"])
app.include_router(inventories_router, prefix="/api/inventories", tags=["Inventories"])
app.include_router(iwtr_router, prefix="/api/iwtr", tags=["IWTR"])
app.include_router(osr_router, prefix="/api/osr", tags=["OSR"])
app.include_router(external_apps_router, prefix="/api/external-apps", tags=["External Apps"])
app.include_router(warehouse_import_router, prefix="/api/warehouse-import", tags=["Warehouse Import"])

@app.on_event("startup")
async def startup_event():
    await create_tables()
    await init_cache()

@app.on_event("shutdown")
async def shutdown_event():
    await close_cache()

graphql_app = GraphQLRouter(schema)
app.include_router(graphql_app, prefix="/graphql")

# @app.on_event("startup")
# async def startup_event():
#     await create_tables()

@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.APP_NAME}"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}