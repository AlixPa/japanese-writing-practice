-- depends: 00008_users
CREATE TABLE configs (
    id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    sequence TEXT NOT NULL,
    user_id VARCHAR(255) NOT NULL DEFAULT 'default',
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id)
)