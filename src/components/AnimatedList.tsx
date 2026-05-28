import React, { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, FlatListProps, TouchableOpacity, StyleSheet, View, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme';

interface AnimatedItemProps {
  children: React.ReactNode;
  index: number;
  delay?: number;
}

/**
 * A native-performance Spring Scale + Fade stagger animation container.
 * Runs completely on the native OS UI thread for absolute fluid 60fps scrolling.
 */
export function AnimatedItem({ children, index, delay = 40 }: AnimatedItemProps) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
        delay: Math.min(index * delay, 400), // Cap the delay so long lists don't stagger infinitely
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
        delay: Math.min(index * delay, 400),
      }),
    ]).start();
  }, [index]);

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }}
    >
      {children}
    </Animated.View>
  );
}

interface AnimatedListProps<T> extends Partial<FlatListProps<T>> {
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement;
  onItemSelect?: (item: T, index: number) => void;
  itemDelay?: number;
  showGradients?: boolean;
  gradientColor?: string;
}

/**
 * Reusable animated flat list wrapper with high-fidelity scrolling gradients.
 */
export default function AnimatedList<T>({
  data,
  renderItem,
  onItemSelect,
  itemDelay = 40,
  showGradients = true,
  gradientColor = COLORS.bgSand,
  ...props
}: AnimatedListProps<T>) {
  const [topOpacity, setTopOpacity] = useState(0);
  const [bottomOpacity, setBottomOpacity] = useState(1);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!showGradients) return;
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollTop = contentOffset.y;
    const contentHeight = contentSize.height;
    const containerHeight = layoutMeasurement.height;

    // Fade top gradient as user scrolls down
    setTopOpacity(Math.min(Math.max(0, scrollTop / 30), 1));

    // Fade bottom gradient as user approaches bottom
    const bottomDistance = contentHeight - (scrollTop + containerHeight);
    setBottomOpacity(contentHeight <= containerHeight ? 0 : Math.min(Math.max(0, bottomDistance / 30), 1));
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={({ item, index }) => (
          <AnimatedItem index={index} delay={itemDelay}>
            {onItemSelect ? (
              <TouchableOpacity onPress={() => onItemSelect(item, index)} activeOpacity={0.7}>
                {renderItem({ item, index })}
              </TouchableOpacity>
            ) : (
              renderItem({ item, index })
            )}
          </AnimatedItem>
        )}
        keyExtractor={(item, index) => (item as any).id || String(index)}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        {...props}
      />
      {showGradients && topOpacity > 0 && (
        <LinearGradient
          colors={[gradientColor, 'transparent']}
          style={[styles.topGradient, { opacity: topOpacity }]}
          pointerEvents="none"
        />
      )}
      {showGradients && bottomOpacity > 0 && (
        <LinearGradient
          colors={['transparent', gradientColor]}
          style={[styles.bottomGradient, { opacity: bottomOpacity }]}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 35,
    zIndex: 10,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 35,
    zIndex: 10,
  },
});
