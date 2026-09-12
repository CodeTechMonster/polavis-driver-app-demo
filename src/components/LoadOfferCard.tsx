import { useState } from "react";
import { searchLegs, whatIf, type LegRow, type WhatIfResult } from "../api";

function verdictOf(riskScore: number): { label: string; color: string } {
  if (riskScore <= 30) return { label: "Safe to accept", color: "var(--ok)" };
  if (riskScore <= 60) return { label: "Use caution", color: "var(--warning)" };
  return { label: "Not recommended", color: "var(--critical)" };
}

export default function LoadOfferCard({ driverId, can7 }: { driverId: number | null; can7: number | null }) {
  const [offer, setOffer] = useState<LegRow | null>(null);
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchOffer() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Pull a page of real legs and pick one at random — a stand-in for "dispatch just
      // pinged you with a load", using an actual row from the dataset rather than invented numbers.
      const { legs } = await searchLegs("", 50);
      if (legs.length === 0) throw new Error("No loads available to show");
      const pick = legs[Math.floor(Math.random() * legs.length)];
      setOffer(pick);

      if (driverId !== null) {
        const r = await whatIf(pick.TRIP_NUMBER, driverId);
        setResult(r);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const bufferHours = offer?.distanceKm !== null && offer?.distanceKm !== undefined && can7 !== null
    ? can7 - offer.distanceKm / 80
    : null;

  return (
    <div className="card">
      <div className="card-title">
        <span>New Load Offer Simulation</span>
        <span className="badge live">Real data + real whatif engine</span>
      </div>

      <button className="btn primary" onClick={fetchOffer} disabled={loading} style={{ marginBottom: 12 }}>
        {loading ? "Checking…" : "Get a load offer"}
      </button>

      {error && <p style={{ fontSize: 12, color: "var(--critical)" }}>{error}</p>}

      {offer && (
        <>
          <p style={{ fontSize: 13, marginBottom: 4 }}>
            Trip {offer.TRIP_NUMBER} · {offer.ORIG_ZONE_DESC} → {offer.DEST_ZONE_DESC}
          </p>
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 12 }}>
            Distance {offer.distanceKm ?? "?"}km
          </p>

          {result ? (
            <div className="metric-row" style={{ marginBottom: 0 }}>
              <span className="metric-label">
                {result.source === "ml-service" ? "ML risk score" : "Heuristic risk score"}
              </span>
              <span className="metric-value" style={{ color: verdictOf(result.after.riskScore).color }}>
                {verdictOf(result.after.riskScore).label} ({result.after.riskScore.toFixed(0)})
              </span>
            </div>
          ) : bufferHours !== null ? (
            <div className="metric-row" style={{ marginBottom: 0 }}>
              <span className="metric-label">Estimated Cycle 1 remaining on completion</span>
              <span className={`metric-value ${bufferHours <= 0 ? "critical" : bufferHours < 3 ? "warning" : "ok"}`}>
                {bufferHours.toFixed(1)}h
              </span>
            </div>
          ) : (
            <p style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
              Couldn't resolve this driver's ID, so the recalculation was skipped.
            </p>
          )}

          <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "10px 0 0" }}>
            This calls RoadPilot dashboard's own what-if reassignment engine (/api/whatif) directly
            — the same model output a dispatcher would see. It only computes; nothing is persisted.
          </p>
        </>
      )}
    </div>
  );
}
