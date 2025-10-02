from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
from ..db import SessionLocal
from ..models.asset import Asset
from ..schemas.asset import AssetRead
from ..core.config import settings

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[AssetRead])
def list_assets(db: Session = Depends(get_db)):
    return db.query(Asset).all()

@router.post("/", response_model=AssetRead)
async def upload_asset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(settings.MEDIA_DIR, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Create asset record
    db_asset = Asset(
        kind="image",
        url=f"/media/{unique_filename}",
        alt=file.filename
    )
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    
    return db_asset

@router.get("/{asset_id}", response_model=AssetRead)
def get_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@router.delete("/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Delete file if it exists
    if asset.url.startswith("/media/"):
        file_path = os.path.join(settings.MEDIA_DIR, asset.url.replace("/media/", ""))
        if os.path.exists(file_path):
            os.remove(file_path)
    
    db.delete(asset)
    db.commit()
    return {"message": "Asset deleted"}