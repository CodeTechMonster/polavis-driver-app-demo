function levelOf(hours: number | null): "ok" | "warning" | "critical" {
  if (hours === null) return "ok";
  if (hours <= 0) return "critical";
  if (hours <= 2) return "warning";
  return "ok";
}

export default function HosStatusCard({
  hosRemaining,
  status,
}: {
  hosRemaining: number | null; // live_telemetry.hos_remaining, polled from RoadPilot
  status: "driving" | "dwelling" | null;
}) {
  const level = levelOf(hosRemaining);
  return (
    <div className="card">
      <div className="card-title">
        <span>Real-time HOS Countdown</span>
        <span className="badge live">LIVE</span>
      </div>
      {hosRemaining === null ? (
        <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
          No active trip right now, so there's no live value. See the cycle balances below instead.
        </p>
      ) : (
        <>
          <div className="metric-row">
            <span className="metric-label">
              {status === "dwelling" ? "Dock waiting · driving hours remaining" : "Driving · driving hours remaining"}
            </span>
            <span className={`metric-value ${level}`}>{hosRemaining.toFixed(2)}h</span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${Math.max(0, Math.min(100, (hosRemaining / 11) * 100))}%`,
                background: level === "critical" ? "var(--critical)" : level === "warning" ? "var(--warning)" : "var(--ok)",
              }}
            />
          </div>
          {level !== "ok" && (
            <p style={{ fontSize: 11, color: `var(--${level})`, margin: "8px 0 0" }}>
              {level === "critical" ? "HOS limit exhausted — must stop immediately" : "HOS limit approaching — line up a backup plan"}
            </p>
          )}
        </>
      )}
      <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "8px 0 0" }}>
        This value is computed live by RoadPilot's Fleet Telematics Simulator (the individual
        13h/14h/16h/10h limits aren't tracked separately in the current dataset, so they aren't
        shown here).
      </p>
    </div>
  );
}
