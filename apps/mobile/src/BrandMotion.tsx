import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated } from "react-native";

export function DisclosureIcon({ open, color = "#087a45" }: { open: boolean; color?:string }) {
  const [rotation] = useState(() => new Animated.Value(open ? 1 : 0));
  useEffect(() => {
    let disposed = false;
    let animation: Animated.CompositeAnimation | undefined;
    void AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (disposed) return;
      animation = Animated.timing(rotation, { toValue: open ? 1 : 0, duration: reduced ? 0 : 360, useNativeDriver: true });
      animation.start();
    }).catch(() => { if (!disposed) rotation.setValue(open ? 1 : 0); });
    return () => { disposed = true; animation?.stop(); };
  }, [open, rotation]);
  return <Animated.Text accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 18, textAlign: "center", color, fontSize: 22, transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-45deg"] }) }] }}>+</Animated.Text>;
}
