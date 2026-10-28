export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';

export interface NutritionHealthDayInfo {
  id: string;
  localDate: string;
}

export interface MealEntryResponse {
  id: string;
  occurredAt: string;
  mealType: MealType;
  description: string | null;
  hungerBefore: number | null;
  satietyAfter: number | null;
  wantedMoreEvenIfFull: boolean;
  pausedBeforeMore: boolean | null;
  extraEatingContext: string | null;
  createdAt: string;
  healthDay: NutritionHealthDayInfo;
}
