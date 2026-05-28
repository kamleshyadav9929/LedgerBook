import React, { useState, useMemo, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Modal 
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { COLORS, FONTS } from '../theme';
import { Transaction } from '../types';
import AnimatedList, { AnimatedItem } from './AnimatedList';

interface AuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
}

export default function AuditLogsModal({
  isOpen,
  onClose,
  transactions,
}: AuditLogsModalProps) {

  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<'all' | 'sale' | 'payment'>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = (t.customerName || '').toLowerCase().includes(ledgerSearch.toLowerCase()) || 
        (t.notes && t.notes.toLowerCase().includes(ledgerSearch.toLowerCase()));
      const matchesType = ledgerTypeFilter === 'all' || t.type === ledgerTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [transactions, ledgerSearch, ledgerTypeFilter]);

  // Bug #32: Use FlatList renderItem for virtualization
  const renderLogItem = useCallback(({ item }: { item: Transaction }) => {
    const isSale = item.type === 'sale';
    return (
      <View style={styles.logCard}>
        <View style={styles.logCardHeader}>
          <Text style={styles.logDate}>{item.date}</Text>
          <View style={[
            styles.logBadge,
            isSale ? styles.logBadgeSale : styles.logBadgePayment
          ]}>
            <Text style={[
              styles.logBadgeText,
              isSale ? styles.logBadgeTextSale : styles.logBadgeTextPayment
            ]}>
              {isSale ? 'DISPATCH' : 'PAYMENT'}
            </Text>
          </View>
        </View>

        <View style={styles.logCardBody}>
          <View>
            <Text style={styles.logName}>{item.customerName}</Text>
            {isSale && (
              <Text style={styles.logDetails}>
                {item.quantityKg} kg @ ₹{item.ratePerKg}/kg
              </Text>
            )}
          </View>
          
          <Text style={[
            styles.logVal,
            isSale ? { color: COLORS.white } : { color: COLORS.green }
          ]}>
            {isSale ? `₹${item.totalAmount}` : `+ ₹${item.amountPaid}`}
          </Text>
        </View>

        {item.notes && item.notes !== '' && (
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>* {item.notes}</Text>
          </View>
        )}
      </View>
    );
  }, []);

  const keyExtractor = useCallback((item: Transaction) => item.id, []);

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        
        {/* Terminal Header */}
        <View style={styles.header}>
          <View style={styles.terminalStatus}>
            <View style={styles.greenPulse} />
            <Text style={styles.terminalText}>system-ledger-log.log</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.8}>
            <X size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Search & Filter row */}
        <View style={styles.controlPanel}>
          <View style={styles.searchContainer}>
            <Search size={14} color="#a09d96" style={styles.searchIcon} />
            <TextInput
              value={ledgerSearch}
              onChangeText={setLedgerSearch}
              placeholder="Search logs by client or memo..."
              placeholderTextColor="#a09d96"
              style={styles.searchInput}
            />
          </View>
          
          <View style={styles.filterRow}>
            {(['all', 'sale', 'payment'] as const).map(type => (
              <TouchableOpacity
                key={type}
                onPress={() => setLedgerTypeFilter(type)}
                style={[
                  styles.filterButton,
                  ledgerTypeFilter === type && styles.filterButtonActive
                ]}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.filterText,
                  ledgerTypeFilter === type && styles.filterTextActive
                ]}>
                  {type === 'all' ? 'All' : type === 'sale' ? 'Dispatches' : 'Payments'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bug #32: Virtualized AnimatedList with gradients instead of FlatList */}
        <AnimatedList
          data={filteredTransactions}
          renderItem={renderLogItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No logs recorded matching queries.</Text>
          }
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          gradientColor={COLORS.bgDark}
          itemDelay={30}
        />

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  header: {
    height: 54,
    backgroundColor: '#1f1e1b',
    borderBottomWidth: 1,
    borderBottomColor: '#252320',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  terminalStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.green,
    marginRight: 8,
  },
  terminalText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: '#a09d96',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#252320',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlPanel: {
    backgroundColor: 'rgba(31, 30, 27, 0.4)',
    borderBottomWidth: 1,
    borderBottomColor: '#252320',
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgDark,
    borderWidth: 1,
    borderColor: '#252320',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.white,
    height: 34,
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#252320',
    padding: 3,
    borderRadius: 4,
  },
  filterButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 3,
  },
  filterButtonActive: {
    backgroundColor: COLORS.bgDark,
  },
  filterText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: '#a09d96',
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: '#a09d96',
    textAlign: 'center',
    paddingVertical: 40,
  },
  logCard: {
    backgroundColor: '#1f1e1b',
    borderWidth: 1,
    borderColor: '#252320',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#252320',
    paddingBottom: 6,
    marginBottom: 8,
  },
  logDate: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: '#a09d96',
  },
  logBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  logBadgeSale: {
    backgroundColor: 'rgba(204, 120, 92, 0.2)',
  },
  logBadgePayment: {
    backgroundColor: 'rgba(93, 184, 114, 0.2)',
  },
  logBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    fontWeight: 'bold',
  },
  logBadgeTextSale: {
    color: COLORS.coral,
  },
  logBadgeTextPayment: {
    color: COLORS.green,
  },
  logCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logName: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  logDetails: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: '#a09d96',
    marginTop: 2,
  },
  logVal: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    fontWeight: 'bold',
  },
  notesBox: {
    backgroundColor: COLORS.bgDark,
    borderWidth: 1,
    borderColor: 'rgba(37, 35, 32, 0.5)',
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
  },
  notesText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    fontStyle: 'italic',
    color: '#a09d96',
  },
});
