import React from 'react';
import { LucideIcon, LucideProps, Play } from 'lucide-react-native';

// The app's Play glyph is always filled with its own colour (tab bar, routine cards, Today's start bar).
export const FilledPlay = ((props: LucideProps) => <Play {...props} fill={props.color} />) as unknown as LucideIcon;
