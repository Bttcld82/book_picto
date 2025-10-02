from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from ..db import SessionLocal
from ..models.card import Card
from ..models.page import Page
from ..schemas.card import CardCreate, CardUpdate, CardRead

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_card_overlap(db: Session, page_id: int, slot_row: int, slot_col: int, row_span: int, col_span: int, card_id: int = None):
    """Check if a card position overlaps with existing cards"""
    query = db.query(Card).filter(Card.page_id == page_id)
    if card_id:
        query = query.filter(Card.id != card_id)
    
    existing_cards = query.all()
    
    for card in existing_cards:
        # Check if ranges overlap
        if (slot_row < card.slot_row + card.row_span and 
            slot_row + row_span > card.slot_row and
            slot_col < card.slot_col + card.col_span and 
            slot_col + col_span > card.slot_col):
            return True
    return False

@router.get("/", response_model=List[CardRead])
def list_cards(page_id: int = None, db: Session = Depends(get_db)):
    # Query with LEFT JOIN to get target_page_title
    query = db.query(
        Card.id,
        Card.page_id,
        Card.slot_row,
        Card.slot_col,
        Card.row_span,
        Card.col_span,
        Card.label,
        Card.image_id,
        Card.target_page_id,
        Page.title.label("target_page_title")
    ).outerjoin(Page, Card.target_page_id == Page.id)
    
    if page_id:
        query = query.filter(Card.page_id == page_id)
    
    results = query.all()
    
    # Convert to CardRead objects
    cards = []
    for result in results:
        card_dict = {
            "id": result.id,
            "page_id": result.page_id,
            "slot_row": result.slot_row,
            "slot_col": result.slot_col,
            "row_span": result.row_span,
            "col_span": result.col_span,
            "label": result.label,
            "image_id": result.image_id,
            "target_page_id": result.target_page_id,
            "target_page_title": result.target_page_title
        }
        cards.append(CardRead(**card_dict))
    
    return cards

@router.post("/", response_model=CardRead)
def create_card(card: CardCreate, db: Session = Depends(get_db)):
    # Check for overlap
    if check_card_overlap(db, card.page_id, card.slot_row, card.slot_col, card.row_span, card.col_span):
        raise HTTPException(status_code=400, detail="Card position overlaps with existing card")
    
    db_card = Card(**card.model_dump())
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    
    # Get target_page_title for response
    result = db.query(
        Card.id,
        Card.page_id,
        Card.slot_row,
        Card.slot_col,
        Card.row_span,
        Card.col_span,
        Card.label,
        Card.image_id,
        Card.target_page_id,
        Page.title.label("target_page_title")
    ).outerjoin(Page, Card.target_page_id == Page.id).filter(Card.id == db_card.id).first()
    
    card_dict = {
        "id": result.id,
        "page_id": result.page_id,
        "slot_row": result.slot_row,
        "slot_col": result.slot_col,
        "row_span": result.row_span,
        "col_span": result.col_span,
        "label": result.label,
        "image_id": result.image_id,
        "target_page_id": result.target_page_id,
        "target_page_title": result.target_page_title
    }
    
    return CardRead(**card_dict)

@router.get("/{card_id}", response_model=CardRead)
def get_card(card_id: int, db: Session = Depends(get_db)):
    # Query with LEFT JOIN to get target_page_title
    result = db.query(
        Card.id,
        Card.page_id,
        Card.slot_row,
        Card.slot_col,
        Card.row_span,
        Card.col_span,
        Card.label,
        Card.image_id,
        Card.target_page_id,
        Page.title.label("target_page_title")
    ).outerjoin(Page, Card.target_page_id == Page.id).filter(Card.id == card_id).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Card not found")
    
    card_dict = {
        "id": result.id,
        "page_id": result.page_id,
        "slot_row": result.slot_row,
        "slot_col": result.slot_col,
        "row_span": result.row_span,
        "col_span": result.col_span,
        "label": result.label,
        "image_id": result.image_id,
        "target_page_id": result.target_page_id,
        "target_page_title": result.target_page_title
    }
    
    return CardRead(**card_dict)

@router.patch("/{card_id}", response_model=CardRead)
def update_card(card_id: int, card_update: CardUpdate, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    update_data = card_update.model_dump(exclude_unset=True)
    
    # Check for overlap if position is being updated
    if any(field in update_data for field in ['slot_row', 'slot_col', 'row_span', 'col_span']):
        new_row = update_data.get('slot_row', card.slot_row)
        new_col = update_data.get('slot_col', card.slot_col)
        new_row_span = update_data.get('row_span', card.row_span)
        new_col_span = update_data.get('col_span', card.col_span)
        
        if check_card_overlap(db, card.page_id, new_row, new_col, new_row_span, new_col_span, card.id):
            raise HTTPException(status_code=400, detail="Card position overlaps with existing card")
    
    for field, value in update_data.items():
        setattr(card, field, value)
    
    db.commit()
    db.refresh(card)
    
    # Get target_page_title for response
    result = db.query(
        Card.id,
        Card.page_id,
        Card.slot_row,
        Card.slot_col,
        Card.row_span,
        Card.col_span,
        Card.label,
        Card.image_id,
        Card.target_page_id,
        Page.title.label("target_page_title")
    ).outerjoin(Page, Card.target_page_id == Page.id).filter(Card.id == card.id).first()
    
    card_dict = {
        "id": result.id,
        "page_id": result.page_id,
        "slot_row": result.slot_row,
        "slot_col": result.slot_col,
        "row_span": result.row_span,
        "col_span": result.col_span,
        "label": result.label,
        "image_id": result.image_id,
        "target_page_id": result.target_page_id,
        "target_page_title": result.target_page_title
    }
    
    return CardRead(**card_dict)

@router.delete("/{card_id}")
def delete_card(card_id: int, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    db.delete(card)
    db.commit()
    return {"message": "Card deleted"}