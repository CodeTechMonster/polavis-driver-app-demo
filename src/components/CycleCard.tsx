function bar(usedPct: number) {
  const color = usedPct >= 90 ? "var(--critical)" : usedPct >= 70 ? "var(--warning)" : "var(--ok)";
  return (
    <div className="bar-track">
      <div className="bar-fill" style={{ width: `${Math.min(100, usedPct)}%`, background: color }} />
    </div>
  );
}

export default function CycleCard({ can7, can14 }: { can7: number | null; can14: number | null }) {
  const usedPct7 = can7 !== null ? ((70 - can7) / 70) * 100 : null;
  const usedPct14 = can14 !== null ? ((120 - can14) / 120) * 100 : null;

  return (
    <div className="card">
      <div className="card-title">
        <span>Cycle Tracking</span>
        <span className="badge live">Real data</span>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div className="metric-row" style={{ marginBottom: 4 }}>
          <span className="metric-label">Cycle 1 (70h / 7 days)</span>
          <span className="metric-value" style={{ fontSize: 15 }}>
            {can7 !== null ? `${can7.toFixed(1)}h left` : "No data"}
          </span>
        </div>
        {usedPct7 !== null && bar(usedPct7)}
      </div>

      <div>
        <div className="metric-row" style={{ marginBottom: 4 }}>
          <span className="metric-label">Cycle 2 (120h / 14 days)</span>
          <span className="metric-value" style={{ fontSize: 15 }}>
            {can14 !== null ? `${can14.toFixed(1)}h left` : "No data"}
          </span>
        </div>
        {usedPct14 !== null && bar(usedPct14)}
      </div>

      {can14 === null && (
        <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "10px 0 0" }}>
          This driver isn't in the /api/drivers/available list (the only endpoint that also
          exposes Cycle 2), so only the Cycle 1 value is shown as real data.
        </p>
      )}
    </div>
  );
}
