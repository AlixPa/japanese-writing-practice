-- depends: 00001_audios 00003_stories
CREATE TABLE story_audios (
    id VARCHAR(36) NOT NULL,
    story_id VARCHAR(36) NOT NULL,
    audio_id VARCHAR(36) NOT NULL,
    speed_percentage INTEGER NOT NULL,
    speaker_id INTEGER NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (story_id) REFERENCES stories(id),
    FOREIGN KEY (audio_id) REFERENCES audios(id),
    CONSTRAINT uc_story_audios_story_speed_speaker UNIQUE (story_id, speed_percentage, speaker_id)
);

CREATE INDEX idx_story_audios_story_id
ON story_audios (story_id);