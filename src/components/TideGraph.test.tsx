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

  it('describes the rolling window and drag interaction', () => {
    renderWith(<TideGraph tideData={SAMPLE} />);
    expect(screen.getByText('12 hours past · 12 hours ahead')).toBeTruthy();
    expect(screen.getByText('Drag across the graph to estimate a level')).toBeTruthy();
  });
});
