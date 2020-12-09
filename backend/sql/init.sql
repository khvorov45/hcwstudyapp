CREATE TYPE hfs_access_group AS ENUM (${accessGroupValues:csv});

CREATE TABLE "LastRedcapSync" (
    "user" timestamptz,
    "participant" timestamptz
);

CREATE TABLE "User" (
    "email" text PRIMARY KEY,
    "accessGroup" hfs_access_group NOT NULL,
    "tokenhash" text UNIQUE
);

CREATE TABLE "Participant" (
    "redcapRecordId" text PRIMARY KEY,
    "pid" text NOT NULL UNIQUE,
    "accessGroup" hfs_access_group NOT NULL,
    "site" text NOT NULL,
    "dateScreening" timestamptz,
    "email" text,
    "mobile" text,
    "addBleed" boolean,
    "dob" timestamptz,
    "gender" text,
    "withdrawn" boolean NOT NULL,
    "baselineQuestComplete" boolean NOT NULL
);

CREATE TABLE "VaccinationHistory" (
    "redcapRecordId" text NOT NULL,
    "year" integer NOT NULL,
    "status" boolean,
    PRIMARY KEY ("redcapRecordId", "year"),
    FOREIGN KEY ("redcapRecordId") REFERENCES "Participant" ("redcapRecordId") ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE "Schedule" (
    "redcapRecordId" text NOT NULL,
    "day" integer NOT NULL,
    "date" timestamptz,
    PRIMARY KEY ("redcapRecordId", "day"),
    FOREIGN KEY ("redcapRecordId") REFERENCES "Participant" ("redcapRecordId") ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE "WeeklySurvey" (
    "redcapRecordId" text NOT NULL,
    "index" integer NOT NULL,
    "date" timestamptz,
    "ari" boolean NOT NULL,
    "swabCollection" boolean,
    PRIMARY KEY ("redcapRecordId", "index"),
    FOREIGN KEY ("redcapRecordId") REFERENCES "Participant" ("redcapRecordId") ON UPDATE CASCADE ON DELETE CASCADE
);
