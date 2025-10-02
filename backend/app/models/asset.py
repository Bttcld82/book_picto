from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from ..db import Base

class Asset(Base):
    __tablename__ = "asset"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    kind: Mapped[str] = mapped_column(String, nullable=False)  # 'image'
    url: Mapped[str] = mapped_column(String, nullable=False)
    alt: Mapped[str | None] = mapped_column(String, nullable=True)