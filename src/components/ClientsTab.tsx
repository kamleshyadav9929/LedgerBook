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
import { Search, X, Users, ChevronRight, SlidersHorizontal } from 'lucide-react-native';
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
  onAddCustomerOpen: () => void;
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
  onAddCustomerOpen,
}: ClientsTabProps) {
  const searchInputRef = useRef<TextInput>(null);

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

  // Helper to format phone number nicely (e.g. 98765 43210)
  const formatPhoneNumber = (phone: string) => {
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length === 10) {
      return `${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    return phone;
  };

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        
        {/* Premium Stat Summary Cards */}
        <View style={styles.statsContainer}>
          {/* Card 1: Total Clients */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: COLORS.bgMintLight }]}>
              <Users size={14} color={COLORS.coral} />
            </View>
            <Text style={styles.statCardLabel}>Total Clients</Text>
            <Text style={styles.statCardValue}>{customers.length}</Text>
          </View>

          {/* Card 2: Total Dues */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: COLORS.bgRedLight }]}>
              <Text style={{ color: COLORS.red, fontSize: 12, fontWeight: 'bold' }}>↓</Text>
            </View>
            <Text style={styles.statCardLabel}>Total Dues</Text>
            <Text style={styles.statCardValueDue}>₹{metrics.totalPending.toLocaleString('en-IN')}</Text>
          </View>

          {/* Card 3: Ghee Distributed */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: COLORS.accentGoldLight }]}>
              <Text style={{ color: COLORS.accentGold, fontSize: 12, fontWeight: 'bold' }}>🍯</Text>
            </View>
            <Text style={styles.statCardLabel}>Ghee Distributed</Text>
            <Text style={styles.statCardValueGhee}>{metrics.volumeKg.toLocaleString('en-IN')} kg</Text>
          </View>
        </View>

        {/* Search & Filter Row */}
        <View style={styles.searchSection}>
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Search size={16} color={COLORS.textLightMuted} style={styles.searchIcon} />
              <TextInput
                ref={searchInputRef}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search clients by name or phone..."
                placeholderTextColor={COLORS.textLightMuted}
                style={styles.searchInput}
              />
              {searchQuery !== '' && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearIcon}>
                  <X size={16} color={COLORS.textLightMuted} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.filterMenuBtn} activeOpacity={0.7}>
              <SlidersHorizontal size={16} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          {/* Filter Pills row */}
          <View style={styles.filterRow}>
            {[
              { key: 'all', label: 'All Clients' },
              { key: 'due', label: 'Dues Pending' },
              { key: 'clear', label: 'Cleared Accounts' }
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => { setFilterType(opt.key); Haptics.selectionAsync(); }}
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
          </View>
        </View>

        {/* Customer list */}
        <View style={styles.listContainer}>
          {listFilteredCustomers.length === 0 ? (
            customers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Users size={48} color={COLORS.textLightMuted} style={styles.emptyIcon} />
                <Text style={styles.emptyTitleText}>No clients registered yet</Text>
                <Text style={styles.emptySubtitleText}>Add your dairy clients to start recording sales, tracking dispatches and collecting pending dues.</Text>
                <TouchableOpacity
                  onPress={onAddCustomerOpen}
                  style={styles.emptyActionButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyActionButtonText}>Register First Client</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Search size={48} color={COLORS.textLightMuted} style={styles.emptyIcon} />
                <Text style={styles.emptyTitleText}>No search results</Text>
                <Text style={styles.emptySubtitleText}>No clients match your search query or selected filter pill.</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setFilterType('all');
                  }}
                  style={styles.emptyActionButtonOutline}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyActionButtonOutlineText}>Clear Search & Filter</Text>
                </TouchableOpacity>
              </View>
            )
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
                    <View style={styles.cardContent}>
                      <View style={styles.cardLeft}>
                        {/* Mint background, forest green initials avatar */}
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                        <View style={styles.detailsColumn}>
                          <Text style={styles.cardName}>{cust.name}</Text>
                          {cust.phone && cust.phone !== '9999999999' && cust.phone.trim() !== '' ? (
                            <Text style={styles.cardPhone}>{formatPhoneNumber(cust.phone)}</Text>
                          ) : (
                            <TouchableOpacity
                              onPress={() => onOpenEditPhone(cust.id, cust.name, '')}
                              style={styles.addPhoneLink}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.addPhoneLinkText}>+ Add Phone</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      {/* Right section: Ghee taken & dues/settled tag, trailed by chevron */}
                      <View style={styles.cardRight}>
                        <View style={styles.statusGroup}>
                          <Text style={styles.cardGheeBold}>{cust.totalGheeKg} kg</Text>
                          {isDue ? (
                            <Text style={styles.pendingText}>₹{cust.pendingAmount.toLocaleString('en-IN')} pending</Text>
                          ) : isCredit ? (
                            <Text style={styles.creditText}>₹{Math.abs(cust.pendingAmount).toLocaleString('en-IN')} advance</Text>
                          ) : (
                            <Text style={styles.settledText}>Account Settled</Text>
                          )}
                        </View>
                        <ChevronRight size={16} color={COLORS.textLightMuted} style={styles.chevron} />
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
    paddingTop: 12,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    zIndex: 10,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    zIndex: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'flex-start',
    marginHorizontal: 3,
    elevation: 1,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
  statIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statCardLabel: {
    fontFamily: FONTS.sans,
    fontSize: 9.5,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 4,
  },
  statCardValue: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  statCardValueDue: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  statCardValueGhee: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    flex: 1,
    marginRight: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textDark,
    paddingVertical: 8,
  },
  clearIcon: {
    padding: 4,
  },
  filterMenuBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
  },
  filterRow: {
    flexDirection: 'row',
    marginTop: 10,
    width: '100%',
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6,
  },
  filterButtonActive: {
    backgroundColor: COLORS.coral, // Forest Green
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.8,
  },
  emptyTitleText: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitleText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  emptyActionButton: {
    backgroundColor: COLORS.coral,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyActionButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  emptyActionButtonOutline: {
    borderWidth: 1,
    borderColor: COLORS.coral,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyActionButtonOutlineText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.coral,
  },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.2,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.bgMintLight, // soft mint background
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.coral, // Forest Green initials
  },
  detailsColumn: {
    flex: 1,
  },
  cardName: {
    fontFamily: FONTS.sans,
    fontSize: 13.5,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  cardPhone: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  addPhoneLink: {
    marginTop: 2,
  },
  addPhoneLinkText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.coral,
    fontWeight: 'bold',
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  statusGroup: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  cardGheeBold: {
    fontFamily: FONTS.sans,
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  pendingText: {
    fontFamily: FONTS.sans,
    fontSize: 10.5,
    color: COLORS.red,
    fontWeight: '600',
    marginTop: 2,
  },
  creditText: {
    fontFamily: FONTS.sans,
    fontSize: 10.5,
    color: COLORS.green,
    fontWeight: '600',
    marginTop: 2,
  },
  settledText: {
    fontFamily: FONTS.sans,
    fontSize: 10.5,
    color: COLORS.green,
    fontWeight: '600',
    marginTop: 2,
  },
  chevron: {
    marginLeft: 2,
  },
});
