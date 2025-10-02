from pydantic import BaseModel
from typing import Optional

class BookBase(BaseModel):
    title: str
    locale: str = "it-IT"

class BookCreate(BookBase):
    pass

class BookUpdate(BaseModel):
    title: Optional[str] = None
    locale: Optional[str] = None
    home_page_id: Optional[int] = None

class BookRead(BookBase):
    id: int
    home_page_id: Optional[int] = None

    class Config:
        from_attributes = True