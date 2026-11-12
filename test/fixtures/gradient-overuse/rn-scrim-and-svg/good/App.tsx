import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
export default () => <><LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']} /><LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']} /><LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']} /><Svg><Defs><SvgGradient id="a"><Stop offset="0" stopColor="#FF8A00" /></SvgGradient><SvgGradient id="b" /><SvgGradient id="c" /></Defs></Svg></>;
