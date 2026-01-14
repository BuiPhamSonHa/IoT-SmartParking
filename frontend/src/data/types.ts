export type VehicleType = "MOTORBIKE" | "CAR" | "TRUCK";

export type Kiosk = {
  id: string;
  name: string;
  occupied?: boolean;
  currentPlate?: string | null;
  currentVehicleType?: VehicleType | null;
  currentEntryAt?: string | null;

  temperatureC: number;
  humidityPct: number;
  smokeWarning?: boolean;
  cameraImageUrl?: string | null;

  envStatus?: "GOOD" | "WARN" | "DANGER";
  updatedAt?: string;
};

export type ParkingSession = {
  id: number;
  kioskId: string;
  plate: string;
  vehicleType: VehicleType;
  entryAt: string;
  exitAt?: string | null;

  // backend fields
  durationMinutes?: number | null;
  feeVnd?: number | null;

  // UI legacy alias (maps from feeVnd)
  priceVnd?: number | null;

  cameraImageUrl?: string | null;
  entryPlateImageUrl?: string | null;
  exitPlateImageUrl?: string | null;
};

export type PricingConfig = {
  ratePerHour: Record<VehicleType, number>;
  freeMinutes: number;
  roundingVnd: number;
  updatedAt?: string;
};

export type Kpis = {
  activeVehicles: number;
  revenueTodayVnd: number;
  sensorWarnings: number;
};
