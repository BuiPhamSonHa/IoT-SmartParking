import { PricingConfig, VehicleType } from "./types";

function ceilDiv(a: number, b: number) {
  return Math.floor((a + b - 1) / b);
}

export function calcPriceVnd(args: {
  entryAtISO: string;
  exitAtISO: string;
  vehicleType: VehicleType;
  pricing: PricingConfig;
}): number {
  const { entryAtISO, exitAtISO, vehicleType, pricing } = args;
  const entry = new Date(entryAtISO).getTime();
  const exit = new Date(exitAtISO).getTime();
  const minutes = Math.max(0, Math.floor((exit - entry) / 60000));

  const chargeable = Math.max(0, minutes - pricing.freeMinutes);
  const hours = ceilDiv(chargeable, 60);
  const raw = hours * pricing.ratePerHour[vehicleType];

  const r = Math.max(1, pricing.roundingVnd);
  const rounded = Math.round(raw / r) * r;
  return rounded;
}
