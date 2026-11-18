import { auth } from "@/lib/auth";
import { LandingPage } from "@/components/landing/LandingPage";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();

  return <LandingPage user={session?.user} />;
}
