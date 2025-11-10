-- depends: 00003_stories
CREATE TABLE wanikani_stories (
    id VARCHAR(36) NOT NULL,
    story_id VARCHAR(36) NOT NULL,
    level INTEGER NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (story_id) REFERENCES stories(id)
);

CREATE INDEX idx_wanikani_stories_level
ON wanikani_stories (level);