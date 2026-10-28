export type ExerciseType =
  | 'walking'
  | 'running'
  | 'strength_training'
  | 'cycling'
  | 'swimming'
  | 'yoga'
  | 'hiit'
  | 'sports'
  | 'other';

export type ExerciseIntensity = 'light' | 'moderate' | 'vigorous' | 'extreme';

export interface ActivityHealthDayInfo {
  id: string;
  localDate: string;
}

export interface StepsRecordResponse {
  id: string;
  localDate: string;
  steps: number;
  goal: number;
  progressPct: number;
  updatedAt: string;
  healthDay: ActivityHealthDayInfo;
}

export interface StepsHistoryItem {
  localDate: string;
  steps: number;
  goal: number;
  progressPct: number;
  completed: boolean;
}

export interface StepsHistoryResponse {
  items: StepsHistoryItem[];
  averageSteps: number;
  totalSteps: number;
  daysCount: number;
}

export interface ExerciseEntryResponse {
  id: string;
  occurredAt: string;
  exerciseType: string;
  durationMinutes: number;
  intensity: string | null;
  caloriesBurned: number | null;
  notes: string | null;
  createdAt: string;
  healthDay: ActivityHealthDayInfo;
}

export interface ActivitySummaryToday {
  localDate: string;
  steps: number;
  stepsGoal: number;
  stepsProgressPct: number;
  exerciseMinutes: number;
  exerciseSessionsCount: number;
  hasActivityToday: boolean;
}

export interface ActivitySummaryWeek {
  weeklyAverageSteps: number;
  totalExerciseMinutes: number;
  exerciseDaysCount: number;
  daysMeetingGoalCount: number;
}

export interface ActivitySummaryResponse {
  today: ActivitySummaryToday;
  week: ActivitySummaryWeek;
}

export interface StepsGoalResponse {
  stepsGoal: number;
}

