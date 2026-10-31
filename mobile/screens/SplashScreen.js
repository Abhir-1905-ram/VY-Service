import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar } from 'react-native';
import { colors, fonts } from '../ui/Theme';

export default function SplashScreen({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to login after animation
    const timer = setTimeout(() => {
      onFinish();
    }, 2500); // Show for 2.5 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDeep} translucent={false} />
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowBottom} />

      <View style={styles.content}>
        <Animated.View style={[styles.mark, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Text style={[styles.letter, styles.v]}>V</Text>
          <Text style={[styles.letter, styles.y]}>Y</Text>
        </Animated.View>
        <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
          <Text style={styles.title}>VY Service</Text>
          <Text style={styles.subtitle}>Vyshnavi Computers</Text>
        </Animated.View>
      </View>

      <Animated.Text style={[styles.footer, { opacity: fadeAnim }]}>Repair · Service · Attendance</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryDeep,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: -140,
    right: -120,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: colors.primary,
    opacity: 0.25,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -160,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.primaryDark,
    opacity: 0.6,
  },
  content: { alignItems: 'center', justifyContent: 'center' },
  mark: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 28 },
  letter: {
    fontFamily: fonts.brand,
    fontSize: 112,
    fontWeight: '700',
    includeFontPadding: false,
    textShadowColor: 'rgba(31,107,255,0.55)',
    textShadowRadius: 24,
    textShadowOffset: { width: 0, height: 0 },
  },
  v: { color: colors.primary },
  y: { color: '#F8FAFC', marginLeft: -26, textShadowColor: 'rgba(255,255,255,0.35)' },
  textContainer: { alignItems: 'center' },
  title: { fontSize: 30, fontWeight: '800', color: colors.textOnDark, letterSpacing: 1.5, marginBottom: 6 },
  subtitle: { fontSize: 14, fontWeight: '600', color: colors.textOnDarkMuted, letterSpacing: 2, textTransform: 'uppercase' },
  footer: { position: 'absolute', bottom: 48, color: colors.textOnDarkMuted, fontSize: 12, fontWeight: '600', letterSpacing: 1 },
});
