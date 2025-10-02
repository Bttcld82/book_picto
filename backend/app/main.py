from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .core.config import settings
from .db import init_db
from .api import books, pages, cards, assets, runtime, export_import

app = FastAPI(title="AAC Builder API", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

app.mount("/media", StaticFiles(directory=settings.MEDIA_DIR), name="media")

app.include_router(books.router, prefix="/api/books", tags=["books"])
app.include_router(pages.router, prefix="/api/pages", tags=["pages"])
app.include_router(cards.router, prefix="/api/cards", tags=["cards"])
app.include_router(assets.router, prefix="/api/assets", tags=["assets"])
app.include_router(runtime.router, prefix="/api/runtime", tags=["runtime"])
app.include_router(export_import.router, prefix="/api", tags=["export-import"])