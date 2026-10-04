import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, type ImageSourcePropType, type ImageStyle, type StyleProp } from "react-native";

export function BrandMotion({ source, style, locale }: { source: ImageSourcePropType; style: StyleProp<ImageStyle>; locale: "de" | "en" }) {
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    let disposed = false;
    const animation = Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 180, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.035, duration: 220, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]);
    scale.setValue(1);
    void AccessibilityInfo.isReduceMotionEnabled().then(reduced => { if (!disposed && !reduced) animation.start(); }).catch(() => {});
    return () => { disposed = true; animation.stop(); };
  }, [locale, scale]);
  return <Animated.Image source={source} accessibilityLabel="EAVESENCE" style={[style, { transform: [{ scale }] }]} />;
}

export function DisclosureIcon({ open, color = "#087a45" }: { open: boolean; color?:string }) {
  const [rotation] = useState(() => new Animated.Value(open ? 1 : 0));
  useEffect(() => {
    let disposed = false;
    let animation: Animated.CompositeAnimation | undefined;
    void AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (disposed) return;
      animation = Animated.timing(rotation, { toValue: open ? 1 : 0, duration: reduced ? 0 : 180, useNativeDriver: true });
      animation.start();
    }).catch(() => { if (!disposed) rotation.setValue(open ? 1 : 0); });
    return () => { disposed = true; animation?.stop(); };
  }, [open, rotation]);
  return <Animated.Text accessible={false} style={{ width: 18, textAlign: "center", color, fontSize: 22, transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-45deg"] }) }] }}>+</Animated.Text>;
}
