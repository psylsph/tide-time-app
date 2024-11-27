export interface TideData {
  DateTime: string;
  EventType: string;
  Height: number;
  IsApproximateHeight: boolean;
  IsApproximateTime: boolean;
  QualityControlLevel: string;
}

export interface TideResponse {
  Events: TideData[];
  StationId: string;
  StationName: string;
  Date: string;
}
