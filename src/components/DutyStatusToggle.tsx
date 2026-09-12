import type { DutyStatus } from "../types";

const OPTIONS: { key: DutyStatus; label: string }[] = [
  { key: "driving", label: "Driving" },
  { key: "dock_wait", label: "Dock Wait" },
  { key: "resting", label: "Resting" },
];

export default function DutyStatusToggle({
  value,
  onChange,
}: {
  value: DutyStatus;
  onChange: (s: DutyStatus) => void;
}) {
  return (
    <div className="card">
      <div className="card-title">
        <span>My Status</span>
        <span className="badge local">Local only</span>
      </div>
      <div className="status-toggle">
        {OPTIONS.map((o) => (
          <button key={o.key} className={value === o.key ? "active" : ""} onClick={() => onChange(o.key)}>
            {o.label}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "8px 0 0" }}>
        This status only exists inside this app. It is never sent to the RoadPilot dispatcher
        dashboard.
      </p>
    </div>
  );
}
