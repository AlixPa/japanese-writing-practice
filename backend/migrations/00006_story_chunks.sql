-- depends: 00003_stories
CREATE TABLE story_chunks (
    id VARCHAR(36) NOT NULL,
    story_id VARCHAR(36) NOT NULL,
    text TEXT NOT NULL,
    position INTEGER NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (story_id) REFERENCES stories(id),
    CONSTRAINT uc_story_chunks_story_position UNIQUE (story_id, position)
);

CREATE INDEX idx_story_chunks_story_id
ON story_chunks (story_id);