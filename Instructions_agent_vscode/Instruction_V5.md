# Copilot Agent — Instruction File (AAC Builder v5)

> **Obiettivo**: far eseguire a **VS Code + Copilot (Agent/Chat)** la creazione completa del progetto *AAC Builder v5* (FastAPI + Next.js) con builder drag&drop, runtime, export ZIP, Docker, e workflow CI. Segui le **Prompt Cards** qui sotto *nell’ordine*. Dove vedi un blocco di codice “CREA QUESTO FILE”, Copilot deve creare esattamente quel file con quel contenuto.

---

## 0) Prerequisiti

* VS Code aggiornato con **GitHub Copilot** e **Copilot Chat (Agents)**.
* Docker Desktop (o Podman compatibile).
* Node.js 20+, Python 3.11+ (opzionali: useremo Docker).

---

## 1) Prompt Card — Setup repository

**A Copilot Chat:**

> *Agisci come Tech Lead.* Crea una cartella di progetto chiamata `aac-builder`. Aggiungi `compose.yaml`, `Makefile`, cartelle `backend/`, `frontend/`, `docker/`, `.github/workflows/`. Configura Docker Compose per due servizi: `backend` (FastAPI) e `frontend` (Next.js). Prepara Git con un primo commit.

**Accettazione:**

* Esiste la root `aac-builder/` con sottocartelle indicate.
* `compose.yaml` e `Makefile` presenti.

**CREA QUESTI FILE (contenuto esatto):**

**`compose.yaml`**

```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: ../docker/backend.Dockerfile
    environment:
      - APP_ENV=dev
      - DB_URL=sqlite:///./data.db
      - CORS_ORIGINS=http://localhost:3000
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/frontend.Dockerfile
    environment:
      - NEXT_PUBLIC_API_BASE=http://localhost:8000
    volumes:
      - ./frontend:/app
    ports:
      - "3000:3000"
    command: npm run dev
```

**`Makefile`**

```makefile
up:
	docker compose up --build
down:
	docker compose down
logs:
	docker compose logs -f
be:
	docker compose exec backend bash
fe:
	docker compose exec frontend sh
seed:
	docker compose exec backend python -m app.seed
```

**`.gitignore`**

```gitignore
# node
frontend/node_modules/
frontend/.next/
# python
backend/.venv/
__pycache__/
*.pyc
# docker
*.log
# local db/media
backend/data.db
backend/media/
```

---

## 2) Prompt Card — Dockerfiles

**A Copilot Chat:**

> Crea i Dockerfile per backend e frontend come sotto. Il backend deve avere `zip` per l'export ZIP.

**`docker/backend.Dockerfile`**

```dockerfile
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y build-essential zip && rm -rf /var/lib/apt/lists/*
COPY backend/pyproject.toml backend/README.md /app/
RUN pip install --no-cache-dir -e .
COPY backend /app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**`docker/frontend.Dockerfile`**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* frontend/pnpm-lock.yaml* /app/
RUN npm install
COPY frontend /app
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

---

## 3) Prompt Card — Backend FastAPI (struttura + dipendenze)

**A Copilot Chat:**

> Nel folder `backend/` crea la struttura `app/{api,core,models,schemas}` e i file base indicati qui. Usa SQLite di default. Genera `pyproject.toml` con dipendenze FastAPI, SQLAlchemy, pydantic, pydantic-settings e python-multipart.

**`backend/pyproject.toml`**

```toml
[build-system]
requires = ["setuptools", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "aac-backend"
version = "0.1.5"
requires-python = ">=3.11"
dependencies = [
  "fastapi>=0.115.0",
  "uvicorn[standard]>=0.30.0",
  "pydantic>=2.9.0",
  "pydantic-settings>=2.4.0",
  "SQLAlchemy>=2.0.0",
  "python-multipart>=0.0.9",
]
```

**`backend/app/core/config.py`**

```python
from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    APP_ENV: str = "dev"
    DB_URL: str = "sqlite:///./data.db"
    CORS_ORIGINS: str = "http://localhost:3000"
    MEDIA_DIR: str = "media"

settings = Settings()
os.makedirs(settings.MEDIA_DIR, exist_ok=True)
```

**`backend/app/db.py`**

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from .core.config import settings

engine = create_engine(
    settings.DB_URL,
    connect_args={"check_same_thread": False} if settings.DB_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass

def init_db():
    from .models import book, page, asset, card  # noqa
    Base.metadata.create_all(bind=engine)
```

**`backend/app/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .core.config import settings
from .db import init_db
from .api import books, pages, cards, assets, runtime, export_import

app = FastAPI(title="AAC Builder API", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CORS_ORIGINS],
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
```

---

## 4) Prompt Card — Modelli e Schemi

**A Copilot Chat:**

> Crea i modelli SQLAlchemy `Book`, `Page`, `Card`, `Asset` come sotto, con `Book.home_page_id`. Crea gli schemi Pydantic corrispondenti.

**`backend/app/models/book.py`**

```python
from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from ..db import Base

class Book(Base):
    __tablename__ = "book"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    locale: Mapped[str] = mapped_column(String, default="it-IT")
    home_page_id: Mapped[int | None] = mapped_column(ForeignKey("page.id"), nullable=True)
```

**`backend/app/models/page.py`**

```python
from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from ..db import Base

class Page(Base):
    __tablename__ = "page"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    book_id: Mapped[int] = mapped_column(ForeignKey("book.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    grid_cols: Mapped[int] = mapped_column(Integer, default=3)
    grid_rows: Mapped[int] = mapped_column(Integer, default=3)
    order: Mapped[int] = mapped_column(Integer, default=0)
```

**`backend/app/models/asset.py`**

```python
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from ..db import Base

class Asset(Base):
    __tablename__ = "asset"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    kind: Mapped[str] = mapped_column(String, nullable=False)  # 'image'
    url: Mapped[str] = mapped_column(String, nullable=False)
    alt: Mapped[str | None] = mapped_column(String, nullable=True)
```

**`backend/app/models/card.py`**

```python
from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from ..db import Base

class Card(Base):
    __tablename__ = "card"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    page_id: Mapped[int] = mapped_column(ForeignKey("page.id"), nullable=False)
    slot_row: Mapped[int] = mapped_column(Integer, nullable=False)
    slot_col: Mapped[int] = mapped_column(Integer, nullable=False)
    row_span: Mapped[int] = mapped_column(Integer, default=1)
    col_span: Mapped[int] = mapped_column(Integer, default=1)
    label: Mapped[str] = mapped_column(String, nullable=False)
    image_id: Mapped[int | None] = mapped_column(ForeignKey("asset.id"), nullable=True)
    target_page_id: Mapped[int | None] = mapped_column(ForeignKey("page.id"), nullable=True)
```

**`backend/app/schemas/*.py`** (book, page, asset, card) — *inserisci i contenuti come nelle versioni precedenti (v4/v5) con `BookCreate/Update/Read`, `PageCreate/Update/Read`, `AssetRead`, `CardCreate/Update/Read`.*

---

## 5) Prompt Card — API Routers

**A Copilot Chat:**

> Implementa i router: `books.py`, `pages.py`, `cards.py`, `assets.py`, `runtime.py`, `export_import.py` con gli endpoint esatti di v5. Includi: controllo overlap per le card, listing pagine per book, `/media` static, `GET /api/export/{book_id}`, `GET /api/export_zip/{book_id}`, `POST /api/import`.

**Accettazione:**

* Docs su `/docs` funzionanti.
* Upload immagine su `/api/assets` salva file in `/media/*` e torna `{id,url,alt}`.
* Export ZIP scarica `book.json` + media.

*(Per brevità, Copilot deve usare i contenuti mostrati nelle nostre versioni v4/v5: copia/incolla dai blocchi sopra. Se necessario chiedi “copy from previous messages”.)*

---

## 6) Prompt Card — Seed dati

**A Copilot Chat:**

> Crea `backend/app/seed.py` che inizializza DB, crea 1 libro, 3 pagine (Home/Bevande/Cibi), setta `home_page_id`, e inserisce alcune card con link interni.

**Accettazione:**

* Eseguendo `docker compose exec backend python -m app.seed` stampa `Seed OK` e ID.

---

## 7) Prompt Card — Frontend Next.js

**A Copilot Chat:**

> In `frontend/` inizializza Next.js (App Router, TS). Aggiungi `package.json` con dipendenze: `@dnd-kit/*`, `react-hook-form`, `zod`, `axios`. Crea pagine:
>
> * `app/books/[bookId]/pages/[pageId]/page.tsx` (Runtime)
> * `app/builder/books/[bookId]/pages/[pageId]/page.tsx` (Builder DnD)
>   e `lib/api.ts` per le chiamate HTTP.

**Accettazione:**

* Runtime mostra griglia e link card.
* Builder: drag&drop, pannello proprietà (etichetta, immagine upload, autocomplete pagine, Row/ColSpan ±), create/delete card, set Home, export ZIP, import JSON.

*(Copilot deve usare i contenuti v5 riportati sopra — copia/incolla i file completi.)*

---

## 8) Prompt Card — GitHub Actions (CI)

**A Copilot Chat:**

> Crea `.github/workflows/ci.yml` con due job: backend (setup python, install, compileall) e frontend (setup node, install, build). Esegui lint/build base.

**`ci.yml`**

```yaml
name: CI
on: [push, pull_request]
jobs:
  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install -e .
      - run: python -m compileall app || true
  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci || npm install
      - run: npm run build --if-present
```

---

## 9) Prompt Card — Avvio e verifica

**A Copilot Chat:**

> Avvia lo stack e verifica i flussi:
>
> 1. `make up`
> 2. `make seed`
> 3. Apri [http://localhost:8000/docs](http://localhost:8000/docs) (API OK)
> 4. Runtime: [http://localhost:3000/books/1/pages/1](http://localhost:3000/books/1/pages/1)
> 5. Builder: [http://localhost:3000/builder/books/1/pages/1](http://localhost:3000/builder/books/1/pages/1)
> 6. Carica un’immagine su una card e verifica che compaia in runtime.
> 7. Prova export ZIP: [http://localhost:8000/api/export_zip/1](http://localhost:8000/api/export_zip/1) (scarica zip con JSON + media)

**Accettazione:**

* Nessun errore nei log.
* Overlap bloccato a livello API.
* Export ZIP contiene `book.json` + /media/* effettivamente usati.

---

## 10) Prompt Card — Hardening & TODO

**A Copilot Chat:**

> Apri issue e TODO:
>
> * Auth/JWT e ruoli (editor/terapista/genitore).
> * TTS/Audio: modello `Action` con `type` e payload.
> * Accessibilità avanzata (scanning, high-contrast, focus management).
> * Media pipeline (resize/cleanup, export ZIP completo, magari s3 in prod).
> * Test (pytest) e lint (ruff/mypy) backend; ESLint/Prettier/TS strict frontend.
> * Deploy prod con Nginx reverse proxy + HTTPS.

---

## 11) Comandi utili

```bash
make up        # avvia stack docker
make down      # ferma
make logs      # tail dei log
make be        # shell nel container backend
make fe        # shell nel container frontend
make seed      # popola dati demo
```

---

### Nota finale

Se l’Agent di Copilot tende a semplificare, **incolla i blocchi “CREA QUESTO FILE”** uno alla volta e chiedi “crea il file *esattamente* con questo contenuto”. Dopo ogni card, chiedi un **diff** (`git status`, `git diff`) per verificare che il contenuto sia aderente. Se serve velocità, fagli creare un unico script `create_aac_builder_v5.sh` (come in v5) e poi eseguilo.
