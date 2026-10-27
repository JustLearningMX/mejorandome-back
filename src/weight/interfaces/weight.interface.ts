export interface WeightHealthDayInfo {
  id: string;
  localDate: string;
}

export interface WeightMeasurementResponse {
  id: string;
  weightKg: number;
  occurredAt: string;
  createdAt: string;
  healthDay: WeightHealthDayInfo;
}
