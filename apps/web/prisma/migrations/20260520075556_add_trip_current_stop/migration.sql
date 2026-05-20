-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "busId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'FORWARD',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "lastLat" REAL,
    "lastLng" REAL,
    "lastSeenAt" DATETIME,
    "currentStopId" TEXT,
    "currentStopAt" DATETIME,
    CONSTRAINT "Trip_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Trip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Trip_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Trip_currentStopId_fkey" FOREIGN KEY ("currentStopId") REFERENCES "BusStop" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Trip" ("busId", "direction", "driverId", "endedAt", "id", "lastLat", "lastLng", "lastSeenAt", "routeId", "startedAt", "status") SELECT "busId", "direction", "driverId", "endedAt", "id", "lastLat", "lastLng", "lastSeenAt", "routeId", "startedAt", "status" FROM "Trip";
DROP TABLE "Trip";
ALTER TABLE "new_Trip" RENAME TO "Trip";
CREATE INDEX "Trip_routeId_status_idx" ON "Trip"("routeId", "status");
CREATE INDEX "Trip_busId_status_idx" ON "Trip"("busId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
