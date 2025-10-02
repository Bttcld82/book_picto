from sqlalchemy.orm import Session
from app.db import SessionLocal, init_db
from app.models.book import Book
from app.models.page import Page
from app.models.card import Card
from app.models.asset import Asset

def seed_data():
    init_db()
    db = SessionLocal()
    
    try:
        # Check if data already exists
        if db.query(Book).first():
            print("Seed data already exists, skipping...")
            return
        
        # Create a book
        book = Book(title="Il mio comunicatore", locale="it-IT")
        db.add(book)
        db.commit()
        db.refresh(book)
        
        # Create pages
        home_page = Page(book_id=book.id, title="Home", grid_cols=3, grid_rows=3, order=0)
        db.add(home_page)
        db.commit()
        db.refresh(home_page)
        
        drinks_page = Page(book_id=book.id, title="Bevande", grid_cols=3, grid_rows=3, order=1)
        db.add(drinks_page)
        db.commit()
        db.refresh(drinks_page)
        
        food_page = Page(book_id=book.id, title="Cibi", grid_cols=3, grid_rows=3, order=2)
        db.add(food_page)
        db.commit()
        db.refresh(food_page)
        
        # Set home page
        book.home_page_id = home_page.id
        db.commit()
        
        # Create cards for home page
        home_cards = [
            Card(page_id=home_page.id, slot_row=0, slot_col=0, label="Bevande", target_page_id=drinks_page.id),
            Card(page_id=home_page.id, slot_row=0, slot_col=1, label="Cibi", target_page_id=food_page.id),
            Card(page_id=home_page.id, slot_row=1, slot_col=0, label="Ciao", row_span=1, col_span=2),
        ]
        
        for card in home_cards:
            db.add(card)
        
        # Create cards for drinks page
        drinks_cards = [
            Card(page_id=drinks_page.id, slot_row=0, slot_col=0, label="Acqua"),
            Card(page_id=drinks_page.id, slot_row=0, slot_col=1, label="Succo"),
            Card(page_id=drinks_page.id, slot_row=0, slot_col=2, label="Latte"),
            Card(page_id=drinks_page.id, slot_row=2, slot_col=0, label="Home", target_page_id=home_page.id),
        ]
        
        for card in drinks_cards:
            db.add(card)
        
        # Create cards for food page
        food_cards = [
            Card(page_id=food_page.id, slot_row=0, slot_col=0, label="Pane"),
            Card(page_id=food_page.id, slot_row=0, slot_col=1, label="Pasta"),
            Card(page_id=food_page.id, slot_row=0, slot_col=2, label="Pizza"),
            Card(page_id=food_page.id, slot_row=2, slot_col=0, label="Home", target_page_id=home_page.id),
        ]
        
        for card in food_cards:
            db.add(card)
        
        db.commit()
        
        print(f"Seed OK - Book ID: {book.id}")
        print(f"Home Page ID: {home_page.id}")
        print(f"Drinks Page ID: {drinks_page.id}")
        print(f"Food Page ID: {food_page.id}")
        
    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()