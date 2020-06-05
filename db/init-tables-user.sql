-- Assumes that the database is empty
CREATE TABLE "AccessGroup" ("name" TEXT NOT NULL UNIQUE);
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
    "email" TEXT NOT NULL UNIQUE,
    "accessGroup" TEXT NOT NULL,
    "tokenhash" TEXT,
    FOREIGN KEY ("accessGroup") REFERENCES "AccessGroup"("name")
);
