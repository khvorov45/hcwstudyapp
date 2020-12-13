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
    "accessGroup" hfs_access_group NOT NULL,
    -- Attempt to prevent insertion of actual tokens with a length check
    "tokenhash" text UNIQUE CHECK (length("tokenhash") = 128)
);
INSERT INTO "User" ("email", "accessGroup", "tokenhash") VALUES
    (${firstAdminEmail}, 'admin', ${firstAdminTokenHash});

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
    "pid" text NOT NULL REFERENCES "Participant"("pid") ON DELETE CASCADE,
    PRIMARY KEY ("redcapRecordId", "redcapProjectYear")
);

CREATE TABLE "Withdrawn" (
    "pid" text PRIMARY KEY REFERENCES "Participant"("pid") ON DELETE CASCADE,
    "date" timestamptz NOT NULL
);

CREATE TABLE "Vaccination" (
    "pid" text REFERENCES "Participant"("pid") ON DELETE CASCADE,
    "year" integer CHECK ("year" >= 2015 and "year" <= 2020),
    "status" hfs_vaccination_status,
    PRIMARY KEY ("pid", "year")
);

CREATE TABLE "Schedule" (
    "pid" text REFERENCES "Participant"("pid"),
    "day" integer,
    "date" timestamptz,
    PRIMARY KEY ("pid", "day")
);

CREATE TABLE "WeeklySurvey" (
    "pid" text REFERENCES "Participant"("pid"),
    "index" integer NOT NULL,
    "date" timestamptz,
    "ari" boolean NOT NULL,
    "swabCollection" boolean,
    PRIMARY KEY ("pid", "index")
);
