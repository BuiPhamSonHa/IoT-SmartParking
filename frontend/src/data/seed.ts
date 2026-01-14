import { Kiosk, PricingConfig, ParkingSession } from "./types";

export const SEED_KIOSKS: Kiosk[] = [
  { id: "k1", name: "Kiot 1", temperatureC: 31, humidityPct: 65 },
  { id: "k2", name: "Kiot 2", temperatureC: 30, humidityPct: 60 },
  { id: "k3", name: "Kiot 3", temperatureC: 32, humidityPct: 70 }
];

export const SEED_PRICING: PricingConfig = {
  ratePerHour: {
    MOTORBIKE: 3000,
    CAR: 10000,
    TRUCK: 20000
  },
  freeMinutes: 10,
  roundingVnd: 1000
};

export const SEED_SESSIONS: ParkingSession[] = [];
