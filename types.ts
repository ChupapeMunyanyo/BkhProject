export type ChannelStatus = 'idle' | 'connected' | 'unavailable';

export interface Channel {
  id: string;
  url: string;
  status: ChannelStatus;
  priority: number;
  lastChecked: number | null;
  retryCount: number;
  error?: string;
  description?:string;
  isTestError?:boolean
}

export interface ChannelsState {
  channels: Channel[];
  currentChannelId: string | null;
  error: string | null;
  isLoading: boolean;
}

export interface HealthCheckResult {
  id: string;
  isHealthy: boolean;
  error?: string;
}