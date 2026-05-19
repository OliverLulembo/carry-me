import { db } from "./db";

export class FareNotConfiguredError extends Error {
  constructor(
    public routeId: string,
    public startStopId: string,
    public endStopId: string,
  ) {
    super("No fare configured for this stretch on this route");
    this.name = "FareNotConfiguredError";
  }
}

/** Admin-configured credits for one hop (start stop → end stop) on a route. */
export async function lookupFareCredits(
  routeId: string,
  startStopId: string,
  endStopId: string,
): Promise<number> {
  if (startStopId === endStopId) {
    throw new FareNotConfiguredError(routeId, startStopId, endStopId);
  }

  const segment = await db.fareSegment.findUnique({
    where: {
      routeId_startStopId_endStopId: {
        routeId,
        startStopId,
        endStopId,
      },
    },
  });

  if (!segment) {
    throw new FareNotConfiguredError(routeId, startStopId, endStopId);
  }

  return segment.credits;
}

/** True when the stop appears on the route's ordered stop list. */
export async function stopOnRoute(routeId: string, stopId: string): Promise<boolean> {
  const row = await db.routeStop.findUnique({
    where: { routeId_stopId: { routeId, stopId } },
  });
  return row != null;
}
