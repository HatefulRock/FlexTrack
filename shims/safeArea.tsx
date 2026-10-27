import React from 'react';
import { View, ViewProps } from 'react-native';

export const SafeAreaProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const SafeAreaView = ({ children, style, ...props }: ViewProps & { edges?: string[] }) => <View {...props} style={[{ minHeight: 0 }, style]}>{children}</View>;

export const useSafeAreaInsets = () => ({ top: 0, bottom: 0, left: 0, right: 0 });
