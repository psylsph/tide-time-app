// Global Jest setup. The Expo font hooks and splash-screen APIs touch native
// modules that do not exist under jsdom/node, so we provide lightweight mocks
// that let component tests render without loading real fonts.
jest.mock('@expo-google-fonts/poppins', () => ({
  useFonts: () => [true, null],
  Poppins_400Regular: 'Poppins_400Regular',
  Poppins_500Medium: 'Poppins_500Medium',
  Poppins_600SemiBold: 'Poppins_600SemiBold',
  Poppins_700Bold: 'Poppins_700Bold',
}));

jest.mock('expo-font', () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve()),
  fontFamilyWithIcons: jest.fn((name: string) => name),
}));

// react-native-paper renders icons via @expo/vector-icons, which at module-load
// time consults the (native) expo-font registry. Provide a lightweight stand-in
// so components render without a native font registry.
jest.mock('@expo/vector-icons', () => {
  const React = jest.requireActual('react');
  const MockIcon = (props: Record<string, unknown>) =>
    React.createElement('ExpoVectorIconMock', props);
  const registry: Record<string, unknown> = { MaterialCommunityIcons: MockIcon };
  return new Proxy(registry, {
    get: (target, prop) =>
      Object.prototype.hasOwnProperty.call(target, prop) ? target[prop as string] : MockIcon,
  });
});

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'denied' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 50.7989, longitude: -1.1091 }, // Portsmouth
  }),
}));

// d3 ships as untranspiled ESM which Jest cannot import directly. The
// curve/scale *math* is unit-tested separately in `tideCurve.test.ts`; for
// component render tests we only need stub scales and empty path generators.
jest.mock('d3', () => {
  const scaleLinear = () => {
    const s: (v: number) => number = (v: number) => v;
    (s as unknown as { domain: () => unknown }).domain = () => s;
    (s as unknown as { range: () => unknown }).range = () => s;
    (s as unknown as { nice: () => unknown }).nice = () => s;
    (s as unknown as { ticks: () => number[] }).ticks = () => [0, 1, 2, 3, 4, 5];
    return s;
  };
  const scaleTime = () => {
    const s: (v: unknown) => number = () => 0;
    (s as unknown as { domain: () => unknown }).domain = () => s;
    (s as unknown as { range: () => unknown }).range = () => s;
    return s;
  };
  const makeGenerator = () => {
    const gen = () => '';
    const chain = gen as unknown as {
      x: () => unknown;
      y: () => unknown;
      y0: () => unknown;
      y1: () => unknown;
      curve: () => unknown;
    };
    chain.x = () => gen;
    chain.y = () => gen;
    chain.y0 = () => gen;
    chain.y1 = () => gen;
    chain.curve = () => gen;
    return gen;
  };
  return {
    scaleLinear,
    scaleTime,
    line: makeGenerator,
    area: makeGenerator,
    curveBasis: 'curveBasis',
  };
});
