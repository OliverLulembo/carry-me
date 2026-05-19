import { db } from "@/lib/db";
import { DevicesPanel } from "../components/DevicesPanel";

export const dynamic = "force-dynamic";

export default async function AdminDevicesPage() {
  const devices = await db.device.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { id: true, fullName: true, phone: true } },
      bus: { select: { id: true, plate: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-brand-deep">Devices</h2>
        <p className="text-sm text-ink-500 mt-1">
          Register NFC cards, phones, wristbands, and driver pads. Activate or retire credentials.
        </p>
      </div>
      <DevicesPanel initialDevices={devices} />
    </div>
  );
}
