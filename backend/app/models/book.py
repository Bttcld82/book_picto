from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from ..db import Base

class Book(Base):
    __tablename__ = "book"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    locale: Mapped[str] = mapped_column(String, default="it-IT")
    home_page_id: Mapped[int | None] = mapped_column(ForeignKey("page.id"), nullable=True)