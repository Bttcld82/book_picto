from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..models.book import Book
from ..models.page import Page
from ..models.card import Card
from ..models.asset import Asset

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/books/{book_id}/pages/{page_id}")
def get_runtime_page(book_id: int, page_id: int, db: Session = Depends(get_db)):
    # Get book
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Get page
    page = db.query(Page).filter(Page.id == page_id, Page.book_id == book_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # Get cards for this page
    cards = db.query(Card).filter(Card.page_id == page_id).all()
    
    # Enrich cards with asset and target page info
    enriched_cards = []
    for card in cards:
        card_data = {
            "id": card.id,
            "slot_row": card.slot_row,
            "slot_col": card.slot_col,
            "row_span": card.row_span,
            "col_span": card.col_span,
            "label": card.label,
            "image": None,
            "target_page": None
        }
        
        # Add image info
        if card.image_id:
            asset = db.query(Asset).filter(Asset.id == card.image_id).first()
            if asset:
                card_data["image"] = {
                    "id": asset.id,
                    "url": asset.url,
                    "alt": asset.alt
                }
        
        # Add target page info
        if card.target_page_id:
            target_page = db.query(Page).filter(Page.id == card.target_page_id).first()
            if target_page:
                card_data["target_page"] = {
                    "id": target_page.id,
                    "title": target_page.title
                }
        
        enriched_cards.append(card_data)
    
    return {
        "book": {
            "id": book.id,
            "title": book.title,
            "locale": book.locale
        },
        "page": {
            "id": page.id,
            "title": page.title,
            "grid_cols": page.grid_cols,
            "grid_rows": page.grid_rows
        },
        "cards": enriched_cards
    }