from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..db import SessionLocal
from ..models.page import Page
from ..schemas.page import PageCreate, PageUpdate, PageRead

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[PageRead])
def list_pages(book_id: int = None, db: Session = Depends(get_db)):
    query = db.query(Page)
    if book_id:
        query = query.filter(Page.book_id == book_id)
    return query.order_by(Page.order).all()

@router.post("/", response_model=PageRead)
def create_page(page: PageCreate, db: Session = Depends(get_db)):
    db_page = Page(**page.model_dump())
    db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page

@router.get("/{page_id}", response_model=PageRead)
def get_page(page_id: int, db: Session = Depends(get_db)):
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@router.patch("/{page_id}", response_model=PageRead)
def update_page(page_id: int, page_update: PageUpdate, db: Session = Depends(get_db)):
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    update_data = page_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(page, field, value)
    
    db.commit()
    db.refresh(page)
    return page

@router.delete("/{page_id}")
def delete_page(page_id: int, db: Session = Depends(get_db)):
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    db.delete(page)
    db.commit()
    return {"message": "Page deleted"}