export type AnalyteType = "nitrate" | "phosphate" | "boron" | "potassium" | "ph";

export type NodeCategory = "relational" | "normal" | "automation";

export interface AnalyteColor {
  nitrate: string;
  phosphate: string;
  boron: string;
  potassium: string;
  ph: string;
}

export interface NodeType {
  id: string;
  label: string;
  category: NodeCategory;
  icon: string;
  dataType: string;
  analyteType?: AnalyteType;
}

export type NotificationChannel = "app" | "email" | "sms";
export type CompareTimeRange =
  | "14d"
  | "30d"
  | "60d"
  | "90d"
  | "season";

export interface BoronActionRecord {
  actionType?:
    | "boron-fertilizer-applied"
    | "soil-amendment"
    | "foliar-spray"
    | "irrigation-adjustment"
    | "other";
  actionDescription?: string;
  material?:
    | "borax"
    | "solubor"
    | "organic"
    | "blended"
    | "custom";
  materialDescription?: string;
  amount?: number;
  amountUnit?: "g" | "kg" | "ml" | "l" | "percent";
  dateApplied?: string;
  notes?: string;
}

export interface TestResultConfig {
  enabled: boolean;
  scheduleFollowUp: boolean;
  followUpFrequency:
    | "on-new-result"
    | "daily"
    | "weekly"
    | "biweekly"
    | "monthly"
    | "custom";
  customDays?: number;
  thresholdAlert: boolean;
  thresholdValue?: number;
  thresholdDirection: "above" | "below" | "both";
  notifications: boolean;
  nextTestDate?: string;
  notificationChannels?: NotificationChannel[];
  conditionRule?: {
    threshold?: number;
    thresholdDirection?: "above" | "below";
    frequency: "daily" | "weekly" | "biweekly" | "monthly" | "custom" | "on-new-result";
    customDays?: number;
    notificationChannels?: NotificationChannel[];
    recipients?: string;
  };
  recordActionEnabled?: boolean;
  boronActionRecord?: BoronActionRecord;
  compareTrendEnabled?: boolean;
  compareTimeRange?: CompareTimeRange;
}

export interface SchemaNode {
  id: string;
  type: string;
  x: number;
  y: number;
  label: string;
  analyteType?: AnalyteType;
  data?: Record<string, unknown>;
  testConfig?: TestResultConfig;
}

export interface CardLink {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  linkDotPosition: { x: number; y: number };
  menuNodePosition?: { x: number; y: number };
  menuOpen?: boolean;
  combinedCondition?: CombinedConditionConfig;
}

export interface Schema {
  name: string;
  nodes: SchemaNode[];
  links?: CardLink[];
}

// Combined condition types (applies to a connection between multiple result nodes)
export type CombinedLogic = "any" | "all";
export type CombinedSeverity = "info" | "warning" | "critical";

export interface CombinedThreshold {
  nodeId: string;
  analyteLabel: string;
  direction: "above" | "below";
  value: number;
  unit: "PPM";
}

export interface CombinedConditionConfig {
  logic: CombinedLogic;
  thresholds: CombinedThreshold[]; // One per linked nutrient node
  frequency:
    | "on-new-result"
    | "daily"
    | "weekly"
    | "biweekly"
    | "monthly"
    | "custom";
  customDays?: number;
  notificationChannels: NotificationChannel[];
  recipients?: string;
  severity: CombinedSeverity;
}

