import { format, addHours } from 'date-fns';

interface TideEvent {
  type: 'high' | 'low';
  time: string;
  height: number;
}

export const getTideData = (stationId: string, date: Date = new Date()): TideEvent[] => {
  const tides: TideEvent[] = [];
  let currentTime = new Date(date);
  currentTime.setHours(0, 0, 0, 0);

  // Generate 4 tide events for the day (high and low tides)
  for (let i = 0; i < 4; i++) {
    currentTime = addHours(currentTime, 6);
    tides.push({
      type: i % 2 === 0 ? 'high' : 'low',
      time: currentTime.toISOString(),
      height: i % 2 === 0 
        ? 5.5 + (Math.random() * 2) // High tide between 5.5m and 7.5m
        : 0.5 + (Math.random() * 1)  // Low tide between 0.5m and 1.5m
    });
  }

  return tides;
};
