import React from 'react';
import { View, StyleSheet, useWindowDimensions, ViewProps } from 'react-native';

interface ResponsiveContainerProps extends ViewProps {
  children: React.ReactNode;
}

export function ResponsiveContainer({ children, style, ...props }: ResponsiveContainerProps) {
  const { width } = useWindowDimensions();
  
  // Enterprise standard: Cap content at 600px for tablets, use 90% for phones
  const isTablet = width > 768;
  const containerWidth = isTablet ? 600 : '100%';

  return (
    <View 
      style={[
        styles.outer, 
        { width: '100%', alignItems: 'center' }
      ]}
    >
      <View 
        {...props} 
        style={[
          { width: containerWidth }, 
          style
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
  }
});
