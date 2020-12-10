CREATE TYPE hfs_access_group AS ENUM (${accessGroupValues:csv});

CREATE TABLE "LastRedcapSync" (
    "user" timestamptz,
    "participant" timestamptz
);
INSERT INTO "LastRedcapSync" VALUES (NULL, NULL);

-- A subset of access groups corresponds to sites
CREATE TABLE "Site" (
    "accessGroup" hfs_access_group PRIMARY KEY,
    "site" TEXT NOT NULL UNIQUE
);
INSERT INTO "Site" ("accessGroup", "site") VALUES
    ('adelaide', 'Adelaide Women and Children''s Hospital'),
    ('brisbane', 'Queensland Children''s Hospital'),
    ('melbourne', 'Alfred Hospital'),
    ('newcastle', 'John Hunter Hospital'),
    ('perth', 'Perth Children''s Hospital'),
    ('sydney', 'Westmead Children''s Hospital');

CREATE TABLE "User" (
    "email" text PRIMARY KEY,
    "accessGroup" hfs_access_group NOT NULL,
    -- Attempt to prevent insertion of actual tokens with a length check
    "tokenhash" text UNIQUE CHECK (length("tokenhash") = 128)
);
INSERT INTO "User" ("email", "accessGroup", "tokenhash") VALUES
    (${firstAdminEmail}, 'admin', ${firstAdminTokenHash});

-- Every participant is recruited at a site
CREATE TABLE "Participant" (
    "pid" text PRIMARY KEY,
    "accessGroup" hfs_access_group NOT NULL REFERENCES "Site"("accessGroup"),
    "dateScreening" timestamptz,
    "email" text,
    "mobile" text,
    "addBleed" boolean,
    "dob" timestamptz,
    "gender" text,
    "baselineQuestComplete" boolean NOT NULL
);

CREATE TABLE "RedcapId" (
    "redcapRecordId" text,
    "redcapProjectYear" int,
    "pid" text NOT NULL REFERENCES "Participant"("pid"),
    PRIMARY KEY ("redcapRecordId", "redcapProjectYear")
);

CREATE TABLE "Withdrawn" (
    "pid" text PRIMARY KEY REFERENCES "Participant"("pid")
);

CREATE TABLE "VaccinationHistory" (
    "pid" text REFERENCES "Participant"("pid"),
    "year" integer,
    "status" boolean,
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
