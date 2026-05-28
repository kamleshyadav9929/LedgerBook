import React, { useState, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Search, X, Users, ChevronRight, Mic, MicOff } from 'lucide-react-native';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { COLORS, FONTS } from '../theme';
import { Customer } from '../types';
import { AnimatedItem } from './AnimatedList';

interface ClientsTabProps {
  customers: Customer[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: string;
  setFilterType: (filter: string) => void;
  onSelectCustomer: (id: string) => void;
  metrics: {
    totalPending: number;
    volumeKg: number;
    dueAccounts: number;
  };
  onOpenEditPhone: (customerId: string, customerName: string, currentPhone: string) => void;
}

export default function ClientsTab({
  customers,
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  onSelectCustomer,
  metrics,
  onOpenEditPhone,
}: ClientsTabProps) {
  const searchInputRef = useRef<TextInput>(null);
  const [isListening, setIsListening] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for mic button when listening
  const startPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  }, [pulseAnim]);

  // Speech recognition event handlers
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript;
    if (transcript) {
      setSearchQuery(transcript);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    stopPulse();
  });

  useSpeechRecognitionEvent('error', () => {
    setIsListening(false);
    stopPulse();
  });

  const toggleVoiceSearch = async () => {
    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
      stopPulse();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        return;
      }

      setSearchQuery('');
      setIsListening(true);
      startPulse();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      ExpoSpeechRecognitionModule.start({
        lang: 'hi-IN',
        interimResults: true,
        continuous: false,
      });
    } catch (error) {
      console.error('Speech recognition error:', error);
      setIsListening(false);
      stopPulse();
    }
  };

  // Client search and filter logic (sorted by recent by default)
  const listFilteredCustomers = [...customers]
    .sort((a, b) => {
      const getVal = (c: Customer) => {
        if (c.createdAt) return c.createdAt;
        if (c.id.startsWith('cust_')) {
          const num = parseInt(c.id.replace('cust_', ''), 10);
          if (!isNaN(num)) return num;
        }
        if (c.id.startsWith('c')) {
          const num = parseInt(c.id.substring(1), 10);
          if (!isNaN(num)) return num;
        }
        return 0;
      };
      return getVal(b) - getVal(a);
    })
    .filter(c => {
      const matchText = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery);
      if (filterType === 'all') return matchText;
      if (filterType === 'due') return matchText && c.pendingAmount > 0;
      // Bug #31: 'clear' should match zero balance AND credit (negative) balances
      if (filterType === 'clear') return matchText && c.pendingAmount <= 0;
      return matchText;
    });

  const [topOpacity, setTopOpacity] = useState(0);
  const [bottomOpacity, setBottomOpacity] = useState(1);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollTop = contentOffset.y;
    const contentHeight = contentSize.height;
    const containerHeight = layoutMeasurement.height;

    setTopOpacity(Math.min(Math.max(0, scrollTop / 30), 1));
    const bottomDistance = contentHeight - (scrollTop + containerHeight);
    setBottomOpacity(contentHeight <= containerHeight ? 0 : Math.min(Math.max(0, bottomDistance / 30), 1));
  };

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
      


      {/* Floating Quick Stat Pills */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Outstanding</Text>
          <Text style={styles.statValueDue}>₹{metrics.totalPending.toLocaleString('en-IN')}</Text>
          <Text style={styles.statSubLabel}>Across {metrics.dueAccounts} buyers</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Ghee Supplied</Text>
          <Text style={styles.statValue}> {metrics.volumeKg.toLocaleString('en-IN')} kg</Text>
          <Text style={styles.statSubLabel}>Cumulative weight</Text>
        </View>
      </View>

      {/* Search Input field */}
      <View style={styles.searchSection}>
        <View style={[
          styles.searchContainer,
          isListening && styles.searchContainerListening
        ]}>
          <Search size={16} color={isListening ? COLORS.coral : COLORS.textLightMuted} style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={isListening ? "Listening..." : "Search client name or mobile..."}
            placeholderTextColor={isListening ? COLORS.coral : COLORS.textLightMuted}
            style={styles.searchInput}
          />
          {searchQuery !== '' ? (
            <TouchableOpacity onPress={() => { setSearchQuery(''); if (isListening) { ExpoSpeechRecognitionModule.stop(); setIsListening(false); stopPulse(); } }} style={styles.clearIcon}>
              <X size={16} color={COLORS.textLightMuted} />
            </TouchableOpacity>
          ) : (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity 
                onPress={toggleVoiceSearch}
                style={[
                  styles.micIcon,
                  isListening && styles.micIconActive
                ]}
                activeOpacity={0.7}
              >
                {isListening ? (
                  <MicOff size={16} color={COLORS.white} />
                ) : (
                  <Mic size={16} color={COLORS.coral} />
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* Filter Tab Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {[
            { key: 'all', label: `All Clients (${customers.length})` },
            { key: 'due', label: `Outstanding (${metrics.dueAccounts})` },
            { key: 'clear', label: `Cleared (${customers.length - metrics.dueAccounts})` }
          ].map((opt) => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setFilterType(opt.key)}
              style={[
                styles.filterButton,
                filterType === opt.key && styles.filterButtonActive
              ]}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.filterText,
                filterType === opt.key && styles.filterTextActive
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>


      </View>

      {/* Customer Directory Cards List */}
      <View style={styles.listContainer}>

        {listFilteredCustomers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users size={32} color={COLORS.textLightMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No clients match your selection.</Text>
          </View>
        ) : (
          listFilteredCustomers.map((cust, index) => {
            const isDue = cust.pendingAmount > 0;
            const isCredit = cust.pendingAmount < 0;
            const initials = cust.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <AnimatedItem key={cust.id} index={index}>
                <TouchableOpacity
                  onPress={() => onSelectCustomer(cust.id)}
                  style={styles.card}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View>
                      <Text style={styles.cardName}>{cust.name}</Text>
                      {cust.phone && cust.phone !== '9999999999' && cust.phone.trim() !== '' ? (
                        <Text style={styles.cardPhone}>{cust.phone}</Text>
                      ) : (
                        <TouchableOpacity
                          onPress={() => onOpenEditPhone(cust.id, cust.name, '')}
                          style={styles.addPhoneLink}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.addPhoneLinkText}>+ Add Phone</Text>
                        </TouchableOpacity>
                      )}
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>Total Ghee: {cust.totalGheeKg} kg</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardRight}>
                    <View style={[
                      styles.dueBadge,
                      isDue ? styles.dueBadgeOutstanding : isCredit ? styles.dueBadgeCredit : styles.dueBadgeClear
                    ]}>
                      <Text style={[
                        styles.dueBadgeText,
                        isDue ? styles.dueBadgeTextOutstanding : isCredit ? styles.dueBadgeTextCredit : styles.dueBadgeTextClear
                      ]}>
                        {isDue ? `₹${cust.pendingAmount.toLocaleString('en-IN')}` : isCredit ? `₹${Math.abs(cust.pendingAmount).toLocaleString('en-IN')} Credit` : 'No Dues'}
                      </Text>
                    </View>
                    <View style={styles.profileLink}>
                      <Text style={styles.profileLinkText}>Profile</Text>
                      <ChevronRight size={14} color={COLORS.coral} />
                    </View>
                  </View>
                </TouchableOpacity>
              </AnimatedItem>
            );
          })
        )}
      </View>
      </ScrollView>
      {topOpacity > 0 && (
        <LinearGradient
          colors={[COLORS.bgSand, 'transparent']}
          style={styles.topGradient}
          pointerEvents="none"
        />
      )}
      {bottomOpacity > 0 && (
        <LinearGradient
          colors={['transparent', COLORS.bgSand]}
          style={styles.bottomGradient}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgWarm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 6,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.bgSand,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(230, 223, 216, 0.5)',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },
  statLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValueDue: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.red,
    marginTop: 2,
  },
  statValue: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginTop: 2,
  },
  statSubLabel: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    color: COLORS.textLightMuted,
    marginTop: 2,
  },
  searchSection: {
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 22, // perfect pilled shape!
    paddingHorizontal: 16,
    height: 44,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.sans,
    fontSize: 14,
    color: COLORS.textDark,
    paddingVertical: 8,
  },
  clearIcon: {
    padding: 4,
  },
  micIcon: {
    padding: 6,
    borderRadius: 14,
  },
  micIconActive: {
    backgroundColor: COLORS.coral,
    padding: 6,
    borderRadius: 14,
  },
  searchContainerListening: {
    borderColor: COLORS.coral,
    borderWidth: 2,
    shadowColor: COLORS.coral,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  filterRow: {
    flexDirection: 'row',
    marginTop: 8,
    paddingVertical: 4,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: 'rgba(230, 223, 216, 0.5)',
    marginRight: 6,
  },
  filterButtonActive: {
    backgroundColor: COLORS.coral,
    borderColor: COLORS.coral,
  },
  filterText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  listContainer: {
    paddingBottom: 40,
  },
  emptyContainer: {
    paddingVertical: 40,
    backgroundColor: 'rgba(239, 233, 222, 0.4)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  card: {
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgSand,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontFamily: FONTS.serif,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.coral,
  },
  cardName: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  cardPhone: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.bgSand,
    borderWidth: 1,
    borderColor: 'rgba(230, 223, 216, 0.5)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  badgeText: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textLightMuted,
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  dueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-end',
  },
  dueBadgeOutstanding: {
    backgroundColor: 'rgba(198, 69, 69, 0.1)',
  },
  dueBadgeClear: {
    backgroundColor: 'rgba(93, 184, 114, 0.1)',
  },
  dueBadgeText: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: 'bold',
  },
  dueBadgeTextOutstanding: {
    color: COLORS.red,
  },
  dueBadgeTextClear: {
    color: COLORS.green,
  },
  dueBadgeCredit: {
    backgroundColor: 'rgba(93, 184, 114, 0.15)',
  },
  dueBadgeTextCredit: {
    color: COLORS.green,
  },

  profileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  profileLinkText: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.coral,
    marginRight: 2,
  },
  addPhoneLink: {
    marginTop: 2,
  },
  addPhoneLinkText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.coral,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
