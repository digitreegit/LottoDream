// ============================================
// User in circle — matches assets/user-circle.svg
// ============================================
import React from 'react';
import Svg, { Path } from 'react-native-svg';

const USER_CIRCLE_PATH =
  'M18.59,19.33c-1.42-1.88-3.63-2.98-5.98-2.98s-4.57,1.1-5.98,2.98M18.59,19.33c3.71-3.3,4.05-8.99.74-12.71-3.3-3.71-8.99-4.05-12.71-.74s-4.05,8.99-.74,12.71c.23.26.48.51.74.74M18.59,19.33c-1.65,1.47-3.78,2.28-5.98,2.27-2.21,0-4.34-.81-5.98-2.27M15.61,10.36c0,1.66-1.34,3-3,3s-3-1.34-3-3,1.34-3,3-3,3,1.34,3,3Z';

type Props = {
  size?: number;
  color?: string;
};

export function UserCircleIcon({ size = 28, color = '#1F2937' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 25.2 25.2" accessibilityRole="image">
      <Path
        d={USER_CIRCLE_PATH}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </Svg>
  );
}
