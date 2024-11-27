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
  const width = Math.min(windowWidth - 64, 600);
  const height = width * 0.5;
  const padding = { top: 30, right: 30, bottom: 40, left: 60 };

  const styles = StyleSheet.create({
    container: {
      padding: 20,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      marginVertical: 8,
      ...Platform.select({
        android: {
          elevation: 4,
        },
        web: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
        },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
      }),
    },
    graphContainer: {
      aspectRatio: 2,
      marginVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timeLabel: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    tideReadingsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
    tideReading: {
      alignItems: 'center',
      flex: 1,
    },
    tideTime: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
    tideHeight: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 20,
      color: theme.colors.onSurface,
    },
    title: {
      fontFamily: 'Poppins_500Medium',
      fontSize: 18,
      color: theme.colors.primary,
      marginBottom: 16,
    },
  });

  const graphData = useMemo(() => {
    const points: { time: Date; height: number }[] = [];
    const sortedData = [...tideData]
      .map(d => ({ ...d, time: parseISO(d.time) }))
      .sort((a, b) => a.time.getTime() - b.time.getTime());

    if (sortedData.length < 2) return points;

    const firstPoint = sortedData[0];
    const lastPoint = sortedData[sortedData.length - 1];
    const timeRange = lastPoint.time.getTime() - firstPoint.time.getTime();
    const numPoints = 50;
    const timeStep = timeRange / (numPoints - 1);

    for (let i = 0; i < numPoints; i++) {
      const currentTime = new Date(firstPoint.time.getTime() + i * timeStep);
      let height = 0;

      for (let j = 0; j < sortedData.length - 1; j++) {
        const point1 = sortedData[j];
        const point2 = sortedData[j + 1];
        
        if (currentTime >= point1.time && currentTime <= point2.time) {
          const timeFraction = (currentTime.getTime() - point1.time.getTime()) /
            (point2.time.getTime() - point1.time.getTime());
          
          height = point1.height + (point2.height - point1.height) * 
            (Math.sin((timeFraction - 0.5) * Math.PI) * 0.5 + 0.5);
          break;
        }
      }

      points.push({ time: currentTime, height });
    }

    return points;
  }, [tideData]);

  const yScale = useMemo(() => {
    const domain = d3.extent(graphData, d => d.height);
    return d3.scaleLinear()
      .domain([Math.max(0, domain[0] - 0.5), domain[1] + 0.5])
      .range([height - padding.bottom, padding.top])
      .nice(3);
  }, [graphData, height, padding]);

  const xScale = d3.scaleTime()
    .domain(d3.extent(graphData, d => d.time) as [Date, Date])
    .range([padding.left, width - padding.right]);

  const line = d3.line<{ time: Date; height: number }>()
    .x(d => xScale(d.time))
    .y(d => yScale(d.height))
    .curve(d3.curveBasis);

  const path = line(graphData) || '';

  const area = d3.area<{ time: Date; height: number }>()
    .x(d => xScale(d.time))
    .y0(height - padding.bottom)
    .y1(d => yScale(d.height))
    .curve(d3.curveBasis);

  const areaPath = area(graphData) || '';

  const timeLabels = useMemo(() => {
    const startTime = xScale.domain()[0];
    const endTime = xScale.domain()[1];
    const hours = [];
    
    for (let hour = 0; hour <= 24; hour += 6) {
      const time = new Date(startTime);
      time.setHours(hour, 0, 0, 0);
      
      if (time >= startTime && time <= endTime) {
        hours.push({
          hour,
          time,
          label: format(time, 'HH:mm'),
        });
      }
    }
    
    return hours;
  }, [xScale]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tide Levels</Text>
      <View style={styles.graphContainer}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={theme.colors.primary} stopOpacity="0.2" />
              <Stop offset="1" stopColor={theme.colors.primary} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>
          {yScale.ticks(3).map((tick) => (
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
          <Path
            d={areaPath}
            fill="url(#areaGradient)"
          />
          <Line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={height - padding.bottom}
            stroke={theme.colors.outline}
            strokeWidth="1"
          />
          <Line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke={theme.colors.outline}
            strokeWidth="1"
          />
          {yScale.ticks(3).map((tick) => (
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
                x={padding.left - 15}
                y={yScale(tick)}
                textAnchor="end"
                alignmentBaseline="middle"
                fontSize="12"
                fontFamily="Poppins_400Regular"
                fill={theme.colors.onSurface}
              >
                {tick.toFixed(1)}m
              </SvgText>
            </React.Fragment>
          ))}
          {timeLabels.map(({ hour, time, label }) => (
            <SvgText
              key={hour}
              x={xScale(time)}
              y={height - padding.bottom + 25}
              textAnchor="middle"
              fontSize="12"
              fontFamily="Poppins_400Regular"
              fill={theme.colors.onSurface}
            >
              {label}
            </SvgText>
          ))}
          <Path
            d={path}
            stroke={theme.colors.primary}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {tideData.map((tide, index) => {
            const x = xScale(parseISO(tide.time));
            const y = yScale(tide.height);
            const isNearYAxis = x < padding.left + 40;
            
            return (
              <React.Fragment key={index}>
                <Circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill={theme.colors.surface}
                  stroke={theme.colors.primary}
                  strokeWidth="2.5"
                />
                <SvgText
                  x={x + (isNearYAxis ? 15 : 0)}
                  y={y - 15}
                  textAnchor={isNearYAxis ? "start" : "middle"}
                  fontSize="13"
                  fontFamily="Poppins_500Medium"
                  fill={theme.colors.primary}
                >
                  {tide.height.toFixed(1)}m
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
      <View style={styles.tideReadingsContainer}>
        {tideData.map((tide, index) => (
          <View key={index} style={styles.tideReading}>
            <Text style={styles.tideTime}>
              {format(parseISO(tide.time), 'HH:mm')}
            </Text>
            <Text style={styles.tideHeight}>
              {tide.height.toFixed(1)}m
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};
