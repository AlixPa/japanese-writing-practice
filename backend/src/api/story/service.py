from src.clients.sqlite import SQLiteClient
from src.logger import get_logger
from src.models.database import Stories, WanikaniStories

from .models import StoryMetadata

logger = get_logger()


async def load_wanikani_stories(level: int) -> list[StoryMetadata]:
    sqlite = SQLiteClient(logger)

    wanikani_stories = sqlite.select(
        table=WanikaniStories, cond_equal=dict(level=level)
    )
    stories = sqlite.select(
        table=Stories, cond_in=dict(id=[s.story_id for s in wanikani_stories])
    )

    return [
        StoryMetadata(
            story_id=story.id,
            story_text=story.text,
            story_title=story.title,
        )
        for story in stories
    ]
