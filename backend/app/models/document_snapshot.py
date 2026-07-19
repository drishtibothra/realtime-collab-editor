from sqlalchemy import Column, Integer, String, LargeBinary, Text, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class DocumentSnapshot(Base):
    __tablename__ = "document_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String, unique=True, index=True, nullable=False)
    content_state = Column(LargeBinary, nullable=False)   # the authoritative CRDT-encoded state
    content_preview = Column(Text, nullable=True)          # plain-text mirror, for quick inspection only — not authoritative
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())