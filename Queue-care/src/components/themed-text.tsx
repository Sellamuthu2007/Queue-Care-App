import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
    letterSpacing: 0.01,
  },
  smallBold: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
    letterSpacing: 0.01,
  },
  default: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 400,
    letterSpacing: 0.01,
  },
  title: {
    fontFamily: Fonts.brand,
    fontSize: 36,
    fontWeight: 700,
    lineHeight: 44,
    letterSpacing: -0.03,
  },
  subtitle: {
    fontFamily: Fonts.brand,
    fontSize: 24,
    fontWeight: 600,
    lineHeight: 32,
    letterSpacing: -0.02,
  },
  link: {
    fontFamily: Fonts.sans,
    lineHeight: 22,
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: 0.01,
  },
  linkPrimary: {
    fontFamily: Fonts.sans,
    lineHeight: 22,
    fontSize: 14,
    fontWeight: 600,
    color: '#3c87f7',
    letterSpacing: 0.01,
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 13,
    lineHeight: 20,
  },
});
