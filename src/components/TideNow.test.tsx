import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { TideNow } from './TideNow';
import type { TideEvent } from '../types/tide';

const EVENTS: TideEvent[] = [
  { type: 'low', time: '2026-06-10T06:00:00.000Z', height: 1 },
  { type: 'high', time: '2026-06-10T12:00:00.000Z', height: 5 },
  { type: 'low', time: '2026-06-10T18:00:00.000Z', height: 1 },
];

function renderStatus(now: Date) {
  return render(
    <PaperProvider>
      <TideNow tideData={EVENTS} now={now} />
    </PaperProvider>,
  );
}

describe('TideNow', () => {
  it('shows the current direction and next high and low countdowns', () => {
    renderStatus(new Date('2026-06-10T09:00:00.000Z'));

    expect(screen.getByText('Coming in')).toBeTruthy();
    expect(screen.getByText('Tide is rising')).toBeTruthy();
    expect(screen.getByText('NEXT HIGH')).toBeTruthy();
    expect(screen.getByText('NEXT LOW')).toBeTruthy();
    expect(screen.getByText('3 hr 0 min')).toBeTruthy();
    expect(screen.getByText('9 hr 0 min')).toBeTruthy();
  });

  it('stays hidden when the events are not for today', () => {
    renderStatus(new Date('2026-06-11T09:00:00.000Z'));
    expect(screen.queryByText('CURRENT LEVEL')).toBeNull();
  });

  it('shows a loading message', () => {
    render(
      <PaperProvider>
        <TideNow tideData={[]} loading now={new Date('2026-06-10T09:00:00.000Z')} />
      </PaperProvider>,
    );
    expect(screen.getByText('Getting the latest tide status…')).toBeTruthy();
  });
});
