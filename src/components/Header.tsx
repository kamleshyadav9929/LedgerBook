import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Plus, Calendar, ChevronLeft, History } from 'lucide-react-native';
import { COLORS, FONTS } from '../theme';
import { Customer } from '../types';

interface HeaderProps {
  activeTab: 'customers' | 'analytics' | 'quick-add' | 'vouchers' | 'settings' | 'client-profile';
  businessName: string;
  customers: Customer[];
  onAddCustomerOpen: () => void;
  onCalendarPress?: () => void;
  onBackPress?: () => void;
  onHistoryPress?: () => void;
}

export default function Header({
  activeTab,
  businessName,
  customers,
  onAddCustomerOpen,
  onCalendarPress,
  onBackPress,
  onHistoryPress,
}: HeaderProps) {
  
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 12) return "Good morning! 👋";
    if (hr >= 12 && hr < 17) return "Good afternoon! ☀️";
    if (hr >= 17 && hr < 21) return "Good evening! ☕";
    return "Hello! 🌙";
  };

  const getTitle = (tab: string) => {
    switch (tab) {
      case 'customers': return "Clients";
      case 'client-profile': return "Client Profile";
      case 'analytics': return "Analytics";
      case 'quick-add': return "Record Entry";
      case 'vouchers': return "Receipts";
      case 'settings': return "Settings";
      default: return "GheeLedger";
    }
  };

  const getSubtitle = (tab: string) => {
    switch (tab) {
      case 'customers': return "Manage clients & dispatches";
      case 'client-profile': return "Ledger details & logs";
      case 'analytics': return "Track and analyze your business growth";
      case 'quick-add': return "Add a sale or payment to your ledger";
      case 'vouchers': return "View past transaction logs";
      case 'settings': return "App configurations & backup sync";
      default: return "Smart dairy ledger system";
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.recordHeaderContainer}>
        {/* Left Side (Back Button or Placeholder) */}
        {activeTab !== 'customers' ? (
          <TouchableOpacity 
            onPress={onBackPress}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={COLORS.textDark} strokeWidth={2} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholderButton} />
        )}

        {/* Centered Title & Subtitle */}
        <View style={styles.centeredTextContainer}>
          <Text style={styles.centeredTitleText}>{getTitle(activeTab)}</Text>
          <Text style={styles.centeredSubtitleText}>{getSubtitle(activeTab)}</Text>
        </View>

        {/* Right Side (Contextual Action Button or Placeholder) */}
        {activeTab === 'customers' ? (
          <TouchableOpacity 
            onPress={onAddCustomerOpen}
            style={styles.floatingActionButton}
            activeOpacity={0.8}
          >
            <Plus size={20} color={COLORS.white} />
          </TouchableOpacity>
        ) : activeTab === 'analytics' ? (
          onCalendarPress && (
            <TouchableOpacity 
              onPress={onCalendarPress}
              style={styles.calendarButton}
              activeOpacity={0.8}
            >
              <Calendar size={22} color={COLORS.coral} />
            </TouchableOpacity>
          )
        ) : activeTab === 'quick-add' ? (
          <TouchableOpacity 
            onPress={onHistoryPress}
            style={styles.historyButton}
            activeOpacity={0.7}
          >
            <History size={20} color={COLORS.textDark} strokeWidth={2} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholderButton} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.bgSand, // Completely blends with app background
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  recordHeaderContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.transparent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.transparent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.transparent,
    borderWidth: 0,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0,
    elevation: 0,
  },
  floatingActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.coral, // Deep Forest Green circular button
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  placeholderButton: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.transparent,
  },
  centeredTextContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredTitleText: {
    fontFamily: FONTS.sans,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
    textAlign: 'center',
  },
  centeredSubtitleText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: '#8c948c', // Beautiful muted, warm soft green-gray subtitle matching design
    marginTop: 2,
    textAlign: 'center',
  },
});
