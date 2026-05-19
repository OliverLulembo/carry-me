import { db } from "./db";

export async function rebuildFareMatrix(routeId: string, stopIds: string[]) {
  await db.fareSegment.deleteMany({ where: { routeId } });
  for (let i = 0; i < stopIds.length; i++) {
    for (let j = 0; j < stopIds.length; j++) {
      if (i === j) continue;
      const distance = Math.abs(j - i);
      await db.fareSegment.create({
        data: {
          routeId,
          startStopId: stopIds[i],
          endStopId: stopIds[j],
          credits: 4 * distance,
        },
      });
    }
  }
}
