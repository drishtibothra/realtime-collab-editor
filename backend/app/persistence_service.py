from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.document_snapshot import DocumentSnapshot


def load_snapshot_sync(document_id: str) -> bytes | None:
    db: Session = SessionLocal()
    try:
        row = db.query(DocumentSnapshot).filter(DocumentSnapshot.document_id == document_id).first()
        return bytes(row.content_state) if row else None
    finally:
        db.close()


def save_snapshot_sync(document_id: str, content_state: bytes, content_preview: str):
    db: Session = SessionLocal()
    try:
        row = db.query(DocumentSnapshot).filter(DocumentSnapshot.document_id == document_id).first()
        if row:
            row.content_state = content_state
            row.content_preview = content_preview
        else:
            row = DocumentSnapshot(
                document_id=document_id,
                content_state=content_state,
                content_preview=content_preview,
            )
            db.add(row)
        db.commit()
    finally:
        db.close()