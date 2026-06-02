import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Users, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react-native';
import { COLORS, FONTS } from '../theme';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export default function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <View style={styles.container}>
      {/* Dynamic abstract layout lines or stars in background */}
      <View style={styles.backgroundDecor}>
        <Text style={[styles.decorStar, { top: 120, left: 40 }]}>✦</Text>
        <Text style={[styles.decorStar, { top: 320, right: 30 }]}>✦</Text>
        <Text style={[styles.decorStar, { top: 100, right: 100, fontSize: 14, opacity: 0.2 }]}>✦</Text>
      </View>

      <View style={styles.content}>
        {/* Stylized premium Ghee Pot logo in the center */}
        <View style={styles.logoContainer}>
          <Svg viewBox="0 0 100 100" style={styles.gheePotSvg}>
            {/* The elegant stylized Ghee Pot */}
            <Path
              d="M 50,22 C 39,22 34,28 34,38 C 34,44 38,48 30,58 C 22,68 24,84 50,84 C 76,84 78,68 70,58 C 62,48 66,44 66,38 C 66,28 61,22 50,22 Z"
              fill={COLORS.accentGold}
              opacity={0.15}
            />
            <Path
              d="M 50,25 C 41,25 37,30 37,39 C 37,45 40,48 33,57 C 26,66 28,81 50,81 C 72,81 74,66 67,57 C 60,48 63,45 63,39 C 63,30 59,25 50,25 Z"
              fill={COLORS.accentGold}
            />
            {/* White reflection sheen on Ghee Pot */}
            <Path
              d="M 42,28 C 42,28 39,34 39,40 C 39,44 42,46 37,53 C 32,60 33,72 45,77 C 40,75 35,68 35,60 C 35,51 40,49 40,44 C 40,37 42,32 42,28 Z"
              fill="#ffffff"
              opacity={0.35}
            />
            {/* Golden Ghee droplet */}
            <Path
              d="M 50,45 C 50,45 45,55 45,59 C 45,61.76 47.24,64 50,64 C 52.76,64 55,61.76 55,59 C 55,55 50,45 50,45 Z"
              fill="#ffe49e"
            />
            <Path
              d="M 50,48 C 50,48 47,56 47,59 C 47,60.6 48.3,62 50,62 C 51.7,62 53,60.6 53,59 C 53,56 50,48 50,48 Z"
              fill="#ffffff"
              opacity={0.6}
            />
          </Svg>
          
          {/* Green leaves detail below pot */}
          <View style={styles.leafContainer}>
            {/* Left Leaf */}
            <Svg viewBox="0 0 24 24" style={styles.leftLeaf}>
              <Path
                d="M 17,21 C 17,21 11,19 8,15 C 5,11 6,6 6,6 C 6,6 11,5 15,8 C 19,11 21,17 21,17 Z M 6,6 L 15,15"
                stroke={COLORS.coral}
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
            {/* Right Leaf */}
            <Svg viewBox="0 0 24 24" style={styles.rightLeaf}>
              <Path
                d="M 7,21 C 7,21 13,19 16,15 C 19,11 18,6 18,6 C 18,6 13,5 9,8 C 5,11 3,17 3,17 Z M 18,6 L 9,15"
                stroke={COLORS.coral}
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
          </View>
        </View>

        {/* Editorial Brand Name */}
        <Text style={styles.brandTitle}>
          Ghee<Text style={{ color: COLORS.accentGold }}>Ledger</Text>
        </Text>

        {/* Subtitle / Tagline */}
        <Text style={styles.brandSubtitle}>
          Smart Ledgers. Clear Dues.{"\n"}Strong Business.
        </Text>

        {/* Value Proposition cards row */}
        <View style={styles.featuresRow}>
          {/* Card 1 */}
          <View style={styles.featureCard}>
            <View style={styles.featureIconContainer}>
              <Users size={16} color={COLORS.coral} />
            </View>
            <Text style={styles.featureText}>Track Clients{"\n"}& Dues</Text>
          </View>

          {/* Card 2 */}
          <View style={styles.featureCard}>
            <View style={styles.featureIconContainer}>
              <TrendingUp size={16} color={COLORS.coral} />
            </View>
            <Text style={styles.featureText}>Analyze{"\n"}Business</Text>
          </View>

          {/* Card 3 */}
          <View style={styles.featureCard}>
            <View style={styles.featureIconContainer}>
              <ShieldCheck size={16} color={COLORS.coral} />
            </View>
            <Text style={styles.featureText}>Stay Secure{"\n"}Always</Text>
          </View>
        </View>

        {/* Forest Green CTA Button */}
        <TouchableOpacity
          onPress={onGetStarted}
          style={styles.ctaButton}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaButtonText}>Get Started</Text>
          <View style={styles.ctaArrowCircle}>
            <ArrowRight size={16} color={COLORS.coral} />
          </View>
        </TouchableOpacity>

        {/* Page indicators */}
        <View style={styles.indicatorContainer}>
          <View style={[styles.indicatorDot, styles.indicatorDotActive]} />
          <View style={styles.indicatorDot} />
          <View style={styles.indicatorDot} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgSand,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backgroundDecor: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  decorStar: {
    position: 'absolute',
    fontFamily: FONTS.serif,
    fontSize: 18,
    color: COLORS.accentGold,
    opacity: 0.35,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    zIndex: 5,
  },
  logoContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  gheePotSvg: {
    width: 90,
    height: 90,
    transform: [{ translateY: -10 }],
  },
  leafContainer: {
    position: 'absolute',
    bottom: 8,
    width: 100,
    height: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftLeaf: {
    width: 32,
    height: 32,
    transform: [{ rotate: '-12deg' }, { translateX: 2 }],
  },
  rightLeaf: {
    width: 32,
    height: 32,
    transform: [{ rotate: '12deg' }, { translateX: -2 }],
  },
  brandTitle: {
    fontFamily: FONTS.serif,
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.coral, // Forest Green
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  brandSubtitle: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 44,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 50,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#fffcf7', // Very subtle off-white golden tint card
    borderWidth: 1,
    borderColor: '#ede8de',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
  },
  featureIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e6ede9', // Soft light mint background matching primaryGreen
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontFamily: FONTS.sans,
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.textDark,
    textAlign: 'center',
    lineHeight: 14,
  },
  ctaButton: {
    backgroundColor: COLORS.coral, // Deep Forest Green
    width: '100%',
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  ctaButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    marginRight: 8,
  },
  ctaArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 14,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#dbd5cb',
    marginHorizontal: 3,
  },
  indicatorDotActive: {
    backgroundColor: COLORS.coral,
    width: 14,
  },
});
