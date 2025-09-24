from src.clients.mysql import AMysqlClientReader
from src.logger import get_logger
from src.models.database import StoryTable, WanikaniStoryTable

from .models import StoryMetadata

logger = get_logger()


async def load_wanikani_stories(level: int) -> list[StoryMetadata]:
    mysql_reader = AMysqlClientReader(logger)

    wanikani_stories = await mysql_reader.select(
        table=WanikaniStoryTable, cond_equal=dict(level=level)
    )
    stories = await mysql_reader.select(
        table=StoryTable, cond_in=dict(id=[s.storyId for s in wanikani_stories])
    )

    return [
        StoryMetadata(
            story_id=story.id,
            story_text=story.text,
            story_title=story.title,
        )
        for story in stories
    ]
