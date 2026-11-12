import React from 'react';
import { Text } from 'react-native';
export const escape = (tag: string) => tag.replaceAll('\\:', '☢');
export default () => <Text>⚠︎</Text>;
