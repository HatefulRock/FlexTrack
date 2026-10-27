import React from 'react';
import { View, ViewProps } from 'react-native';

// Web build: no native view capture. ViewShot renders its children; captureRef rejects so callers can fall back.
export const captureRef = async (_view: unknown, _options?: unknown): Promise<string> => { throw new Error('captureRef is not available on web'); };
const ViewShot = React.forwardRef<View, ViewProps & { options?: unknown }>(({ options: _options, ...props }, ref) => <View ref={ref} {...props} />);
ViewShot.displayName = 'ViewShot';
export default ViewShot;
