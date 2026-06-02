import React, { useMemo, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Linking, 
  Modal,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Phone, X, MessageSquare, Trash2, FileText, Edit2, ShoppingCart, Wallet, Bell, FileDown, MoreVertical, AlertCircle, Check, Circle, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { COLORS, FONTS } from '../theme';
import { Customer, Transaction } from '../types';
import { AnimatedItem } from './AnimatedList';

interface CustomerProfileSheetProps {
  customerId: string | null;
  onClose: () => void;
  customers: Customer[];
  transactions: Transaction[];
  businessName: string;
  onOpenReminderCenter: () => void;
  onOpenQuickAdd: (customerId: string, type: 'sale' | 'payment', amount?: number) => void;
  onOpenReceipt: (txId: string) => void;
  deleteConfirmationId: string | null;
  setDeleteConfirmationId: (id: string | null) => void;
  deleteCustomer: (id: string) => void;
  onOpenEditPhone: (customerId: string, customerName: string, currentPhone: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (txId: string) => void;
}

export default function CustomerProfileSheet({
  customerId,
  onClose,
  customers,
  transactions,
  businessName,
  onOpenReminderCenter,
  onOpenQuickAdd,
  onOpenReceipt,
  deleteConfirmationId,
  setDeleteConfirmationId,
  deleteCustomer,
  onOpenEditPhone,
  onEditTransaction,
  onDeleteTransaction,
}: CustomerProfileSheetProps) {

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'transactions' | 'payments' | 'notes'>('overview');
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

  const profile = useMemo(() => {
    if (!customerId) return null;
    return customers.find(c => c.id === customerId) || null;
  }, [customerId, customers]);

  const logs = useMemo(() => {
    if (!customerId) return [];
    return transactions
      .filter(t => t.customerId === customerId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [customerId, transactions]);

  // Filter logs by type for transactions/payments sub-tabs
  const salesLogs = useMemo(() => logs.filter(t => t.type === 'sale'), [logs]);
  const paymentsLogs = useMemo(() => logs.filter(t => t.type === 'payment'), [logs]);

  // Compute stats totals
  const totalSalesVal = useMemo(() => {
    return salesLogs.reduce((sum, item) => sum + item.totalAmount, 0);
  }, [salesLogs]);

  const totalPaymentsVal = useMemo(() => {
    return paymentsLogs.reduce((sum, item) => sum + item.amountPaid, 0);
  }, [paymentsLogs]);

  // Compute running balance for each log entry (chronological oldest-first, then reverse for display)
  const logsWithBalance = useMemo(() => {
    const chronological = [...logs].sort((a, b) => {
      const dateComp = a.date.localeCompare(b.date);
      if (dateComp !== 0) return dateComp;
      const idxA = transactions.findIndex(t => t.id === a.id);
      const idxB = transactions.findIndex(t => t.id === b.id);
      return idxA - idxB;
    });
    let balance = 0;
    const withBalance = chronological.map(log => {
      const change = log.type === 'sale' ? (log.totalAmount - log.amountPaid) : -log.amountPaid;
      balance += change;
      return { ...log, runningBalance: balance };
    });
    return withBalance.reverse(); // newest first for display
  }, [logs, transactions]);

  if (!customerId || !profile) return null;

  const isDue = profile.pendingAmount > 0;
  const isCredit = profile.pendingAmount < 0;

  const initials = profile.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleCallPress = () => {
    if (!profile.phone || profile.phone === '9999999999' || profile.phone.trim() === '') {
      onOpenEditPhone(profile.id, profile.name, '');
    } else {
      Linking.openURL(`tel:${profile.phone}`);
    }
  };

  const handleWhatsAppPress = () => {
    if (!profile.phone || profile.phone === '9999999999' || profile.phone.trim() === '') {
      onOpenEditPhone(profile.id, profile.name, '');
    } else {
      const digits = profile.phone.replace(/[^0-9]/g, '');
      const formatted = digits.startsWith('91') ? digits : `91${digits}`;
      Linking.openURL(`whatsapp://send?phone=${formatted}`);
    }
  };

  // Format date e.g. 16 May 2024
  const formatVisualDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const monthsAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${day} ${monthsAbbr[monthIndex]} ${year}`;
    }
    return dateStr;
  };

  return (
    <View style={styles.content}>
      {/* Full Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton} activeOpacity={0.7}>
          <ChevronLeft size={24} color={COLORS.textDark} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Client Profile</Text>
        <TouchableOpacity 
          onPress={() => {
            Alert.alert(
              "More Actions",
              "What would you like to do?",
              [
                { text: "Update Phone Number", onPress: () => onOpenEditPhone(profile.id, profile.name, profile.phone || '') },
                { text: "Generate Account Ledger Report", onPress: () => onOpenReminderCenter() },
                { text: "Cancel", style: "cancel" }
              ]
            );
          }}
          style={styles.moreButton} 
          activeOpacity={0.7}
        >
          <MoreVertical size={18} color={COLORS.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Profile Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroMainRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.heroDetails}>
              <Text style={styles.heroName}>{profile.name}</Text>
              
              <View style={styles.phoneRow}>
                {profile.phone && profile.phone !== '9999999999' && profile.phone.trim() !== '' ? (
                  <View style={styles.phoneActionContainer}>
                    <TouchableOpacity onPress={handleCallPress} activeOpacity={0.7}>
                      <Text style={styles.heroPhone}>
                        {profile.phone.replace(/[^0-9]/g, '').slice(0, 5)} {profile.phone.replace(/[^0-9]/g, '').slice(5)}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleWhatsAppPress} activeOpacity={0.7} style={styles.whatsappIconBtn}>
                      <MessageSquare size={13} color="#25D366" fill="#25D366" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    onPress={() => onOpenEditPhone(profile.id, profile.name, '')} 
                    activeOpacity={0.7}
                    style={styles.addPhonePill}
                  >
                    <Phone size={12} color={COLORS.coral} style={{ marginRight: 4 }} />
                    <Text style={styles.addPhoneLink}>+ Add Phone</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.tagBadgeRow}>
                <View style={styles.tagBadge}>
                  <Text style={styles.tagBadgeText}>↑ Since May 2023</Text>
                </View>
                <View style={[styles.tagBadge, styles.tagBadgeGreen]}>
                  <Text style={[styles.tagBadgeText, styles.tagBadgeTextGreen]}>✓ Trusted</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Nested metrics row card */}
          <View style={styles.nestedMetricsCard}>
            <View style={styles.nestedMetricItem}>
              <Text style={styles.nestedMetricVal}>{profile.totalGheeKg} kg</Text>
              <Text style={styles.nestedMetricLabel}>Ghee Taken</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.nestedMetricItem}>
              <Text style={[styles.nestedMetricVal, { color: COLORS.red }]}>₹{profile.pendingAmount.toLocaleString('en-IN')}</Text>
              <Text style={styles.nestedMetricLabel}>Outstanding</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.nestedMetricItem}>
              <Text style={styles.nestedMetricVal}>{logs.length}</Text>
              <Text style={styles.nestedMetricLabel}>Transactions</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions section */}
        <Text style={styles.sectionLabel}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity 
            onPress={() => onOpenQuickAdd(profile.id, 'sale')} 
            style={styles.quickActionCard}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconCircle}>
              <ShoppingCart size={16} color={COLORS.textDark} />
            </View>
            <Text style={styles.quickActionText}>Record Sale</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => onOpenQuickAdd(profile.id, 'payment', profile.pendingAmount)} 
            style={styles.quickActionCard}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconCircle}>
              <Wallet size={16} color={COLORS.textDark} />
            </View>
            <Text style={styles.quickActionText}>Record Payment</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={onOpenReminderCenter} 
            disabled={profile.pendingAmount <= 0}
            style={[styles.quickActionCard, profile.pendingAmount <= 0 && styles.actionButtonDisabled]}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconCircle}>
              <Bell size={16} color={COLORS.textDark} />
            </View>
            <Text style={styles.quickActionText}>Send Reminder</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={onOpenReminderCenter} 
            style={styles.quickActionCard}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconCircle}>
              <FileText size={16} color={COLORS.textDark} />
            </View>
            <Text style={styles.quickActionText}>Statement</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Selector pills for Overview, Transactions, Payments, Notes */}
        <View style={styles.subTabRow}>
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'transactions', label: 'Transactions' },
            { key: 'payments', label: 'Payments' },
            { key: 'notes', label: 'Notes' }
          ].map((subOpt) => (
            <TouchableOpacity
              key={subOpt.key}
              onPress={() => setActiveSubTab(subOpt.key as any)}
              style={[
                styles.subTabBtn,
                activeSubTab === subOpt.key && styles.subTabBtnActive
              ]}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.subTabText,
                activeSubTab === subOpt.key && styles.subTabTextActive
              ]}>
                {subOpt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeSubTab === 'overview' && (
          <View style={styles.tabContentArea}>
            {/* Ledger Summary Card */}
            <View style={styles.ledgerSummaryCard}>
              <Text style={styles.ledgerCardTitle}>Ledger Summary</Text>
              <Text style={styles.ledgerCardDate}>As on {formatVisualDate(new Date().toISOString().split('T')[0])}</Text>
              
              <View style={styles.ledgerDetailsGrid}>
                <View style={styles.ledgerDetailItem}>
                  <Text style={styles.ledgerDetailLabel}>Total Ghee Taken</Text>
                  <Text style={styles.ledgerDetailVal}>{profile.totalGheeKg} kg</Text>
                </View>
                <View style={styles.verticalDivider} />
                <View style={styles.ledgerDetailItem}>
                  <Text style={styles.ledgerDetailLabel}>Total Paid ↑</Text>
                  <Text style={[styles.ledgerDetailVal, { color: COLORS.green }]}>₹{totalPaymentsVal.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.verticalDivider} />
                <View style={styles.ledgerDetailItem}>
                  <Text style={styles.ledgerDetailLabel}>Total Dues</Text>
                  <Text style={[styles.ledgerDetailVal, { color: COLORS.red }]}>₹{profile.pendingAmount.toLocaleString('en-IN')}</Text>
                </View>
              </View>
            </View>

            {/* Recent Transactions Section */}
            <View style={styles.recentLogsSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Recent Transactions</Text>
                <TouchableOpacity onPress={() => setActiveSubTab('transactions')}>
                  <Text style={styles.sectionLinkText}>View All</Text>
                </TouchableOpacity>
              </View>

              {logs.length === 0 ? (
                <Text style={styles.emptyLogsText}>No transaction records recorded yet.</Text>
              ) : (
                logs.slice(0, 3).map((log) => {
                  const isSale = log.type === 'sale';
                  return (
                    <View key={log.id} style={styles.recentLogCard}>
                      <View style={styles.recentLogLeft}>
                        <View style={[
                          styles.recentLogIconCircle,
                          { backgroundColor: isSale ? '#FAF2E9' : '#EAF5EC' }
                        ]}>
                          {isSale ? (
                            <ShoppingCart size={13} color={COLORS.accentGold} />
                          ) : (
                            <Wallet size={13} color={COLORS.green} />
                          )}
                        </View>
                        <View>
                          <Text style={styles.recentLogTitle}>
                            {isSale ? `Sale - ${log.quantityKg} kg` : 'Payment Received'}
                          </Text>
                          <Text style={styles.recentLogDate}>{formatVisualDate(log.date)}</Text>
                        </View>
                      </View>
                      <View style={styles.recentLogRight}>
                        <Text style={[
                          styles.recentLogAmount,
                          !isSale && { color: COLORS.green }
                        ]}>
                          {isSale ? `₹${log.totalAmount.toLocaleString('en-IN')}` : `-₹${log.amountPaid.toLocaleString('en-IN')}`}
                        </Text>
                        <View style={[
                          styles.statusPill,
                          isSale ? (log.totalAmount - log.amountPaid > 0 ? styles.statusPillUnpaid : styles.statusPillPaid) : styles.statusPillPaid
                        ]}>
                          <Text style={[
                            styles.statusPillText,
                            isSale ? (log.totalAmount - log.amountPaid > 0 ? styles.statusPillTextUnpaid : styles.statusPillTextPaid) : styles.statusPillTextPaid
                          ]}>
                            {isSale ? (log.totalAmount - log.amountPaid > 0 ? 'Unpaid' : 'Paid') : 'Paid'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}

        {activeSubTab === 'transactions' && (
          <View style={styles.tabContentArea}>
            {salesLogs.length === 0 ? (
              <Text style={styles.emptyLogsText}>No dispatch/sale records recorded.</Text>
            ) : (
              salesLogs.map((log) => (
                <View key={log.id} style={styles.recordItemCard}>
                  <View style={styles.recordItemLeft}>
                    <Text style={styles.recordItemTitle}>Ghee Dispatched: {log.quantityKg} kg</Text>
                    <Text style={styles.recordItemDate}>{formatVisualDate(log.date)} • ₹{log.ratePerKg}/kg</Text>
                    <Text style={styles.recordItemMemo}>{log.notes || 'No dispatch description.'}</Text>
                  </View>
                  <View style={styles.recordItemRight}>
                    <Text style={styles.recordItemAmount}>₹{log.totalAmount.toLocaleString('en-IN')}</Text>
                    <View style={styles.recordItemActions}>
                      <TouchableOpacity onPress={() => onOpenReceipt(log.id)} style={styles.recordActionBtn}>
                        <FileText size={12} color={COLORS.coral} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => onEditTransaction(log)} style={styles.recordActionBtn}>
                        <Edit2 size={12} color={COLORS.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => onDeleteTransaction(log.id)} style={styles.recordActionBtn}>
                        <Trash2 size={12} color={COLORS.red} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeSubTab === 'payments' && (
          <View style={styles.tabContentArea}>
            {paymentsLogs.length === 0 ? (
              <Text style={styles.emptyLogsText}>No payment collections recorded.</Text>
            ) : (
              paymentsLogs.map((log) => (
                <View key={log.id} style={styles.recordItemCard}>
                  <View style={styles.recordItemLeft}>
                    <Text style={[styles.recordItemTitle, { color: COLORS.green }]}>Payment Received</Text>
                    <Text style={styles.recordItemDate}>{formatVisualDate(log.date)}</Text>
                    <Text style={styles.recordItemMemo}>{log.notes || 'No payment memo.'}</Text>
                  </View>
                  <View style={styles.recordItemRight}>
                    <Text style={[styles.recordItemAmount, { color: COLORS.green }]}>- ₹{log.amountPaid.toLocaleString('en-IN')}</Text>
                    <View style={styles.recordItemActions}>
                      <TouchableOpacity onPress={() => onOpenReceipt(log.id)} style={styles.recordActionBtn}>
                        <FileText size={12} color={COLORS.coral} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => onEditTransaction(log)} style={styles.recordActionBtn}>
                        <Edit2 size={12} color={COLORS.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => onDeleteTransaction(log.id)} style={styles.recordActionBtn}>
                        <Trash2 size={12} color={COLORS.red} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeSubTab === 'notes' && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesTitle}>Delivery Instructions & Details</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>
                {profile.notes && profile.notes.trim() !== '' 
                  ? profile.notes 
                  : 'No delivery address or guidelines specified for this client. You can add notes by tapping on edit portfolio.'
                }
              </Text>
            </View>
          </View>
        )}

        {/* Account portfolio removal */}
        <View style={styles.deleteSection}>
          {deleteConfirmationId === profile.id ? (
            <View style={styles.deleteConfirmBox}>
              <Text style={styles.deleteConfirmText}>Wipe client portfolio?</Text>
              <View style={styles.deleteConfirmButtons}>
                <TouchableOpacity
                  onPress={() => deleteCustomer(profile.id)}
                  style={styles.deleteConfirmButtonConfirm}
                >
                  <Text style={styles.deleteConfirmButtonText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDeleteConfirmationId(null)}
                  style={styles.deleteConfirmButtonCancel}
                >
                  <Text style={styles.deleteConfirmButtonTextDark}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setDeleteConfirmationId(profile.id)}
              style={styles.deleteTriggerButton}
              activeOpacity={0.7}
            >
              <Trash2 size={14} color={COLORS.red} style={{ marginRight: 6 }} />
              <Text style={styles.deleteTriggerText}>Delete Client Portfolio</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 19, 0.65)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.bgSand,
    flex: 1,
    position: 'relative',
  },
  topGradient: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    height: 25,
    zIndex: 10,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 25,
    zIndex: 10,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontFamily: FONTS.serif,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  moreButton: {
    padding: 6,
  },
  scrollBody: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 16,
  },
  heroCard: {
    backgroundColor: '#FAF6ED',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eae7e1',
    marginBottom: 16,
  },
  heroMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.bgMintLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  avatarText: {
    fontFamily: FONTS.serif,
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.coral,
  },
  heroDetails: {
    flex: 1,
  },
  heroName: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  phoneActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroPhone: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  whatsappIconBtn: {
    marginLeft: 6,
  },
  addPhonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  addPhoneLink: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.coral,
    fontWeight: 'bold',
  },
  tagBadgeRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  tagBadge: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
  },
  tagBadgeText: {
    fontFamily: FONTS.sans,
    fontSize: 9.5,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  tagBadgeGreen: {
    borderColor: 'rgba(46, 125, 50, 0.2)',
    backgroundColor: 'rgba(46, 125, 50, 0.05)',
  },
  tagBadgeTextGreen: {
    color: COLORS.green,
  },
  nestedMetricsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
  },
  nestedMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  nestedMetricVal: {
    fontFamily: FONTS.sans,
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  nestedMetricLabel: {
    fontFamily: FONTS.sans,
    fontSize: 9.5,
    color: COLORS.textLightMuted,
    fontWeight: 'bold',
    marginTop: 2,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    height: '60%',
    alignSelf: 'center',
  },
  sectionLabel: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
    elevation: 1,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
  },
  actionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionText: {
    fontFamily: FONTS.sans,
    fontSize: 9.5,
    fontWeight: 'bold',
    color: COLORS.textDark,
    textAlign: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.4,
  },
  subTabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2.5,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subTabBtnActive: {
    backgroundColor: COLORS.coral,
    borderColor: COLORS.coral,
  },
  subTabText: {
    fontFamily: FONTS.sans,
    fontSize: 11.5,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  subTabTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  tabContentArea: {
    paddingTop: 4,
  },
  ledgerSummaryCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  ledgerCardTitle: {
    fontFamily: FONTS.sans,
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  ledgerCardDate: {
    fontFamily: FONTS.sans,
    fontSize: 10.5,
    color: COLORS.textLightMuted,
    marginTop: 2,
    marginBottom: 12,
  },
  ledgerDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  ledgerDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  ledgerDetailLabel: {
    fontFamily: FONTS.sans,
    fontSize: 9.5,
    color: COLORS.textLightMuted,
    fontWeight: '600',
  },
  ledgerDetailVal: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginTop: 4,
  },
  recentLogsSection: {
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeading: {
    fontFamily: FONTS.sans,
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  sectionLinkText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.coral,
    fontWeight: '700',
  },
  emptyLogsText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textLightMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  recentLogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  recentLogLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentLogIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  recentLogTitle: {
    fontFamily: FONTS.sans,
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  recentLogDate: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: COLORS.textLightMuted,
    marginTop: 2,
  },
  recentLogRight: {
    alignItems: 'flex-end',
  },
  recentLogAmount: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  statusPillUnpaid: {
    backgroundColor: '#FCEBEB',
  },
  statusPillPaid: {
    backgroundColor: '#EAF5EC',
  },
  statusPillText: {
    fontFamily: FONTS.sans,
    fontSize: 8.5,
    fontWeight: '700',
  },
  statusPillTextUnpaid: {
    color: COLORS.red,
  },
  statusPillTextPaid: {
    color: COLORS.green,
  },
  recordItemCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  recordItemLeft: {
    flex: 1,
  },
  recordItemTitle: {
    fontFamily: FONTS.sans,
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  recordItemDate: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: COLORS.textLightMuted,
    marginTop: 2,
  },
  recordItemMemo: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  recordItemRight: {
    alignItems: 'flex-end',
  },
  recordItemAmount: {
    fontFamily: FONTS.sans,
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  recordItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordActionBtn: {
    padding: 4,
    backgroundColor: COLORS.bgSand,
    borderRadius: 6,
    marginLeft: 4,
  },
  notesContainer: {
    paddingTop: 4,
  },
  notesTitle: {
    fontFamily: FONTS.sans,
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  notesBox: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
  },
  notesText: {
    fontFamily: FONTS.sans,
    fontSize: 12.5,
    color: COLORS.textDark,
    lineHeight: 18,
  },
  deleteSection: {
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingTop: 16,
    marginTop: 12,
  },
  deleteConfirmBox: {
    backgroundColor: '#FCEBEB',
    borderWidth: 1,
    borderColor: 'rgba(185, 60, 60, 0.2)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deleteConfirmText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.red,
  },
  deleteConfirmButtons: {
    flexDirection: 'row',
  },
  deleteConfirmButtonConfirm: {
    backgroundColor: COLORS.red,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 6,
  },
  deleteConfirmButtonCancel: {
    backgroundColor: COLORS.bgWarm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deleteConfirmButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  deleteConfirmButtonTextDark: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  deleteTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  deleteTriggerText: {
    fontFamily: FONTS.sans,
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.red,
  },
});
