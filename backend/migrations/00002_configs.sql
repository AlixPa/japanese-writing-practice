-- depends:
CREATE TABLE configs (
    id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    sequence TEXT NOT NULL,
    PRIMARY KEY (id)
)