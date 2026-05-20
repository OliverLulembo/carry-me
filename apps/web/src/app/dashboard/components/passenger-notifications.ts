export type PassengerNotification = {
  id: string;
  type: "bus_boarding";
  tripId: string;
  busPlate: string;
  routeName: string;
  stopName: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export function createBoardingNotification(params: {
  tripId: string;
  busPlate: string;
  routeName: string;
  stopName: string;
}): PassengerNotification {
  const { tripId, busPlate, routeName, stopName } = params;
  return {
    id: `boarding-${tripId}-${Date.now()}`,
    type: "bus_boarding",
    tripId,
    busPlate,
    routeName,
    stopName,
    title: "Bus boarding at your stop",
    message: `${busPlate} (${routeName}) is boarding at ${stopName}. Tap to board when you're ready.`,
    createdAt: new Date().toISOString(),
    read: false,
  };
}
