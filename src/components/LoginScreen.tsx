import { useEffect, useState } from "react";
import { getAllDrivers, getAvailableDrivers, getLivePositions } from "../api";
import type { SelectedDriver } from "../types";

interface LiveOption {
  name: string;
  tripNumber: number;
  status: string;
  hosRemaining: number;
}

interface AvailOption {
  driverId: number;
  name: string;
  can7: number;
  can14: number;
}

export default function LoginScreen({ onSelect }: { onSelect: (d: SelectedDriver) => void }) {
  const [live, setLive] = useState<LiveOption[]>([]);
  const [avail, setAvail] = useState<AvailOption[]>([]);
  const [idByName, setIdByName] = useState<Record<string, number | null>>({});
  const [can7ByName, setCan7ByName] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [allDrivers, availableDrivers, livePositions] = await Promise.all([
          getAllDrivers(),
          getAvailableDrivers(),
          getLivePositions(),
        ]);
        if (cancelled) return;
        const nameToId: Record<string, number | null> = {};
        const nameToCan7: Record<string, number | null> = {};
        for (const d of allDrivers) {
          nameToId[d.FIRST_NAME] = d.DRIVER_ID;
          nameToCan7[d.FIRST_NAME] = d.REMAINING_HOURS_CAN_7;
        }
        setIdByName(nameToId);
        setCan7ByName(nameToCan7);
        setLive(
          livePositions.map((p) => ({
            name: p.driver_name,
            tripNumber: p.trip_number,
            status: p.status,
            hosRemaining: p.hos_remaining,
          }))
        );
        setAvail(
          availableDrivers.map((d) => ({
            driverId: d.DRIVER_ID,
            name: d.FIRST_NAME,
            can7: d.REMAINING_HOURS_CAN_7,
            can14: d.REMAINING_HOURS_CAN_14,
          }))
        );
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 4 }}>RoadPilot Driver</h2>
      <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 16 }}>
        Demo login — loads the real driver list from the RoadPilot backend (localhost:8787).
      </p>

      {loading && <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Loading…</p>}
      {error && (
        <div className="card" style={{ borderColor: "var(--critical)" }}>
          <p style={{ fontSize: 12, color: "var(--critical)", margin: 0 }}>
            Couldn't connect to the RoadPilot backend ({error}). Make sure the backend is running
            on localhost:8787.
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="card-title">
            <span>Currently active in the simulation</span>
            <span className="badge live">LIVE</span>
          </div>
          {live.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              The simulation engine isn't tracking any trips right now (check that
              5-simulation-engine is running).
            </p>
          )}
          {live.map((d) => (
            <div
              key={`${d.name}-${d.tripNumber}`}
              className="driver-pick"
              onClick={() =>
                onSelect({
                  driverId: idByName[d.name] ?? null,
                  name: d.name,
                  can7: can7ByName[d.name] ?? null,
                  can14: null,
                  tripNumber: d.tripNumber,
                })
              }
            >
              <div>
                <div style={{ fontWeight: 600 }}>{d.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                  Trip {d.tripNumber} · {d.status === "driving" ? "Driving" : "At dock"}
                </div>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                HOS {d.hosRemaining.toFixed(1)}h
              </div>
            </div>
          ))}

          <div className="card-title" style={{ marginTop: 20 }}>
            <span>Available drivers (AVAIL)</span>
          </div>
          {avail.map((d) => (
            <div
              key={d.driverId}
              className="driver-pick"
              onClick={() =>
                onSelect({
                  driverId: d.driverId,
                  name: d.name,
                  can7: d.can7,
                  can14: d.can14,
                  tripNumber: null,
                })
              }
            >
              <div>
                <div style={{ fontWeight: 600 }}>{d.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                  {d.can7.toFixed(1)}h left on Cycle 1
                </div>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Cycle 2: {d.can14.toFixed(1)}h
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
