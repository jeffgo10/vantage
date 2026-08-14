import { PublicTourViewer } from "@/components/viewer/public-tour-viewer";
import { getDemoTourFixture } from "./fixture";

export const metadata = {
  title: "Beautify Cozy Home · Demo",
  robots: { index: true, follow: true },
};

/** Static fixture tour — same viewer as `/t/[slug]`, no DB. */
export default function DemoTourPage() {
  const tour = getDemoTourFixture();
  return <PublicTourViewer tour={tour} />;
}
