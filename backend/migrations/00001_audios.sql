-- depends:
CREATE TABLE audios (
    id VARCHAR(36) NOT NULL,
    url VARCHAR(255) NOT NULL,
    format VARCHAR(20) NOT NULL DEFAULT 'WAV',
    PRIMARY KEY (id),
    CONSTRAINT uc_audios_url UNIQUE (url)
)