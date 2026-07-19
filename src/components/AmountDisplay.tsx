import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedProps, withTiming, Easing,
} from 'react-native-reanimated';
import { Text as RNText } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useCurrency } from '@/hooks/useCurrency';
import { FontSize, FontWeight, LetterSpacing } from '@/theme/typography';

// Animated text node
Animated.addWhitelistedNativeProps({ text: true });
const AnimatedText = Animated.createAnimatedComponent(RNText);

interface AmountDisplayProps {
  amount: number;
  size?: 'hero' | 'xl' | 'lg' | 'md';
  color?: string;
  showSign?: boolean;
  animate?: boolean;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  size = 'hero',
  color,
  showSign = false,
  animate = true,
}) => {
  const { colors }  = useTheme();
  const { format }  = useCurrency();
  const displayColor = color ?? colors.textPrimary;

  // Just use a regular text — reanimated animatedProps on text is complex
  // Use a simple counter approach via state instead
  const [displayed, setDisplayed] = React.useState(amount);

  useEffect(() => {
    if (!animate) { setDisplayed(amount); return; }
    const start   = displayed;
    const end     = amount;
    const diff    = end - start;
    const steps   = 30;
    const interval = 600 / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased    = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setDisplayed(start + diff * eased);
      if (step >= steps) {
        setDisplayed(end);
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [amount]);

  const fontSizes: Record<string, number> = {
    hero: FontSize['4xl'],
    xl:   FontSize['3xl'],
    lg:   FontSize['2xl'],
    md:   FontSize.xl,
  };

  return (
    <RNText style={[styles.base, { color: displayColor, fontSize: fontSizes[size] }]}>
      {showSign && amount > 0 ? '+' : ''}{format(displayed)}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    fontWeight: FontWeight.bold,
    letterSpacing: LetterSpacing.tight,
  },
});
