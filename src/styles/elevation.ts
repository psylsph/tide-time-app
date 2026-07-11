import { Platform } from 'react-native';
import type { ViewStyle } from 'react-native';

export interface ElevationOptions {
  /** Override the Android `elevation` value (defaults to `level * 2`). */
  androidLevel?: number;
  /** Shadow opacity (0-1). Defaults to 0.1. */
  opacity?: number;
  /** iOS shadow colour. Defaults to the app primary blue. */
  color?: string;
}

/**
 * Cross-platform elevation / drop-shadow helper. Returns the correct style
 * object for Android (`elevation`), web (`box-shadow`) or iOS (`shadow*`).
 * Spread the result into a StyleSheet style to keep shadow definitions DRY.
 */
export function elevation(level = 2, opts: ElevationOptions = {}): ViewStyle {
  const opacity = opts.opacity ?? 0.1;
  const color = opts.color ?? '#1E88E5';
  return (
    Platform.select<ViewStyle>({
      android: { elevation: opts.androidLevel ?? level * 2 },
      web: {
        // boxShadow is web-only; cast satisfies the ViewStyle type.
        boxShadow: `0px ${level}px ${level * 4}px rgba(30, 136, 229, ${opacity})`,
      } as ViewStyle,
      default: {
        shadowColor: color,
        shadowOffset: { width: 0, height: level },
        shadowOpacity: opacity,
        shadowRadius: level * 4,
      },
    }) ?? {}
  );
}
