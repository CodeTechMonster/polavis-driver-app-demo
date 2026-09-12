/**
 * All calls in this file hit the REAL, already-running RoadPilot backend
 * (backend/src/server.ts) — nothing here is mocked. RoadPilot's code is not
 * modified anywhere: every endpoint below already existed before this app
 * was written.
 *
 * Split, on purpose:
 *  - GET requests  -> real data, read-only, safe to call freely.
 *  - POST requests -> only /api/whatif and /api/rescore are called, and only
 *    because neither one writes to the database (see server.ts: both just
 *    compute a score from riskScores/ml-service and return it). Nothing in
 *    this app calls a POST that mutates RoadPilot's state (e.g. thresholds),
 *    and nothing in this app writes duty-status back to RoadPilot — that
 *    decision was made explicitly so a driver tapping around in this app can
 *    never affect the dispatcher dashboard mid-demo.
 */

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8787";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json();
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json();
}

export interface DriverAllRow {
  DRIVER_ID: number | null;
  FIRST_NAME: string;
  STATUS: string | null;
  REMAINING_HOURS_CAN_7: number | null;
  LAST_SAT_LOC: string | null;
  liveDutyStatus: string | null;
}

export interface DriverAvailableRow {
  DRIVER_ID: number;
  FIRST_NAME: string;
  REMAINING_HOURS_CAN_7: number;
  REMAINING_HOURS_CAN_14: number;
  LAST_SAT_LOC: string | null;
  POSLAT: string | null;
  POSLONG: string | null;
}

export interface LiveTelemetryRow {
  trip_number: number;
  driver_name: string;
  lat: number;
  lon: number;
  speed_kmh: number;
  hos_remaining: number;
  progress: number;
  status: "driving" | "dwelling";
  updated_at: string;
}

export interface GeofenceDepartEvent {
  id: number;
  trip_number: number;
  driver_name: string;
  zone_name: string;
  event_type: "depart";
  timestamp: string;
  real_dwell_hours: number;
  detention_fee: number;
}

export interface Thresholds {
  hosCriticalRemainingHours: number;
  detentionThresholdHours: number;
  detentionRatePerHourCAD: number;
  [key: string]: unknown;
}

export interface LegRow {
  TRIP_NUMBER: number;
  DRIVER_NAME: string;
  ORIG_ZONE_DESC: string;
  DEST_ZONE_DESC: string;
  hosRisk: number;
  delayRisk: number;
  detentionRisk: number;
  emptyMileRisk: number;
  riskScore: number;
  distanceKm: number | null;
  level?: string;
}

export interface WhatIfResult {
  before: LegRow;
  after: LegRow & { DRIVER_NAME: string };
  note: string;
  source: string;
}

// GET /api/drivers/all — every driver, real STATUS + REMAINING_HOURS_CAN_7 + the
// (currently always-null, since nothing writes it) liveDutyStatus join.
export const getAllDrivers = () => getJson<DriverAllRow[]>("/api/drivers/all");

// GET /api/drivers/available — the only endpoint that also carries CAN_14 + position.
export const getAvailableDrivers = () => getJson<DriverAvailableRow[]>("/api/drivers/available");

// GET /api/live/positions — whatever the simulation engine is tracking right now.
export const getLivePositions = () => getJson<LiveTelemetryRow[]>("/api/live/positions");

// GET /api/detention/summary — real depart events with server-computed dwell + fee.
export const getDetentionSummary = () =>
  getJson<{ events: GeofenceDepartEvent[]; totalDetentionFeesCAD: number }>("/api/detention/summary");

// GET /api/settings/thresholds — the real 2h-free / $75-per-hour config the
// simulator itself bills against, so this app never hardcodes a number that
// could drift from what the dashboard is actually using.
export const getThresholds = () => getJson<Thresholds>("/api/settings/thresholds");

// GET /api/legs/all — used to pick a real unassigned/available load to offer
// the logged-in driver in the "load offer" screen. q/sortKey/limit are the
// same query params the dashboard's own browse view uses.
export const searchLegs = (q: string, limit = 20) =>
  getJson<{ total: number; legs: LegRow[] }>(`/api/legs/all?q=${encodeURIComponent(q)}&limit=${limit}`);

// POST /api/whatif/:tripNumber — does NOT write to the database (confirmed in
// server.ts: it only reads riskScores / calls the ml-service and returns JSON).
// Reused here exactly as the dispatcher dashboard uses it, so the traffic-light
// verdict a driver sees is the same model output a dispatcher would see.
export const whatIf = (tripNumber: number, candidateDriverId: number) =>
  postJson<WhatIfResult>(`/api/whatif/${tripNumber}`, { candidateDriverId });
