CREATE TYPE hfs_site AS ENUM (${sites:csv});
CREATE TYPE hfs_access_group AS ENUM (${accessGroupValues:csv});
CREATE TYPE hfs_gender AS ENUM (${genders:csv});
CREATE TYPE hfs_vaccination_status AS ENUM ('australia', 'overseas', 'no', 'unknown');

CREATE TABLE "LastRedcapSync" (
    "user" timestamptz,
    "participant" timestamptz
);
INSERT INTO "LastRedcapSync" VALUES (NULL, NULL);

CREATE TABLE "Site" (
    "siteShort" hfs_site PRIMARY KEY,
    "siteLong" TEXT NOT NULL UNIQUE
);
INSERT INTO "Site" ("siteShort", "siteLong") VALUES
    ('adelaide', 'Adelaide Women and Children''s Hospital'),
    ('brisbane', 'Queensland Children''s Hospital'),
    ('melbourne', 'Alfred Hospital'),
    ('newcastle', 'John Hunter Hospital'),
    ('perth', 'Perth Children''s Hospital'),
    ('sydney', 'Westmead Children''s Hospital');

CREATE TABLE "User" (
    "email" text PRIMARY KEY CHECK ("email" = lower("email")),
    "accessGroup" hfs_access_group NOT NULL
);
INSERT INTO "User" ("email", "accessGroup") VALUES
    (${firstAdminEmail}, 'admin');

CREATE TABLE "Token" (
    "user" text REFERENCES "User"("email") ON DELETE CASCADE ON UPDATE CASCADE,
    -- Attempt to prevent insertion of actual tokens with a length check
    "hash" text UNIQUE CHECK (length("hash") = 128),
    "expires" timestamptz NOT NULL
);
INSERT INTO "Token" ("user", "hash", "expires") VALUES
    (${firstAdminEmail}, ${firstAdminTokenHash}, ${firstAdminTokenExpires});

-- Every participant is recruited at a site
CREATE TABLE "Participant" (
    "pid" text PRIMARY KEY,
    "site" hfs_site NOT NULL,
    "dateScreening" timestamptz,
    "email" text UNIQUE CHECK ("email" = lower("email")),
    "mobile" text UNIQUE,
    "addBleed" boolean,
    "dob" timestamptz,
    "gender" hfs_gender,
    "baselineQuestComplete" boolean NOT NULL
);

CREATE TABLE "RedcapId" (
    "redcapRecordId" text,
    "redcapProjectYear" int CHECK ("redcapProjectYear" >= 2020 and "redcapProjectYear" <= 2021),
    "pid" text NOT NULL REFERENCES "Participant"("pid") ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("redcapRecordId", "redcapProjectYear")
);

CREATE TABLE "Withdrawn" (
    "pid" text PRIMARY KEY REFERENCES "Participant"("pid") ON DELETE CASCADE ON UPDATE CASCADE,
    "date" timestamptz NOT NULL
);

CREATE TABLE "Vaccination" (
    "pid" text REFERENCES "Participant"("pid") ON DELETE CASCADE ON UPDATE CASCADE,
    "year" integer CHECK ("year" >= 2015 and "year" <= 2020),
    "status" hfs_vaccination_status,
    PRIMARY KEY ("pid", "year")
);

CREATE TABLE "Schedule" (
    "pid" text REFERENCES "Participant"("pid") ON DELETE CASCADE ON UPDATE CASCADE,
    "day" integer,
    "redcapProjectYear" integer CHECK ("redcapProjectYear" >= 2020 and "redcapProjectYear" <= 2021),
    "date" timestamptz,
    PRIMARY KEY ("pid", "day", "redcapProjectYear")
);

CREATE TABLE "WeeklySurvey" (
    "pid" text REFERENCES "Participant"("pid") ON DELETE CASCADE ON UPDATE CASCADE,
    "index" integer NOT NULL CHECK ("index" >= 1 AND "index" <= 32),
    "redcapProjectYear" integer CHECK ("redcapProjectYear" >= 2020 and "redcapProjectYear" <= 2021),
    "date" timestamptz,
    "ari" boolean NOT NULL,
    "swabCollection" boolean,
    PRIMARY KEY ("pid", "index", "redcapProjectYear")
);
