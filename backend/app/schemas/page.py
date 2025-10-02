from pydantic import BaseModel
from typing import Optional

class PageBase(BaseModel):
    book_id: int
    title: str
    grid_cols: int = 3
    grid_rows: int = 3
    order: int = 0

class PageCreate(PageBase):
    pass

class PageUpdate(BaseModel):
    title: Optional[str] = None
    grid_cols: Optional[int] = None
    grid_rows: Optional[int] = None
    order: Optional[int] = None

class PageRead(PageBase):
    id: int

    class Config:
        from_attributes = True