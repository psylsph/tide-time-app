import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { format, isSameDay } from 'date-fns';
import type { TideEvent } from '../types/tide';
import { formatTimeUntil, getTideStatus } from '../utils/tideStatus';
import { elevation } from '../styles/elevation';

interface TideNowProps {
  tideData: TideEvent[];
  loading?: boolean;
  now?: Date;
}

export const TideNow: React.FC<TideNowProps> = ({ tideData, loading = false, now }) => {
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    if (now) return undefined;
    const timer = setInterval(() => setClock(new Date()), 60_000);
    return () => clearInterval(timer);
  }, [now]);

  const effectiveNow = now ?? clock;
  const isToday = tideData.some(event => isSameDay(new Date(event.time), effectiveNow));
  const status = useMemo(
    () => isToday ? getTideStatus(tideData, effectiveNow) : null,
    [tideData, effectiveNow, isToday],
  );

  if (loading) {
    return (
      <View style={[styles.card, styles.messageCard, elevation(1)]}>
        <Text style={styles.message}>Getting the latest tide status…</Text>
      </View>
    );
  }

  if (!status || !isToday) return null;

  const comingIn = status.direction === 'in';

  return (
    <View style={[styles.card, elevation(1)]}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.eyebrow}>CURRENT LEVEL</Text>
          <Text style={styles.level}>{status.height.toFixed(1)}<Text style={styles.unit}> m</Text></Text>
          <Text style={styles.datum}>predicted height</Text>
        </View>
        <View style={[styles.directionPill, comingIn ? styles.inPill : styles.outPill]}>
          <Text style={styles.directionArrow}>{comingIn ? '↑' : '↓'}</Text>
          <View>
            <Text style={styles.directionLabel}>{comingIn ? 'Coming in' : 'Going out'}</Text>
            <Text style={styles.directionHint}>{comingIn ? 'Tide is rising' : 'Tide is falling'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.nextRow}>
        <View style={styles.nextItem}>
          <Text style={styles.nextLabel}>NEXT HIGH</Text>
          <Text style={styles.nextCountdown}>{formatTimeUntil(status.nextHigh.time, effectiveNow)}</Text>
          <Text style={styles.nextTime}>{format(new Date(status.nextHigh.time), 'HH:mm')} · {status.nextHigh.height.toFixed(1)} m</Text>
        </View>
        <View style={styles.verticalDivider} />
        <View style={styles.nextItem}>
          <Text style={styles.nextLabel}>NEXT LOW</Text>
          <Text style={styles.nextCountdown}>{formatTimeUntil(status.nextLow.time, effectiveNow)}</Text>
          <Text style={styles.nextTime}>{format(new Date(status.nextLow.time), 'HH:mm')} · {status.nextLow.height.toFixed(1)} m</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: '#142024',
    borderWidth: 1,
    borderColor: '#405156',
  },
  messageCard: {
    alignItems: 'center',
  },
  message: {
    fontFamily: 'Poppins_400Regular',
    color: '#B9C7C3',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  eyebrow: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    letterSpacing: 1,
    color: '#B9C7C3',
  },
  level: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    lineHeight: 36,
    color: '#F2F6F4',
  },
  unit: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 17,
    color: '#B9C7C3',
  },
  datum: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 9,
    color: '#91A19D',
  },
  directionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minWidth: 124,
    flexGrow: 1,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 11,
  },
  inPill: {
    backgroundColor: '#203B39',
  },
  outPill: {
    backgroundColor: '#393630',
  },
  directionArrow: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 23,
    color: '#8FC9C1',
  },
  directionLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#E2F1ED',
  },
  directionHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 9,
    color: '#B9C7C3',
  },
  divider: {
    height: 1,
    marginVertical: 8,
    backgroundColor: '#405156',
  },
  nextRow: {
    flexDirection: 'row',
  },
  nextItem: {
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    marginHorizontal: 12,
    backgroundColor: '#405156',
  },
  nextLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 9,
    letterSpacing: 1,
    color: '#B9C7C3',
  },
  nextCountdown: {
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 1,
    fontSize: 16,
    color: '#F2F6F4',
  },
  nextTime: {
    fontFamily: 'Poppins_400Regular',
    marginTop: 0,
    fontSize: 11,
    color: '#B9C7C3',
  },
});
