-- Assumes that the database is empty
CREATE TABLE "AccessGroup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
    "name" TEXT NOT NULL UNIQUE
);
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
    "name" TEXT NOT NULL UNIQUE,
    "accessGroupId" INTEGER NOT NULL,
    "tokenhash" TEXT,
    FOREIGN KEY ("accessGroupId") REFERENCES "AccessGroup"("id")
);
