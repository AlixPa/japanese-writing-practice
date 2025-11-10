-- depends:
CREATE TABLE stories (
    id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    source VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
)