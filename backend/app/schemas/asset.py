from pydantic import BaseModel
from typing import Optional

class AssetRead(BaseModel):
    id: int
    kind: str
    url: str
    alt: Optional[str] = None

    class Config:
        from_attributes = True