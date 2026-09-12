import type { GeofenceDepartEvent, Thresholds } from "../api";

function fmtMin(min: number) {
  const m = Math.max(0, Math.round(min));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return h > 0 ? `${h}h ${rem}m` : `${rem}m`;
}

export default function DockWaitCard({
  status,
  dwellStartAt,
  now,
  hosRemaining,
  thresholds,
  realDepartEvent,
  onAlertDispatcher,
  alerted,
}: {
  status: "driving" | "dwelling" | null;
  dwellStartAt: number | null;
  now: number;
  hosRemaining: number | null;
  thresholds: Thresholds | null;
  realDepartEvent: GeofenceDepartEvent | null;
  onAlertDispatcher: () => void;
  alerted: boolean;
}) {
  if (status !== "dwelling") {
    return (
      <div className="card">
        <div className="card-title">
          <span>Dock Wait</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Not currently waiting at a dock.</p>
      </div>
    );
  }

  // Real depart event already recorded by RoadPilot's simulation engine — dwell is over,
  // the server has already computed the final numbers, so show those instead of estimating.
  if (realDepartEvent) {
    return (
      <div className="card" style={{ borderColor: "var(--ok)" }}>
        <div className="card-title">
          <span>Dock Wait Ended</span>
          <span className="badge live">Server-confirmed</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Actual dwell time</span>
          <span className="metric-value">{realDepartEvent.real_dwell_hours.toFixed(1)}h</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Detention charge</span>
          <span className={`metric-value ${realDepartEvent.detention_fee > 0 ? "warning" : "ok"}`}>
            ${realDepartEvent.detention_fee.toFixed(0)} CAD
          </span>
        </div>
      </div>
    );
  }

  const freeHours = thresholds?.detentionThresholdHours ?? 2;
  const rate = thresholds?.detentionRatePerHourCAD ?? 75;
  const elapsedMin = dwellStartAt ? (now - dwellStartAt) / 60000 : 0;
  const freeMinTotal = freeHours * 60;
  const freeRemainingMin = freeMinTotal - elapsedMin;
  const accruing = freeRemainingMin <= 0;
  const estFee = accruing ? (elapsedMin / 60 - freeHours) * rate : 0;

  // How long until this driver runs out of driving HOS while still sitting in this queue —
  // the exact "edge case" the hackathon brief calls out.
  const minutesToHosExhaustion = hosRemaining !== null ? hosRemaining * 60 : null;

  return (
    <div className="card" style={{ borderColor: accruing ? "var(--warning)" : "var(--border)" }}>
      <div className="card-title">
        <span>Waiting at Dock</span>
        <span className="badge live">{dwellStartAt ? "Live" : "Awaiting observation"}</span>
      </div>

      {!dwellStartAt ? (
        <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
          This app wasn't watching from the moment of arrival, so the exact start time isn't
          known (RoadPilot doesn't expose arrival events for live lookup — only the depart event
          is confirmed, once it happens). Keep this app open and the next arrival will be tracked
          exactly.
        </p>
      ) : (
        <>
          <div className="metric-row">
            <span className="metric-label">Elapsed time</span>
            <span className="metric-value">{fmtMin(elapsedMin)}</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">{accruing ? "Detention accruing" : "Free time remaining"}</span>
            <span className={`metric-value ${accruing ? "warning" : "ok"}`}>
              {accruing ? `+$${estFee.toFixed(0)} CAD (est.)` : fmtMin(freeRemainingMin)}
            </span>
          </div>
        </>
      )}

      {minutesToHosExhaustion !== null && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
          <p
            style={{
              fontSize: 12,
              color: minutesToHosExhaustion < 60 ? "var(--critical)" : "var(--text-secondary)",
              margin: "0 0 8px",
            }}
          >
            Expected to exhaust HOS in {fmtMin(minutesToHosExhaustion)} — you may need to stop
            immediately if this wait continues.
          </p>
          <button className="btn danger" onClick={onAlertDispatcher} disabled={alerted}>
            {alerted ? "Dispatcher alerted" : "Alert Dispatcher (one tap)"}
          </button>
          <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "6px 0 0" }}>
            Demo build: this button only shows a local confirmation and does not actually send
            anything to RoadPilot.
          </p>
        </div>
      )}
    </div>
  );
}
