// src/__mocks__/reactNativeMock.js
const React = require('react');

module.exports = {
  Platform: {
    OS: 'ios',
    select: (obj) => obj.ios || obj.default,
  },
  AppState: {
    currentState: 'active',
    addEventListener: () => ({ remove: () => {} }),
    removeEventListener: () => {},
  },
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => (Array.isArray(style) ? Object.assign({}, ...style) : style || {}),
    absoluteFill: {},
    absoluteFillObject: {},
  },
  Alert: {
    alert: () => {},
  },
  LogBox: {
    ignoreAllLogs: () => {},
    ignoreLogs: () => {},
  },
  Dimensions: {
    get: () => ({ width: 375, height: 812, scale: 2, fontScale: 1 }),
    addEventListener: () => ({ remove: () => {} }),
  },
  View: (props) => React.createElement('div', props),
  Text: (props) => React.createElement('span', props),
  TouchableOpacity: (props) => React.createElement('button', props),
  ScrollView: (props) => React.createElement('div', props),
  Modal: (props) => React.createElement('div', props),
  ActivityIndicator: (props) => React.createElement('div', props),
  StatusBar: () => null,
};
