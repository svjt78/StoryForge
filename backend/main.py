# backend/main.py
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from story_generator import generate_story, generate_image
from db import SessionLocal, engine
import models
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

# Create database tables if they don't exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Story Generation Agent")

# CORS Middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class StoryRequest(BaseModel):
    genre: str
    setting: str
    characters: str
    themes: str
    additional_details: str = ""
    clarifying_responses: Optional[str] = None  # New field

    class Config:
        extra = "allow"

class ImageRequest(BaseModel):
    prompt: str

# Request model for saving a story
class SaveStoryRequest(BaseModel):
    title: str
    genre: str
    setting: str
    characters: str
    themes: str
    details: str
    status: str
    timestamp: str
    content: str

# New request model for updating a story (includes the story ID)
class UpdateStoryRequest(BaseModel):
    id: int
    title: str
    genre: str
    setting: str
    characters: str
    themes: str
    details: str
    status: str
    timestamp: str
    content: str

# Dependency for database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Story Generation API"}

# Updated: allow both with and without trailing slash
@app.post("/generate-story/")
@app.post("/generate-story")
def create_story(request: StoryRequest, db: Session = Depends(get_db)):
    user_input = request.dict()
    try:
        story_result = generate_story(user_input)
        return story_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-image")
def create_image(request: ImageRequest):
    try:
        image_url = generate_image(request.prompt)
        return {"image_url": image_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/save-story")
def save_story(request: SaveStoryRequest, db: Session = Depends(get_db)):
    new_story = models.Story(
        title=request.title,
        genre=request.genre,
        setting=request.setting,
        characters=request.characters,
        themes=request.themes,
        details=request.details,
        status=request.status,
        timestamp=request.timestamp,
        content=request.content
    )
    db.add(new_story)
    db.commit()
    db.refresh(new_story)
    return new_story

@app.get("/stories")
def get_stories(
    title: Optional[str] = None,
    genre: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: Optional[str] = "timestamp",
    order: Optional[str] = "desc",
    db: Session = Depends(get_db)
):
    query = db.query(models.Story)
    if title:
        query = query.filter(models.Story.title.ilike(f"%{title}%"))
    if genre:
        query = query.filter(models.Story.genre == genre)
    if status:
        query = query.filter(models.Story.status == status)
    allowed_sort = {
        "timestamp": models.Story.timestamp,
        "title": models.Story.title,
        "genre": models.Story.genre,
    }
    sort_column = allowed_sort.get(sort_by, models.Story.timestamp)
    if order.lower() == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    stories = query.all()
    return stories

@app.post("/update-story")
def update_story(request: UpdateStoryRequest, db: Session = Depends(get_db)):
    story = db.query(models.Story).filter(models.Story.id == request.id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    story.title = request.title
    story.genre = request.genre
    story.setting = request.setting
    story.characters = request.characters
    story.themes = request.themes
    story.details = request.details
    story.status = request.status
    story.timestamp = request.timestamp
    story.content = request.content

    db.commit()
    db.refresh(story)
    return story

@app.delete("/delete-story/{story_id}")
def delete_story(story_id: int, db: Session = Depends(get_db)):
    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    db.delete(story)
    db.commit()
    return {"message": "Story deleted successfully"}
