-- This migration is generated automatically by Prisma when you run:
--   npx prisma migrate dev --name add_dependencies_and_logs
--
-- It is left as a placeholder here. Do not hand-edit; regenerate via Prisma
-- once schema.prisma is finalized locally.

CREATE TABLE "Dependency" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "issueId" INTEGER NOT NULL,
    "dependsOnIssueId" INTEGER NOT NULL,
    CONSTRAINT "Dependency_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Dependency_dependsOnIssueId_fkey" FOREIGN KEY ("dependsOnIssueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Dependency_issueId_dependsOnIssueId_key" ON "Dependency"("issueId", "dependsOnIssueId");

CREATE TABLE "SyncLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "source" TEXT NOT NULL,
    "eventType" TEXT,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
