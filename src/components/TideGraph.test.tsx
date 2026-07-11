import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { TideGraph } from './TideGraph';
import type { TideEvent } from '../types/tide';

function renderWith(ui: React.ReactElement) {
  return render(<PaperProvider>{ui}</PaperProvider>);
}

function event(type: 'high' | 'low', hour: number, height: number): TideEvent {
  const d = new Date(2026, 6, 11);
  d.setHours(hour, 0, 0, 0);
  return { type, time: d.toISOString(), height };
}

const SAMPLE: TideEvent[] = [
  event('high', 6, 6.0),
  event('low', 12, 1.0),
  event('high', 18, 5.5),
  event('low', 23, 0.8),
];

describe('TideGraph', () => {
  it('renders the title', () => {
    renderWith(<TideGraph tideData={SAMPLE} />);
    expect(screen.getByText('Tide Levels')).toBeTruthy();
  });

  it('shows an empty-state placeholder when there is no data', () => {
    renderWith(<TideGraph tideData={[]} />);
    expect(screen.getByText('No tide data available')).toBeTruthy();
  });

  it('shows an empty-state placeholder for a single event (cannot interpolate)', () => {
    renderWith(<TideGraph tideData={[event('high', 6, 5)]} />);
    expect(screen.getByText('No tide data available')).toBeTruthy();
  });

  it('renders the per-event height readings in the footer', () => {
    renderWith(<TideGraph tideData={SAMPLE} />);
    // Each reading displays the height with one decimal, e.g. "6.0m".
    expect(screen.getByText('6.0m')).toBeTruthy();
    expect(screen.getByText('1.0m')).toBeTruthy();
    expect(screen.getByText('5.5m')).toBeTruthy();
    expect(screen.getByText('0.8m')).toBeTruthy();
  });

  it('renders the per-event times in HH:mm in the footer', () => {
    renderWith(<TideGraph tideData={SAMPLE} />);
    expect(screen.getByText('06:00')).toBeTruthy();
    expect(screen.getByText('12:00')).toBeTruthy();
    expect(screen.getByText('18:00')).toBeTruthy();
    expect(screen.getByText('23:00')).toBeTruthy();
  });

  it('does not render readings in the footer when empty', () => {
    renderWith(<TideGraph tideData={[]} />);
    expect(screen.queryByText('6.0m')).toBeNull();
  });

  it('renders negative low-tide heights (below mean sea level) in the footer', () => {
    const negativeDay: TideEvent[] = [
      event('high', 6, 1.3),
      event('low', 12, -1.4),
      event('high', 18, 1.4),
      event('low', 23, -1.5),
    ];
    renderWith(<TideGraph tideData={negativeDay} />);
    // Negative values must flow through to the UI, not be clipped or hidden.
    expect(screen.getByText('-1.4m')).toBeTruthy();
    expect(screen.getByText('-1.5m')).toBeTruthy();
    expect(screen.getByText('1.3m')).toBeTruthy();
    expect(screen.getByText('1.4m')).toBeTruthy();
  });
});
