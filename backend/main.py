# backend/main.py
from fastapi import FastAPI, HTTPException, Depends, Query
from pydantic import BaseModel
from db import SessionLocal, engine
import models
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, DateTime
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from datetime import datetime

# Create database tables if they don't exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Story Generation Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response model includes id and all story fields.
class StoryResponse(BaseModel):
    id: int
    title: str
    genre: Optional[str] = ""
    setting: Optional[str] = ""
    characters: Optional[str] = ""
    themes: Optional[str] = ""
    details: Optional[str] = ""
    status: str
    timestamp: Optional[str] = ""
    content: Optional[str] = ""
    user_id: str
    version_id: int

    class Config:
        orm_mode = True

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
    user_id: str
    version_id: int = 1

class UpdateStoryRequest(BaseModel):
    base_id: int  # the id of the version being updated from
    title: str
    genre: str
    setting: str
    characters: str
    themes: str
    details: str
    status: str
    content: str
    user_id: str

class StoryRequest(BaseModel):
    genre: str
    setting: str
    characters: str
    themes: str
    additional_details: str = ""
    clarifying_responses: Optional[str] = None

    class Config:
        extra = "allow"

class ImageRequest(BaseModel):
    prompt: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Story Generation API"}

@app.post("/generate-story/")
@app.post("/generate-story")
def create_story(request: StoryRequest, db: Session = Depends(get_db)):
    user_input = request.dict()
    try:
        from story_generator import generate_story
        story_result = generate_story(user_input)
        return story_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-image")
def create_image(request: ImageRequest):
    try:
        from story_generator import generate_image
        image_url = generate_image(request.prompt)
        return {"image_url": image_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/save-story", response_model=StoryResponse)
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
        content=request.content,
        version_id=request.version_id,
        user_id=request.user_id
    )
    db.add(new_story)
    db.commit()
    db.refresh(new_story)
    return new_story

# Updated /stories endpoint: Return only the latest version per group (grouped by Title and Genre),
# and sort using the timestamp cast to DateTime.
@app.get("/stories", response_model=List[StoryResponse])
def get_stories(
    title: Optional[str] = None,
    genre: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: Optional[str] = "timestamp",
    order: Optional[str] = "desc",
    db: Session = Depends(get_db)
):
    subq = db.query(
        models.Story.title,
        models.Story.genre,
        func.max(models.Story.version_id).label("max_version")
    ).group_by(models.Story.title, models.Story.genre).subquery()

    query = db.query(models.Story).join(
        subq, (models.Story.title == subq.c.title) &
              (models.Story.genre == subq.c.genre) &
              (models.Story.version_id == subq.c.max_version)
    )
    if title:
        query = query.filter(models.Story.title.ilike(f"%{title}%"))
    if genre:
        query = query.filter(models.Story.genre == genre)
    if status:
        query = query.filter(models.Story.status == status)
    allowed_sort = {
        "timestamp": cast(models.Story.timestamp, DateTime),
        "title": models.Story.title,
        "genre": models.Story.genre,
    }
    sort_column = allowed_sort.get(sort_by, cast(models.Story.timestamp, DateTime))
    if order.lower() == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    stories = query.all()
    return stories

# Update endpoint: If Title or Genre changes compared to the base version, create new group (version_id = 1); else increment version.
@app.post("/update-story", response_model=StoryResponse)
def update_story(request: UpdateStoryRequest, db: Session = Depends(get_db)):
    base_story = db.query(models.Story).filter(models.Story.id == request.base_id).first()
    if not base_story:
        raise HTTPException(status_code=404, detail="Base story version not found")
    
    if request.title != base_story.title or request.genre != base_story.genre:
        new_version_id = 1
    else:
        group_query = db.query(models.Story).filter(
            models.Story.title == base_story.title,
            models.Story.genre == base_story.genre
        )
        max_version_obj = group_query.order_by(models.Story.version_id.desc()).first()
        new_version_id = (max_version_obj.version_id if max_version_obj else 0) + 1

    current_timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    new_story = models.Story(
        title=request.title,
        genre=request.genre,
        setting=request.setting,
        characters=request.characters,
        themes=request.themes,
        details=request.details,
        status=request.status,
        timestamp=current_timestamp,
        content=request.content,
        version_id=new_version_id,
        user_id=request.user_id
    )
    db.add(new_story)
    db.commit()
    db.refresh(new_story)
    return new_story

# Updated delete-version endpoint: Prevent deletion of the first version if later versions exist.
@app.delete("/delete-version/{id}")
def delete_version(id: int, db: Session = Depends(get_db)):
    story_version = db.query(models.Story).filter(models.Story.id == id).first()
    if not story_version:
        raise HTTPException(status_code=404, detail="Version not found")
    # Query all versions in the group (same Title and Genre)
    group_versions = db.query(models.Story).filter(
        models.Story.title == story_version.title,
        models.Story.genre == story_version.genre
    ).all()
    if story_version.version_id == 1 and len(group_versions) > 1:
        raise HTTPException(status_code=400, detail="Cannot delete the first version while later versions exist")
    db.delete(story_version)
    db.commit()
    return {"message": "Version deleted successfully"}

# New endpoint for bulk deletion of a story group.
@app.delete("/delete-story-group/{storyId}")
def delete_story_group(storyId: int, db: Session = Depends(get_db)):
    # Fetch a version from the group using the provided storyId.
    story_instance = db.query(models.Story).filter(models.Story.id == storyId).first()
    if not story_instance:
        raise HTTPException(status_code=404, detail="Story not found")
    # Retrieve all versions with the same Title and Genre.
    group_versions = db.query(models.Story).filter(
        models.Story.title == story_instance.title,
        models.Story.genre == story_instance.genre
    ).all()
    if not group_versions:
        raise HTTPException(status_code=404, detail="No versions found for this story group")
    # Confirm deletion should be handled on frontend; here we delete all.
    for version in group_versions:
        db.delete(version)
    db.commit()
    return {"message": "All versions deleted successfully"}
    
@app.get("/version-history", response_model=List[StoryResponse])
def get_version_history(storyId: int = Query(...), db: Session = Depends(get_db)):
    # Fetch the clicked story regardless of version.
    clicked_story = db.query(models.Story).filter(models.Story.id == storyId).first()
    if not clicked_story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    # Fetch the original story (version_id == 1) based on Title and Genre.
    original = db.query(models.Story).filter(
        models.Story.title == clicked_story.title,
        models.Story.genre == clicked_story.genre,
        models.Story.version_id == 1
    ).first()
    if not original:
        raise HTTPException(status_code=404, detail="Original story not found")
    
    if original.status.lower() == "completed":
        completed_version = db.query(models.Story).filter(
            models.Story.title == original.title,
            models.Story.genre == original.genre,
            models.Story.status == "completed"
        ).first()
        return [completed_version] if completed_version else []
    else:
        versions = db.query(models.Story).filter(
            models.Story.title == original.title,
            models.Story.genre == original.genre
        ).order_by(models.Story.version_id.desc()).all()
        return versions
