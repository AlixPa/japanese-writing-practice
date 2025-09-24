from pydantic import BaseModel


class StoryMetadata(BaseModel):
    story_id: str
    story_text: str
    story_title: str
