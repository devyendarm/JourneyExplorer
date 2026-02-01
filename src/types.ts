export interface Step {
  stepId: string;
  stepName: string;
  order: number;
}

export interface Segment {
  segmentId: string;
  segmentName: string;
}

export interface StepMetrics {
  users: number;
  sessions: number;
  conversionFromPrev: number;
}

export interface DistributionItem {
  name: string;
  count: number;
}

export interface HistogramBin {
  bin: number;
  label: string;
  count: number;
}

export interface DeepDiveData {
  summary: StepMetrics;
  channels: DistributionItem[];
  pages: DistributionItem[];
  microEvents: DistributionItem[];
}

export interface TransitionData {
  betweenSteps: {
    histogram: HistogramBin[];
    frictionSignals: DistributionItem[];
    detours: DistributionItem[];
  };
}

export interface JourneyData {
  journey: {
    id: string;
    name: string;
    dateRange: string;
  };
  steps: Step[];
  segments: Segment[];
  stepMetricsBySegment: Record<string, Record<string, StepMetrics>>;
  transitionMetricsBySegment: Record<string, Record<string, TransitionData>>;
  deepDiveBySegment: Record<string, Record<string, DeepDiveData>>;
}

export type ViewMode = 'SUMMARY' | 'DEEP_DIVE';

export interface SelectionContext {
  type: 'step' | 'transition' | null;
  stepId?: string;
  fromStepId?: string;
  toStepId?: string;
}
