export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface ChatResponse {
  text: string;
  sources: GroundingSource[];
  error?: string;
  diagnostic?: string;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  image?: string; // Base64 string for user uploads
  timestamp: Date;
  isSummary?: boolean;
  generatedImage?: string; // Legacy or future use
  groundingSources?: GroundingSource[];
}

export interface DailyStats {
  label: string;
  value: string;
  icon?: string;
}

export interface DailySummaryData {
  date: string;
  highlight: string[];
  actionItems: string[];
  inspirations: string[];
  moodEmoji: string;
  moodColor: string;
  stats?: DailyStats[]; 
  fragmentLog?: string[]; // Deprecated, use rawLog
  rawLog?: string[]; // New: List of actual user inputs
  error?: string; // 添加错误信息字段
  errorType?: string; // 添加错误类型字段
}

export type ChatStatus = 'idle' | 'thinking' | 'generating_summary';