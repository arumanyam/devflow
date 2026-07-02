-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Dependency" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "issueId" INTEGER NOT NULL,
    "dependsOnIssueId" INTEGER NOT NULL,
    CONSTRAINT "Dependency_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Dependency_dependsOnIssueId_fkey" FOREIGN KEY ("dependsOnIssueId") REFERENCES "Issue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Dependency" ("dependsOnIssueId", "id", "issueId") SELECT "dependsOnIssueId", "id", "issueId" FROM "Dependency";
DROP TABLE "Dependency";
ALTER TABLE "new_Dependency" RENAME TO "Dependency";
CREATE UNIQUE INDEX "Dependency_issueId_dependsOnIssueId_key" ON "Dependency"("issueId", "dependsOnIssueId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
