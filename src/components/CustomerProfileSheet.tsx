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
import { Phone, X, MessageSquare, Trash2, FileText, Edit2 } from 'lucide-react-native';
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

  if (!customerId) return null;

  const profile = customers.find(c => c.id === customerId);
  if (!profile) return null;

  const logs = transactions
    .filter(t => t.customerId === customerId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const isDue = profile.pendingAmount > 0;
  const isCredit = profile.pendingAmount < 0;

  // Compute running balance for each log entry (chronological oldest-first, then reverse for display)
  const logsWithBalance = useMemo(() => {
    const chronological = [...logs].sort((a, b) => {
      const dateComp = a.date.localeCompare(b.date);
      if (dateComp !== 0) return dateComp;
      // Same date: use original transaction order
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

  const handleCallPress = () => {
    if (!profile.phone || profile.phone === '9999999999' || profile.phone.trim() === '') {
      onOpenEditPhone(profile.id, profile.name, '');
    } else {
      Linking.openURL(`tel:${profile.phone}`);
    }
  };

  return (
    <Modal
      visible={!!customerId}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.content, { position: 'relative' }]}>
              {/* Drawer Pull notch */}
              <View style={styles.notchContainer}>
                <TouchableOpacity onPress={onClose} style={styles.notch} />
              </View>

              {/* Header Details */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.name}>{profile.name}</Text>
                  {profile.phone && profile.phone !== '9999999999' && profile.phone.trim() !== '' ? (
                    <TouchableOpacity onPress={handleCallPress} style={styles.phoneRow} activeOpacity={0.7}>
                      <Phone size={14} color={COLORS.coral} style={{ marginRight: 4 }} />
                      <Text style={styles.phoneText}>{profile.phone}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => onOpenEditPhone(profile.id, profile.name, '')} style={styles.phoneRow} activeOpacity={0.7}>
                      <Phone size={14} color={COLORS.coral} style={{ marginRight: 4 }} />
                      <Text style={[styles.phoneText, { textDecorationLine: 'underline', color: COLORS.coral, fontWeight: 'bold' }]}>
                        + Add Phone Number
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.8}>
                  <X size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Scrollable details view */}
              <ScrollView
                contentContainerStyle={styles.scrollBody}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
              >
            
            {/* Outstanding ledger badge card */}
            <View style={styles.metricsContainer}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Delivered Ghee</Text>
                <Text style={styles.metricValue}>{profile.totalGheeKg} kg</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Outstanding Balance</Text>
                <Text style={[
                  styles.metricValue, 
                  isDue ? { color: COLORS.red } : isCredit ? { color: COLORS.green } : { color: COLORS.green }
                ]}>
                  {isCredit ? `₹${Math.abs(profile.pendingAmount).toLocaleString('en-IN')} Credit` : `₹${profile.pendingAmount.toLocaleString('en-IN')}`}
                </Text>
              </View>
            </View>

            {/* Instant Mobile Call / WhatsApp reminder buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={handleCallPress}
                style={styles.actionButton}
                activeOpacity={0.8}
              >
                <Phone size={16} color={COLORS.coral} style={{ marginRight: 6 }} />
                <Text style={styles.actionButtonText}>Call Client</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onOpenReminderCenter}
                disabled={profile.pendingAmount === 0}
                style={[
                  styles.actionButton, 
                  styles.actionButtonCoral,
                  profile.pendingAmount === 0 && styles.actionButtonDisabled
                ]}
                activeOpacity={0.8}
              >
                <MessageSquare size={16} color={COLORS.white} style={{ marginRight: 6 }} />
                <Text style={[styles.actionButtonText, { color: COLORS.white }]}>WhatsApp Dues</Text>
              </TouchableOpacity>
            </View>

            {/* Fast Log Actions */}
            <View style={styles.fastLogSection}>
              <Text style={styles.sectionTitle}>Fast Log Actions</Text>
              <View style={styles.fastLogButtonsRow}>
                <TouchableOpacity
                  onPress={() => onOpenQuickAdd(profile.id, 'sale')}
                  style={styles.fastLogButtonDark}
                  activeOpacity={0.8}
                >
                  <Text style={styles.fastLogButtonText}>+ Deliver Ghee</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onOpenQuickAdd(profile.id, 'payment', profile.pendingAmount)}
                  style={styles.fastLogButtonGreen}
                  activeOpacity={0.8}
                >
                  <Text style={styles.fastLogButtonText}>Collect Dues</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Timeline logs feed */}
            <View style={styles.logsSection}>
              <Text style={styles.sectionTitle}>Statement Log Feed</Text>

              {logs.length === 0 ? (
                <Text style={styles.emptyLogsText}>No previous account balance entries recorded.</Text>
              ) : (
                <View style={styles.timelineList}>
                  {logsWithBalance.map((log, index) => {
                    const isSale = log.type === 'sale';
                    const bal = log.runningBalance;
                    return (
                      <AnimatedItem key={log.id} index={index} delay={30}>
                        <View style={styles.timelineItem}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.timelineItemTitle}>
                              {isSale ? `Disp. ${log.quantityKg} kg` : 'Collect Payment'}
                            </Text>
                            <Text style={styles.timelineItemDate}>{log.date}</Text>
                            <Text style={[
                              styles.timelineBalance,
                              bal > 0 ? { color: COLORS.red } : bal < 0 ? { color: COLORS.green } : { color: COLORS.textLightMuted }
                            ]}>
                              Bal: {bal < 0 ? `₹${Math.abs(bal).toLocaleString('en-IN')} Cr` : `₹${bal.toLocaleString('en-IN')}`}
                            </Text>
                          </View>
                          <View style={styles.timelineItemRight}>
                            <Text style={[
                              styles.timelineItemVal,
                              isSale ? { color: COLORS.textDark } : { color: COLORS.green }
                            ]}>
                              {isSale ? `₹${log.totalAmount.toLocaleString('en-IN')}` : `- ₹${log.amountPaid.toLocaleString('en-IN')}`}
                            </Text>
                            <View style={styles.timelineActions}>
                              <TouchableOpacity 
                                onPress={() => onOpenReceipt(log.id)}
                                style={styles.receiptButton}
                                activeOpacity={0.7}
                              >
                                <FileText size={13} color={COLORS.coral} />
                              </TouchableOpacity>
                              <TouchableOpacity 
                                onPress={() => onEditTransaction(log)}
                                style={styles.timelineActionBtn}
                                activeOpacity={0.7}
                              >
                                <Edit2 size={13} color={COLORS.textMuted} />
                              </TouchableOpacity>
                              <TouchableOpacity 
                                onPress={() => {
                                  Alert.alert(
                                    'Delete Transaction',
                                    `Delete this ${isSale ? 'dispatch' : 'payment'} record? Customer balance will be recalculated.`,
                                    [
                                      { text: 'Cancel', style: 'cancel' },
                                      { text: 'Delete', style: 'destructive', onPress: () => onDeleteTransaction(log.id) }
                                    ]
                                  );
                                }}
                                style={styles.timelineActionBtn}
                                activeOpacity={0.7}
                              >
                                <Trash2 size={13} color={COLORS.red} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      </AnimatedItem>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Account portfolio removal */}
            <View style={styles.deleteSection}>
              {deleteConfirmationId === profile.id ? (
                <View style={styles.deleteConfirmBox}>
                  <Text style={styles.deleteConfirmText}>Are you absolutely sure?</Text>
                  <View style={styles.deleteConfirmButtons}>
                    <TouchableOpacity
                      onPress={() => deleteCustomer(profile.id)}
                      style={styles.deleteConfirmButtonConfirm}
                    >
                      <Text style={styles.deleteConfirmButtonText}>Confirm</Text>
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
                  <Trash2 size={14} color={COLORS.red} style={{ marginRight: 4 }} />
                  <Text style={styles.deleteTriggerText}>Delete Customer Portfolio</Text>
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 19, 0.7)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.bgSand,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
  },
  topGradient: {
    position: 'absolute',
    top: 70, // Start below header
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
  notchContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  notch: {
    width: 40,
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  name: {
    fontFamily: FONTS.serif,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  phoneText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  closeButton: {
    padding: 6,
    backgroundColor: COLORS.bgWarm,
    borderRadius: 20,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgWarm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingVertical: 10,
    marginRight: 8,
  },
  actionButtonCoral: {
    backgroundColor: COLORS.coral,
    borderColor: COLORS.coral,
    marginRight: 0,
  },
  actionButtonDisabled: {
    opacity: 0.4,
  },
  actionButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  fastLogSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  fastLogButtonsRow: {
    flexDirection: 'row',
  },
  fastLogButtonDark: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  fastLogButtonGreen: {
    flex: 1,
    backgroundColor: COLORS.green,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  fastLogButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  logsSection: {
    marginBottom: 16,
  },
  emptyLogsText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textLightMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  timelineList: {
    marginBottom: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(239, 233, 222, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(230, 223, 216, 0.6)',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  timelineItemTitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  timelineItemDate: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    color: COLORS.textLightMuted,
    marginTop: 2,
  },
  timelineBalance: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 3,
  },
  timelineItemRight: {
    alignItems: 'flex-end',
  },
  timelineItemVal: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timelineActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptButton: {
    padding: 5,
    backgroundColor: COLORS.bgSand,
    borderRadius: 4,
  },
  timelineActionBtn: {
    padding: 5,
    backgroundColor: COLORS.bgSand,
    borderRadius: 4,
    marginLeft: 4,
  },
  deleteSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(230, 223, 216, 0.5)',
    paddingTop: 12,
  },
  deleteConfirmBox: {
    backgroundColor: 'rgba(198, 69, 69, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(198, 69, 69, 0.15)',
    borderRadius: 6,
    padding: 10,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginRight: 6,
  },
  deleteConfirmButtonCancel: {
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
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
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.red,
  },
});
