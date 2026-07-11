// Jest configuration. The jest-expo preset wires up the React Native test
// environment and auto-mocks the Expo modules. We extend transformIgnorePatterns
// so the untranspiled ESM packages we depend on are compiled for Node.
module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/', '/dist/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-native-paper|@expo-google-fonts|react-native-svg)',
  ],
  setupFiles: ['./jest.setup.ts'],
};
