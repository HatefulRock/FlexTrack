import React from 'react';
import { View, ViewProps } from 'react-native';

export const LinearGradient = ({ colors, style, children, ...props }: ViewProps & { colors: readonly string[]; start?: unknown; end?: unknown; locations?: readonly number[] }) =>
  <View {...props} style={[{ backgroundColor: colors[0] }, style]}>{children}</View>;

