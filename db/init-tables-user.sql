-- Assumes that the database is empty
CREATE TABLE "AccessGroup" ("name" TEXT NOT NULL PRIMARY KEY UNIQUE);
CREATE TABLE "User" (
    "email" TEXT NOT NULL PRIMARY KEY UNIQUE,
    "accessGroup" TEXT NOT NULL,
    "tokenhash" TEXT,
    FOREIGN KEY ("accessGroup") REFERENCES "AccessGroup" ("name") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE TABLE "Participant" (
    "redcapRecordId" TEXT NOT NULL PRIMARY KEY UNIQUE,
    "pid" TEXT NOT NULL UNIQUE,
    "accessGroup" TEXT NOT NULL,
    "site" TEXT NOT NULL,
    "dob" TEXT,
    "dateScreening" TEXT,
    FOREIGN KEY ("accessGroup") REFERENCES "AccessGroup" ("name") ON UPDATE CASCADE ON DELETE CASCADE
);
