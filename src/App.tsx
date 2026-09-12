import { useEffect, useRef, useState } from "react";
import PhoneFrame from "./components/PhoneFrame";
import LoginScreen from "./components/LoginScreen";
import HosStatusCard from "./components/HosStatusCard";
import CycleCard from "./components/CycleCard";
import DutyStatusToggle from "./components/DutyStatusToggle";
import DockWaitCard from "./components/DockWaitCard";
import LoadOfferCard from "./components/LoadOfferCard";
import { getLivePositions, getDetentionSummary, getThresholds, type GeofenceDepartEvent, type Thresholds } from "./api";
import type { DutyStatus, SelectedDriver } from "./types";

const POLL_MS = 3000; // fast enough given the simulator compresses 1 real hour into ~3 sim-seconds

export default function App() {
  const [driver, setDriver] = useState<SelectedDriver | null>(null);
  const [dutyStatus, setDutyStatus] = useState<DutyStatus>("driving");
  const [toast, setToast] = useState<string | null>(null);
  const [alerted, setAlerted] = useState(false);

  const [liveStatus, setLiveStatus] = useState<"driving" | "dwelling" | null>(null);
  const [hosRemaining, setHosRemaining] = useState<number | null>(null);
  const [dwellStartAt, setDwellStartAt] = useState<number | null>(null);
  const [departEvent, setDepartEvent] = useState<GeofenceDepartEvent | null>(null);
  const [thresholds, setThresholds] = useState<Thresholds | null>(null);
  const [now, setNow] = useState(Date.now());

  const prevStatusRef = useRef<"driving" | "dwelling" | null>(null);

  // Smooth 1s ticker just for the on-screen countdowns — separate from the slower data poll below.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch the real 2h-free / $-per-hour settings once at login — same config the dashboard uses.
  useEffect(() => {
    if (!driver) return;
    getThresholds().then(setThresholds).catch(() => setThresholds(null));
  }, [driver]);

  // Poll RoadPilot's real live telemetry + detention events for this driver's trip.
  useEffect(() => {
    if (!driver?.tripNumber) {
      setLiveStatus(null);
      setHosRemaining(null);
      return;
    }
    let cancelled = false;

    async function poll() {
      try {
        const [positions, detention] = await Promise.all([getLivePositions(), getDetentionSummary()]);
        if (cancelled) return;
        const mine = positions.find((p) => p.trip_number === driver!.tripNumber);
        const status = mine?.status ?? null;
        setLiveStatus(status);
        setHosRemaining(mine?.hos_remaining ?? null);

        // Client-observed transition into "dwelling" — see DockWaitCard for why this can't be
        // read from the server directly (no GET endpoint exposes arrive events, only depart).
        if (status === "dwelling" && prevStatusRef.current !== "dwelling") {
          setDwellStartAt(Date.now());
          setAlerted(false);
          setDepartEvent(null);
        }
        if (status !== "dwelling") {
          setDwellStartAt(null);
          setDepartEvent(null);
        }
        prevStatusRef.current = status;

        const depart = detention.events.find((e) => e.trip_number === driver!.tripNumber);
        if (depart) setDepartEvent(depart);
      } catch {
        // backend unreachable mid-poll — keep last known values rather than clearing the screen
      }
    }
    poll();
    const t = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [driver?.tripNumber]);

  function handleAlertDispatcher() {
    setAlerted(true);
    setToast("Dispatcher alerted (demo · local confirmation only)");
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <PhoneFrame>
      {!driver ? (
        <LoginScreen onSelect={setDriver} />
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{driver.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                {driver.tripNumber ? `Trip ${driver.tripNumber}` : "Waiting (no assignment)"}
              </div>
            </div>
            <button className="btn ghost" style={{ width: "auto", padding: "6px 10px", fontSize: 12 }} onClick={() => setDriver(null)}>
              Log out
            </button>
          </div>

          <DutyStatusToggle value={dutyStatus} onChange={setDutyStatus} />
          <HosStatusCard hosRemaining={hosRemaining} status={liveStatus} />
          <CycleCard can7={driver.can7} can14={driver.can14} />
          <DockWaitCard
            status={liveStatus}
            dwellStartAt={dwellStartAt}
            now={now}
            hosRemaining={hosRemaining}
            thresholds={thresholds}
            realDepartEvent={departEvent}
            onAlertDispatcher={handleAlertDispatcher}
            alerted={alerted}
          />
          <LoadOfferCard driverId={driver.driverId} can7={driver.can7} />
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </PhoneFrame>
  );
}
