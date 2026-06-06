export type ReportMetric = {
  accent: string;
  change: string;
  label: string;
  note: string;
  tint: string;
  value: string;
};

export type ReportStageRow = {
  averageProbability: string;
  barColor: string;
  count: string;
  label: string;
  share: number;
  totalValue: string;
  weightedValue: string;
};

export type ReportForecastBar = {
  barColor: string;
  height: number;
  label: string;
  value: string;
  weightedValue: string;
};

export type ReportHealthSegment = {
  color: string;
  count: string;
  label: string;
  value: number;
};

export type ReportTaskSegment = {
  color: string;
  count: string;
  label: string;
  percent: number;
};

export type ReportActivityItem = {
  id: string;
  message: string;
  meta: string;
  type: string;
};

export type ReportsData = {
  activity: ReportActivityItem[];
  forecastBars: ReportForecastBar[];
  headline: string;
  healthSegments: ReportHealthSegment[];
  metrics: ReportMetric[];
  stageRows: ReportStageRow[];
  taskSegments: ReportTaskSegment[];
};
