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