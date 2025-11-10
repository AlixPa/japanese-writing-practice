-- depends: 00001_audios 00006_story_chunks
CREATE TABLE story_chunk_audios (
    id VARCHAR(36) NOT NULL,
    story_chunk_id VARCHAR(36) NOT NULL,
    audio_id VARCHAR(36) NOT NULL,
    speed_percentage INTEGER NOT NULL,
    speaker_id INTEGER NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (story_chunk_id) REFERENCES story_chunks(id),
    FOREIGN KEY (audio_id) REFERENCES audios(id),
    CONSTRAINT uc_story_chunk_audios_story_chunk_speed_speaker UNIQUE (story_chunk_id, speed_percentage, speaker_id)
);

CREATE INDEX idx_story_chunk_audios_story_id
ON story_chunk_audios (story_chunk_id);