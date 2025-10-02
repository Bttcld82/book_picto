from pydantic import BaseModel
from typing import Optional

class CardBase(BaseModel):
    page_id: int
    slot_row: int
    slot_col: int
    row_span: int = 1
    col_span: int = 1
    label: str

class CardCreate(CardBase):
    image_id: Optional[int] = None
    target_page_id: Optional[int] = None

class CardUpdate(BaseModel):
    slot_row: Optional[int] = None
    slot_col: Optional[int] = None
    row_span: Optional[int] = None
    col_span: Optional[int] = None
    label: Optional[str] = None
    image_id: Optional[int] = None
    target_page_id: Optional[int] = None

class CardRead(CardBase):
    id: int
    image_id: Optional[int] = None
    target_page_id: Optional[int] = None
    target_page_title: Optional[str] = None

    class Config:
        from_attributes = True