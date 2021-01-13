CREATE TYPE hfs_site AS ENUM (${sites:csv});
CREATE TYPE hfs_access_group AS ENUM (${accessGroupValues:csv});
CREATE TYPE hfs_gender AS ENUM (${genders:csv});
CREATE TYPE hfs_vaccination_status AS ENUM ('australia', 'overseas', 'no', 'unknown');
CREATE TYPE hfs_token_type AS ENUM ('session', 'api');

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
    "hash" char(128) UNIQUE,
    "type" hfs_token_type NOT NULL,
    "expires" timestamptz CHECK (("type" = 'session' AND "expires" IS NOT NULL) OR ("type" = 'api' AND "expires" IS NULL))
);
INSERT INTO "Token" ("user", "hash", "type", "expires") VALUES
    (${firstAdminEmail}, ${firstAdminTokenHash}, 'session', ${firstAdminTokenExpires});

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
    "redcapProjectYear" int NOT NULL CHECK ("redcapProjectYear" >= 2020 and "redcapProjectYear" <= 2021),
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
    "day" integer NOT NULL,
    "redcapProjectYear" integer NOT NULL CHECK ("redcapProjectYear" >= 2020 and "redcapProjectYear" <= 2021),
    "date" timestamptz,
    PRIMARY KEY ("pid", "day", "redcapProjectYear")
);

CREATE TABLE "WeeklySurvey" (
    "pid" text REFERENCES "Participant"("pid") ON DELETE CASCADE ON UPDATE CASCADE,
    "index" integer NOT NULL CHECK ("index" >= 1 AND "index" <= 32),
    "redcapProjectYear" integer NOT NULL CHECK ("redcapProjectYear" >= 2020 and "redcapProjectYear" <= 2021),
    "date" timestamptz,
    "ari" boolean NOT NULL,
    "swabCollection" boolean,
    PRIMARY KEY ("pid", "index", "redcapProjectYear")
);

CREATE TABLE "Virus" (
    "name" text PRIMARY KEY,
    "shortName" text NOT NULL UNIQUE,
    "clade" text NOT NULL
);

CREATE TABLE "Serology" (
    "pid" text REFERENCES "Participant"("pid") ON DELETE CASCADE ON UPDATE CASCADE,
    "redcapProjectYear" integer NOT NULL CHECK ("redcapProjectYear" >= 2020 and "redcapProjectYear" <= 2021),
    "day" integer NOT NULL,
    "virus" text REFERENCES "Virus"("name") ON DELETE CASCADE ON UPDATE CASCADE,
    "titre" integer NOT NULL,
    PRIMARY KEY ("pid", "redcapProjectYear", "day", "virus")
);
