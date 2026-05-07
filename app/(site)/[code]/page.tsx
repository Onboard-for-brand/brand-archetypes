import { notFound, redirect } from "next/navigation";
import { loadCodeStatus, loadSessionState } from "@/lib/ai/persistence";
import { ReportContent } from "./ReportContent";

export const runtime = "nodejs";

const CODE_FORMAT = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

interface PageProps {
  params: Promise<{ code: string }>;
}

/**
 * Permanent archive URL for a finished interview. Hits a code's status:
 *
 *   • completed       → render the report
 *   • active | issued → redirect to / (interview unfinished — no archive yet)
 *   • revoked | null  → 404
 *
 * URLs are normalized to uppercase — lowercase variants redirect to the
 * canonical form.
 */
export default async function ArchivePage({ params }: PageProps) {
  const { code: raw } = await params;
  const code = raw.toUpperCase();

  if (!CODE_FORMAT.test(code)) notFound();
  if (raw !== code) redirect(`/${code}`);

  const status = await loadCodeStatus(code);

  if (status === "completed") {
    const session = await loadSessionState(code);
    if (!session) notFound();
    // Guard against corrupted "completed" rows — a legitimate finished
    // interview always has a primary archetype identified. If primaryId is
    // null, the code was flipped to completed without real interview data
    // populating the radar (manual SQL test, etc.); bounce home rather than
    // rendering empty placeholders.
    if (session.radarState.primaryId === null) {
      redirect("/");
    }
    return (
      <ReportContent
        code={code}
        radarState={session.radarState}
        brandSummary={session.brandSummary}
      />
    );
  }
  if (status === "active" || status === "issued") {
    redirect("/");
  }
  // null (unknown) or "revoked"
  notFound();
}
