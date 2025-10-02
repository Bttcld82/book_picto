from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import json
import os
import zipfile
import tempfile
from ..db import SessionLocal
from ..models.book import Book
from ..models.page import Page
from ..models.card import Card
from ..models.asset import Asset
from ..core.config import settings

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/export/{book_id}")
def export_book_json(book_id: int, db: Session = Depends(get_db)):
    # Get book
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Get pages
    pages = db.query(Page).filter(Page.book_id == book_id).order_by(Page.order).all()
    
    # Get all cards for this book
    page_ids = [p.id for p in pages]
    cards = db.query(Card).filter(Card.page_id.in_(page_ids)).all() if page_ids else []
    
    # Get all assets used by cards
    asset_ids = [c.image_id for c in cards if c.image_id]
    assets = db.query(Asset).filter(Asset.id.in_(asset_ids)).all() if asset_ids else []
    
    # Build export data
    export_data = {
        "book": {
            "id": book.id,
            "title": book.title,
            "locale": book.locale,
            "home_page_id": book.home_page_id
        },
        "pages": [
            {
                "id": page.id,
                "title": page.title,
                "grid_cols": page.grid_cols,
                "grid_rows": page.grid_rows,
                "order": page.order
            }
            for page in pages
        ],
        "cards": [
            {
                "id": card.id,
                "page_id": card.page_id,
                "slot_row": card.slot_row,
                "slot_col": card.slot_col,
                "row_span": card.row_span,
                "col_span": card.col_span,
                "label": card.label,
                "image_id": card.image_id,
                "target_page_id": card.target_page_id
            }
            for card in cards
        ],
        "assets": [
            {
                "id": asset.id,
                "kind": asset.kind,
                "url": asset.url,
                "alt": asset.alt
            }
            for asset in assets
        ]
    }
    
    return export_data

@router.get("/export_zip/{book_id}")
def export_book_zip(book_id: int, db: Session = Depends(get_db)):
    # Get export data
    export_data = export_book_json(book_id, db)
    
    # Create temporary zip file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as tmp_file:
        with zipfile.ZipFile(tmp_file.name, 'w') as zip_file:
            # Add book.json
            zip_file.writestr('book.json', json.dumps(export_data, indent=2))
            
            # Add media files
            for asset in export_data['assets']:
                if asset['url'].startswith('/media/'):
                    file_path = os.path.join(settings.MEDIA_DIR, asset['url'].replace('/media/', ''))
                    if os.path.exists(file_path):
                        zip_file.write(file_path, f"media/{os.path.basename(file_path)}")
        
        book_title = export_data['book']['title'].replace(' ', '_')
        return FileResponse(
            tmp_file.name, 
            media_type='application/zip',
            filename=f"{book_title}_export.zip"
        )

@router.post("/import")
async def import_book(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="Only JSON files are supported")
    
    # Read and parse JSON
    content = await file.read()
    try:
        import_data = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")
    
    # Create new book
    book_data = import_data.get('book', {})
    new_book = Book(
        title=book_data.get('title', 'Imported Book'),
        locale=book_data.get('locale', 'it-IT')
    )
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    
    # Create pages
    page_mapping = {}
    for page_data in import_data.get('pages', []):
        new_page = Page(
            book_id=new_book.id,
            title=page_data.get('title', 'Untitled Page'),
            grid_cols=page_data.get('grid_cols', 3),
            grid_rows=page_data.get('grid_rows', 3),
            order=page_data.get('order', 0)
        )
        db.add(new_page)
        db.commit()
        db.refresh(new_page)
        page_mapping[page_data['id']] = new_page.id
    
    # Create assets (simplified - would need to handle file uploads)
    asset_mapping = {}
    for asset_data in import_data.get('assets', []):
        new_asset = Asset(
            kind=asset_data.get('kind', 'image'),
            url=asset_data.get('url', ''),
            alt=asset_data.get('alt')
        )
        db.add(new_asset)
        db.commit()
        db.refresh(new_asset)
        asset_mapping[asset_data['id']] = new_asset.id
    
    # Create cards
    for card_data in import_data.get('cards', []):
        new_card = Card(
            page_id=page_mapping.get(card_data['page_id']),
            slot_row=card_data.get('slot_row', 0),
            slot_col=card_data.get('slot_col', 0),
            row_span=card_data.get('row_span', 1),
            col_span=card_data.get('col_span', 1),
            label=card_data.get('label', ''),
            image_id=asset_mapping.get(card_data.get('image_id')) if card_data.get('image_id') else None,
            target_page_id=page_mapping.get(card_data.get('target_page_id')) if card_data.get('target_page_id') else None
        )
        db.add(new_card)
    
    # Set home page
    if book_data.get('home_page_id') and book_data['home_page_id'] in page_mapping:
        new_book.home_page_id = page_mapping[book_data['home_page_id']]
        db.commit()
    
    db.commit()
    
    return {"message": "Book imported successfully", "book_id": new_book.id}