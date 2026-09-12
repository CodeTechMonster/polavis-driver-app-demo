export type DutyStatus = "driving" | "dock_wait" | "resting";

export interface SelectedDriver {
  driverId: number | null;
  name: string;
  can7: number | null; // REMAINING_HOURS_CAN_7 — real, from RoadPilot
  can14: number | null; // REMAINING_HOURS_CAN_14 — real, only known for drivers pulled from /api/drivers/available
  tripNumber: number | null; // set only if the driver was picked from the "currently live" list
}
