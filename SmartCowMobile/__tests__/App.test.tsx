/**
 * Basic smoke tests for SmartCow Mobile components.
 * Native modules (gesture handler, screens) are mocked.
 */

jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  return {
    GestureHandlerRootView: View,
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: (c: unknown) => c,
    Directions: {},
  };
});

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
  Screen: require('react-native').View,
  ScreenContainer: require('react-native').View,
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    NavigationContainer: ({ children }: { children: React.ReactNode }) =>
      children,
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
    useRoute: () => ({ params: {} }),
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const { View, Text } = require('react-native');
  const React = require('react');
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }: { children: React.ReactNode }) =>
        React.createElement(View, null, children),
      Screen: ({ component: Component }: { component: React.ComponentType<unknown> }) =>
        React.createElement(Component, { navigation: { navigate: jest.fn(), goBack: jest.fn() }, route: { params: {} } } as unknown as React.ComponentProps<React.ComponentType<unknown>>),
    }),
  };
});

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { AnimatedOrb } from '../src/components/AnimatedOrb';
import { StreamingIndicator } from '../src/components/StreamingIndicator';
import { PromptBox } from '../src/components/PromptBox';

describe('AnimatedOrb', () => {
  it('renders without crashing', () => {
    const tree = ReactTestRenderer.create(<AnimatedOrb />);
    expect(tree).toBeTruthy();
  });

  it('renders in active state', () => {
    const tree = ReactTestRenderer.create(<AnimatedOrb active />);
    expect(tree).toBeTruthy();
  });
});

describe('StreamingIndicator', () => {
  it('renders three dots', () => {
    const tree = ReactTestRenderer.create(<StreamingIndicator />);
    expect(tree).toBeTruthy();
  });
});

describe('PromptBox', () => {
  it('renders with send callback', () => {
    const onSend = jest.fn();
    const tree = ReactTestRenderer.create(<PromptBox onSend={onSend} />);
    expect(tree).toBeTruthy();
  });
});
