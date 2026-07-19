import React, { useMemo, useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Svg, { Path, Line, Text as SvgText, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as d3 from 'd3';
import { format, isSameDay, parseISO, subHours, addHours } from 'date-fns';
import type { TideEvent } from '../types/tide';
import {
  computeHeightDomain,
  createRollingTimeLabels,
  interpolateTideWindow,
} from '../utils/tideCurve';
import type { CurvePoint } from '../utils/tideCurve';
import { elevation } from '../styles/elevation';

interface TideGraphProps {
  tideData: TideEvent[];
  loading?: boolean;
  /** Centre of the rolling 24-hour window. Defaults to the middle event. */
  centerTime?: Date;
}

const CARD_HORIZONTAL_PADDING = 12;
const GRAPH_HOURS_EACH_SIDE = 12;

export const TideGraph: React.FC<TideGraphProps> = ({
  tideData,
  loading = false,
  centerTime,
}) => {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [cardWidth, setCardWidth] = useState(0);
  const [selectedPoint, setSelectedPoint] = useState<CurvePoint | null>(null);

  const fallbackWidth = Math.min(windowWidth - 32, 680);
  const width = Math.max(220, (cardWidth || fallbackWidth) - CARD_HORIZONTAL_PADDING * 2);
  const height = Math.min(205, Math.max(145, width * 0.5));
  const padding = { top: 24, right: 8, bottom: 38, left: 42 };

  const sortedEvents = useMemo(
    () => [...tideData].sort((a, b) => parseISO(a.time).getTime() - parseISO(b.time).getTime()),
    [tideData],
  );
  const fallbackCenter = sortedEvents.length > 0
    ? parseISO(sortedEvents[Math.floor(sortedEvents.length / 2)].time)
    : new Date();
  const center = centerTime ?? fallbackCenter;
  const windowStart = subHours(center, GRAPH_HOURS_EACH_SIDE);
  const windowEnd = addHours(center, GRAPH_HOURS_EACH_SIDE);

  const graphData = useMemo(
    () => interpolateTideWindow(tideData, windowStart, windowEnd, 145),
    [tideData, windowStart.getTime(), windowEnd.getTime()],
  );

  const yScale = useMemo(() => {
    if (graphData.length === 0) {
      return d3.scaleLinear().domain([0, 1]).range([height - padding.bottom, padding.top]);
    }
    const [minHeight, maxHeight] = computeHeightDomain(graphData.map(point => point.height));
    return d3
      .scaleLinear()
      .domain([minHeight, maxHeight])
      .range([height - padding.bottom, padding.top])
      .nice();
  }, [graphData, height, padding.bottom, padding.top]);

  const xScale = useMemo(
    () => d3.scaleTime()
      .domain([windowStart, windowEnd])
      .range([padding.left, width - padding.right]),
    [windowStart.getTime(), windowEnd.getTime(), width, padding.left, padding.right],
  );

  const line = d3
    .line<CurvePoint>()
    .x(point => xScale(point.time))
    .y(point => yScale(point.height))
    .curve(d3.curveBasis);
  const area = d3
    .area<CurvePoint>()
    .x(point => xScale(point.time))
    .y0(height - padding.bottom)
    .y1(point => yScale(point.height))
    .curve(d3.curveBasis);
  const path = line(graphData) || '';
  const areaPath = area(graphData) || '';
  const timeLabels = createRollingTimeLabels(windowStart, windowEnd, 4);

  const seaLevelY = yScale(0);
  const showSeaLevel = graphData.length > 0
    && seaLevelY > padding.top + 2
    && seaLevelY < height - padding.bottom - 2;
  const showNow = isSameDay(center, new Date());

  const visibleEvents = sortedEvents.filter(event => {
    const time = parseISO(event.time).getTime();
    return time >= windowStart.getTime() && time <= windowEnd.getTime();
  });

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth > 0 && Math.abs(nextWidth - cardWidth) > 1) setCardWidth(nextWidth);
  };

  const selectAtPosition = (event: GestureResponderEvent) => {
    if (graphData.length === 0) return;
    const x = Math.max(padding.left, Math.min(width - padding.right, event.nativeEvent.locationX));
    const fraction = (x - padding.left) / (width - padding.left - padding.right);
    const index = Math.round(fraction * (graphData.length - 1));
    setSelectedPoint(graphData[index]);
  };

  const selectedIndex = selectedPoint
    ? graphData.findIndex(point => point.time.getTime() === selectedPoint.time.getTime())
    : -1;
  const selectedDirection = selectedIndex >= 0 && selectedIndex < graphData.length - 1
    ? graphData[selectedIndex + 1].height >= graphData[selectedIndex].height ? 'rising' : 'falling'
    : '';

  const styles = StyleSheet.create({
    container: {
      width: '100%',
      maxWidth: '100%',
      paddingHorizontal: CARD_HORIZONTAL_PADDING,
      paddingVertical: 10,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      ...elevation(1),
    },
    headerRow: {
      minHeight: 40,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 10,
    },
    title: {
      fontFamily: 'Poppins_500Medium',
      fontSize: 18,
      color: theme.colors.primary,
    },
    subtitle: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    touchHint: {
      maxWidth: 150,
      fontFamily: 'Poppins_400Regular',
      fontSize: 11,
      lineHeight: 16,
      textAlign: 'right',
      color: theme.colors.onSurfaceVariant,
    },
    selectedReading: {
      alignItems: 'flex-end',
    },
    selectedHeight: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 18,
      color: theme.colors.onSurface,
    },
    selectedTime: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    graphContainer: {
      width: '100%',
      marginTop: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyState: {
      height: 150,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyStateText: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
  });

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Tide Levels</Text>
          <Text style={styles.subtitle}>12 hours past · 12 hours ahead</Text>
        </View>
        {selectedPoint ? (
          <View style={styles.selectedReading} accessibilityLiveRegion="polite">
            <Text style={styles.selectedHeight}>{selectedPoint.height.toFixed(1)} m</Text>
            <Text style={styles.selectedTime}>
              {format(selectedPoint.time, 'EEE HH:mm')} · {selectedDirection}
            </Text>
          </View>
        ) : (
          <Text style={styles.touchHint}>Drag across the graph to estimate a level</Text>
        )}
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Loading tides…</Text>
        </View>
      ) : graphData.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No tide data available</Text>
        </View>
      ) : (
        <>
          <View
            style={styles.graphContainer}
            accessible
            accessibilityLabel="Interactive 24-hour tide graph"
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={selectAtPosition}
            onResponderMove={selectAtPosition}
          >
            <Svg width={width} height={height}>
              <Defs>
                <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={theme.colors.primary} stopOpacity="0.16" />
                  <Stop offset="1" stopColor={theme.colors.primary} stopOpacity="0.01" />
                </LinearGradient>
              </Defs>

              {yScale.ticks(4).map(tick => (
                <React.Fragment key={tick}>
                  <Line
                    x1={padding.left}
                    y1={yScale(tick)}
                    x2={width - padding.right}
                    y2={yScale(tick)}
                    stroke={theme.colors.outline}
                    strokeWidth="0.5"
                    opacity={0.35}
                  />
                  <SvgText
                    x={padding.left - 7}
                    y={yScale(tick)}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    fontSize="10"
                    fontFamily="Poppins_400Regular"
                    fill={theme.colors.onSurfaceVariant}
                  >
                    {Math.round(tick)}m
                  </SvgText>
                </React.Fragment>
              ))}

              <Path d={areaPath} fill="url(#areaGradient)" />
              <Line
                x1={padding.left}
                y1={height - padding.bottom}
                x2={width - padding.right}
                y2={height - padding.bottom}
                stroke={theme.colors.outline}
                strokeWidth="1"
              />

              {timeLabels.map(({ hour, time, label }) => (
                <React.Fragment key={hour}>
                  <Line
                    x1={xScale(time)}
                    y1={height - padding.bottom}
                    x2={xScale(time)}
                    y2={height - padding.bottom + 4}
                    stroke={theme.colors.outline}
                  />
                  <SvgText
                    x={xScale(time)}
                    y={height - padding.bottom + 19}
                    textAnchor={hour === 0 ? 'start' : hour === 24 ? 'end' : 'middle'}
                    fontSize="9"
                    fontFamily="Poppins_400Regular"
                    fill={theme.colors.onSurfaceVariant}
                  >
                    {label}
                  </SvgText>
                </React.Fragment>
              ))}

              {showSeaLevel && (
                <Line
                  x1={padding.left}
                  y1={seaLevelY}
                  x2={width - padding.right}
                  y2={seaLevelY}
                  stroke={theme.colors.outline}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity={0.65}
                />
              )}

              {showNow && (
                <>
                  <Line
                    x1={xScale(center)}
                    y1={padding.top}
                    x2={xScale(center)}
                    y2={height - padding.bottom}
                    stroke={theme.colors.secondary}
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <SvgText
                    x={xScale(center)}
                    y={padding.top - 7}
                    textAnchor="middle"
                    fontSize="9"
                    fontFamily="Poppins_600SemiBold"
                    fill={theme.colors.secondary}
                  >
                    NOW
                  </SvgText>
                </>
              )}

              <Path
                d={path}
                stroke={theme.colors.primary}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {visibleEvents.map((tide, index) => (
                <Circle
                  key={`${tide.time}-${index}`}
                  cx={xScale(parseISO(tide.time))}
                  cy={yScale(tide.height)}
                  r="4"
                  fill={theme.colors.surface}
                  stroke={theme.colors.primary}
                  strokeWidth="2"
                />
              ))}

              {selectedPoint && (
                <>
                  <Line
                    x1={xScale(selectedPoint.time)}
                    y1={padding.top}
                    x2={xScale(selectedPoint.time)}
                    y2={height - padding.bottom}
                    stroke={theme.colors.onSurface}
                    strokeWidth="1"
                  />
                  <Circle
                    cx={xScale(selectedPoint.time)}
                    cy={yScale(selectedPoint.height)}
                    r="6"
                    fill={theme.colors.surface}
                    stroke={theme.colors.onSurface}
                    strokeWidth="2.5"
                  />
                </>
              )}
            </Svg>
          </View>

        </>
      )}
    </View>
  );
};
