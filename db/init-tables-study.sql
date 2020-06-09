-- Assumes that the database is empty
CREATE TABLE "Participant" (
    "redcapRecordId" TEXT NOT NULL PRIMARY KEY UNIQUE,
    "pid" TEXT NOT NULL UNIQUE,
    "site" TEXT NOT NULL
);
