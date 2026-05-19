import { redirect } from "next/navigation";
import { requireOwnerPage } from "@/lib/owner";

export const dynamic = "force-dynamic";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const session = await requireOwnerPage();
  if (!session) {
    redirect("/login/owner?redirect=%2Fowner%2Fdashboard");
  }

  return <>{children}</>;
}
