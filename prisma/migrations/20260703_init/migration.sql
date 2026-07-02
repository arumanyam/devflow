-- This migration is generated automatically by Prisma when you run:
--   npx prisma migrate dev --name init
--
-- It is left as a placeholder here. Do not hand-edit; regenerate via Prisma
-- once schema.prisma is finalized locally.

CREATE TABLE "Issue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "githubId" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "status" TEXT NOT NULL,
    "assignee" TEXT,
    "labels" TEXT,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "Issue_githubId_key" ON "Issue"("githubId");

CREATE TABLE "PullRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "githubId" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "status" TEXT NOT NULL,
    "diffSummary" TEXT,
    "riskFlag" TEXT,
    "linkedIssue" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "PullRequest_githubId_key" ON "PullRequest"("githubId");
