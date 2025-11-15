-- depends:
CREATE TABLE users (
    id VARCHAR(36) NOT NULL,
    mail VARCHAR(255),
    google_sub VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT uc_users_google_sub UNIQUE (google_sub)
);