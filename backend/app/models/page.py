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