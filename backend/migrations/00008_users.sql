-- depends:
CREATE TABLE users (
    id VARCHAR(36) NOT NULL,
    email VARCHAR(255),
    google_sub VARCHAR(255),
    PRIMARY KEY (id)
);