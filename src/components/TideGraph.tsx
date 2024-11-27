import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Svg, { Path, Line, Text as SvgText, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as d3 from 'd3';
import { format, parseISO } from 'date-fns';

interface TideEvent {
  type: 'high' | 'low';
  time: string;
  height: number;
}

interface TideGraphProps {
  tideData: TideEvent[];
}

export const TideGraph: React.FC<TideGraphProps> = ({ tideData }) => {
  const theme = useTheme();
  const windowWidth = Dimensions.get('window').width;
  const width = Math.min(windowWidth - 32, 600); // Max width of 600px
  const height = 200;
  const padding = { top: 20, right: 30, bottom: 30, left: 40 };

  const graphData = useMemo(() => {
    // Create interpolated points for a smooth curve
    const points: { time: Date; height: number }[] = [];
    
    // Convert times to Date objects and sort by time
    const sortedData = [...tideData]
      .map(d => ({ ...d, time: parseISO(d.time) }))
      .sort((a, b) => a.time.getTime() - b.time.getTime());

    // Create more interpolated points between each tide event for smoother curve
    for (let i = 0; i < sortedData.length - 1; i++) {
      const current = sortedData[i];
      const next = sortedData[i + 1];
      const steps = 50; // Increased number of interpolation points

      for (let j = 0; j <= steps; j++) {
        const progress = j / steps;
        const time = new Date(
          current.time.getTime() +
            (next.time.getTime() - current.time.getTime()) * progress
        );

        // Use sine interpolation for height
        const phase = progress * Math.PI;
        const height = current.height + (next.height - current.height) * 
          (0.5 - 0.5 * Math.cos(phase)); // Sinusoidal interpolation

        points.push({ time, height });
      }
    }

    return points;
  }, [tideData]);

  const xScale = d3.scaleTime()
    .domain(d3.extent(graphData, d => d.time) as [Date, Date])
    .range([padding.left, width - padding.right]);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(graphData, d => d.height) as number])
    .range([height - padding.bottom, padding.top]);

  const line = d3.line<{ time: Date; height: number }>()
    .x(d => xScale(d.time))
    .y(d => yScale(d.height))
    .curve(d3.curveBasis); // Using curveBasis for smoother interpolation

  const path = line(graphData) || '';

  // Create area path for gradient
  const area = d3.area<{ time: Date; height: number }>()
    .x(d => xScale(d.time))
    .y0(height - padding.bottom)
    .y1(d => yScale(d.height))
    .curve(d3.curveBasis);

  const areaPath = area(graphData) || '';

  // Create hour marks for x-axis
  const getTimeLabels = () => {
    if (tideData.length === 0) return [];
    
    // Get the start of the day from the first tide event
    const firstTideTime = parseISO(tideData[0].time);
    const startOfDay = new Date(firstTideTime);
    startOfDay.setHours(0, 0, 0, 0);

    // Only show labels at 06:00, 12:00, 18:00, 00:00
    const significantHours = [6, 12, 18, 24];
    return significantHours.map(hour => {
      const time = new Date(startOfDay);
      time.setHours(hour);
      return {
        hour,
        time,
        label: format(time, 'HH:mm')
      };
    });
  };

  const timeLabels = getTimeLabels();

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>Tide Levels</Text>
      
      <View style={styles.tideReadings}>
        {tideData.map((tide, index) => (
          <View key={index} style={styles.tideReading}>
            <Text style={[styles.tideType, { color: theme.colors.primary }]}>
              {tide.type[0].toUpperCase() + tide.type.slice(1)}
            </Text>
            <View style={styles.tideDetails}>
              <Text style={[styles.tideTime, { color: theme.colors.secondary }]}>
                {format(parseISO(tide.time), 'HH:mm')}
              </Text>
              <Text style={[styles.tideHeight, { color: theme.colors.primary }]}>
                {tide.height.toFixed(1)}m
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.primary} stopOpacity="0.2" />
            <Stop offset="1" stopColor={theme.colors.primary} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {yScale.ticks(5).map((tick) => (
          <Line
            key={`grid-${tick}`}
            x1={padding.left}
            y1={yScale(tick)}
            x2={width - padding.right}
            y2={yScale(tick)}
            stroke={theme.colors.outline}
            strokeWidth="0.5"
            opacity={0.2}
          />
        ))}

        {/* Area under the curve */}
        <Path
          d={areaPath}
          fill="url(#areaGradient)"
        />

        {/* Y-axis */}
        <Line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke={theme.colors.outline}
          strokeWidth="1"
        />
        
        {/* X-axis */}
        <Line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke={theme.colors.outline}
          strokeWidth="1"
        />

        {/* Y-axis labels */}
        {yScale.ticks(5).map((tick) => (
          <React.Fragment key={tick}>
            <Line
              x1={padding.left - 5}
              y1={yScale(tick)}
              x2={padding.left}
              y2={yScale(tick)}
              stroke={theme.colors.outline}
              strokeWidth="1"
            />
            <SvgText
              x={padding.left - 10}
              y={yScale(tick)}
              textAnchor="end"
              alignmentBaseline="middle"
              fontSize="11"
              fontFamily="System"
              fontWeight="300"
              fill={theme.colors.onSurface}
            >
              {tick}m
            </SvgText>
          </React.Fragment>
        ))}

        {/* X-axis labels */}
        {timeLabels.map(({ hour, time, label }) => (
          <SvgText
            key={hour}
            x={xScale(time)}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            fontSize="11"
            fontFamily="System"
            fontWeight="300"
            fill={theme.colors.onSurface}
          >
            {label}
          </SvgText>
        ))}

        {/* Tide curve */}
        <Path
          d={path}
          stroke={theme.colors.primary}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Tide points */}
        {tideData.map((tide, index) => (
          <React.Fragment key={index}>
            <Circle
              cx={xScale(parseISO(tide.time))}
              cy={yScale(tide.height)}
              r="5"
              fill="#FFFFFF"
              stroke={theme.colors.primary}
              strokeWidth="2"
            />
            <SvgText
              x={xScale(parseISO(tide.time))}
              y={yScale(tide.height) - 12}
              textAnchor="middle"
              fontSize="12"
              fontFamily="System"
              fontWeight="500"
              fill={theme.colors.primary}
            >
              {tide.height.toFixed(1)}m
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    ...Platform.select({
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(30, 136, 229, 0.1)',
      },
      ios: {
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
    }),
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  tideReadings: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  tideReading: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  tideType: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  tideDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tideTime: {
    fontSize: 11,
  },
  tideHeight: {
    fontSize: 11,
    fontWeight: '500',
  },
});
