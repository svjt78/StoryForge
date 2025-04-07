# backend/models.py
from sqlalchemy import Column, Integer, String, Text
from db import Base

class Story(Base):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    genre = Column(String(100))
    setting = Column(String(255))
    characters = Column(String(255))
    themes = Column(String(255))
    details = Column(Text)
    status = Column(String(50))  # e.g. "draft" or "completed"
    timestamp = Column(String(100))  # Consider using TIMESTAMP type in production
    content = Column(Text)
    version_id = Column(Integer, nullable=False, default=1)
    user_id = Column(String(255), nullable=False, default='')
