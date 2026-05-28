import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity 
} from 'react-native';
import { Package, Plus, ArrowDown, ArrowUp } from 'lucide-react-native';
import { COLORS, FONTS } from '../theme';
import { InventoryEntry } from '../types';
import { AnimatedItem } from './AnimatedList';

interface InventorySectionProps {
  inventory: InventoryEntry[];
  onAddStock: (quantityKg: number, notes: string) => void;
  triggerNotification: (msg: string, type?: 'success' | 'error') => void;
}

export default function InventorySection({
  inventory,
  onAddStock,
  triggerNotification,
}: InventorySectionProps) {

  const [addQty, setAddQty] = useState('');
  const [addNotes, setAddNotes] = useState('');

  const stockSummary = useMemo(() => {
    let totalAdded = 0;
    let totalDispatched = 0;
    inventory.forEach(inv => {
      if (inv.type === 'add') totalAdded += inv.quantityKg;
      else totalDispatched += inv.quantityKg;
    });
    return {
      totalAdded,
      totalDispatched,
      currentStock: totalAdded - totalDispatched,
    };
  }, [inventory]);

  const recentEntries = inventory.slice(0, 10);
  const stockPercent = stockSummary.totalAdded > 0 
    ? Math.max(0, Math.min(100, (stockSummary.currentStock / stockSummary.totalAdded) * 100)) 
    : 0;

  const handleAddStock = () => {
    const qty = parseFloat(addQty);
    if (!qty || qty <= 0) {
      triggerNotification('Enter a valid quantity.', 'error');
      return;
    }
    onAddStock(qty, addNotes);
    setAddQty('');
    setAddNotes('');
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Package size={18} color={COLORS.coral} style={{ marginRight: 6 }} />
        <Text style={styles.title}>Inventory & Stock Tracker</Text>
      </View>

      {/* Stock Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Procured</Text>
          <Text style={styles.metricValue}>{stockSummary.totalAdded.toLocaleString('en-IN')} kg</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Dispatched</Text>
          <Text style={styles.metricValue}>{stockSummary.totalDispatched.toLocaleString('en-IN')} kg</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>In Stock</Text>
          <Text style={[
            styles.metricValue, 
            { color: stockSummary.currentStock < 5 ? COLORS.red : COLORS.green }
          ]}>
            {stockSummary.currentStock.toLocaleString('en-IN')} kg
          </Text>
        </View>
      </View>

      {/* Stock Level Bar */}
      <View style={styles.stockBarContainer}>
        <View style={styles.stockBarBg}>
          <View style={[
            styles.stockBarFill, 
            { 
              width: `${stockPercent}%`,
              backgroundColor: stockSummary.currentStock < 5 ? COLORS.red : COLORS.green 
            }
          ]} />
        </View>
        <Text style={styles.stockBarLabel}>
          {stockPercent > 0 ? `${Math.round(stockPercent)}% remaining` : 'No stock recorded'}
        </Text>
      </View>

      {/* Add Stock Form */}
      <View style={styles.addSection}>
        <Text style={styles.sectionLabel}>Add New Stock</Text>
        <View style={styles.addForm}>
          <View style={styles.addInputGroup}>
            <TextInput
              keyboardType="numeric"
              value={addQty}
              onChangeText={setAddQty}
              placeholder="Qty (kg)"
              placeholderTextColor={COLORS.textLightMuted}
              style={styles.addInput}
            />
            <TextInput
              value={addNotes}
              onChangeText={setAddNotes}
              placeholder="Source / batch notes"
              placeholderTextColor={COLORS.textLightMuted}
              style={[styles.addInput, { flex: 2, marginLeft: 8 }]}
            />
          </View>
          <TouchableOpacity
            onPress={handleAddStock}
            style={[styles.addButton, (!addQty || parseFloat(addQty) <= 0) && { opacity: 0.5 }]}
            activeOpacity={0.8}
          >
            <Plus size={14} color={COLORS.white} style={{ marginRight: 4 }} />
            <Text style={styles.addButtonText}>Add Stock</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Log */}
      {recentEntries.length > 0 && (
        <View style={styles.logSection}>
          <Text style={styles.sectionLabel}>Recent Movements</Text>
          {recentEntries.map((entry, index) => (
            <AnimatedItem key={entry.id} index={index} delay={30}>
              <View style={styles.logRow}>
                <View style={styles.logLeft}>
                  {entry.type === 'add' ? (
                    <ArrowDown size={12} color={COLORS.green} style={{ marginRight: 6 }} />
                  ) : (
                    <ArrowUp size={12} color={COLORS.coral} style={{ marginRight: 6 }} />
                  )}
                  <View style={[
                    styles.logBadge,
                    { backgroundColor: entry.type === 'add' ? 'rgba(93,184,114,0.15)' : 'rgba(204,120,92,0.15)' }
                  ]}>
                    <Text style={[
                      styles.logBadgeText,
                      { color: entry.type === 'add' ? COLORS.green : COLORS.coral }
                    ]}>
                      {entry.type === 'add' ? 'STOCK IN' : 'DISPATCH'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.logQty}>{entry.type === 'add' ? '+' : '-'}{entry.quantityKg} kg</Text>
                <View style={styles.logRight}>
                  <Text style={styles.logDate}>{entry.date}</Text>
                  {entry.notes ? <Text style={styles.logNotes} numberOfLines={1}>{entry.notes}</Text> : null}
                </View>
              </View>
            </AnimatedItem>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  metricBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  metricLabel: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.textLightMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: FONTS.serif,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  stockBarContainer: {
    marginBottom: 14,
  },
  stockBarBg: {
    height: 6,
    backgroundColor: 'rgba(230, 223, 216, 0.5)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  stockBarFill: {
    height: 6,
    borderRadius: 3,
  },
  stockBarLabel: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    color: COLORS.textLightMuted,
    marginTop: 4,
    textAlign: 'right',
  },
  addSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  addForm: {},
  addInputGroup: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  addInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 36,
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textDark,
  },
  addButton: {
    backgroundColor: COLORS.coral,
    borderRadius: 6,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230, 223, 216, 0.3)',
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 90,
  },
  logBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  logBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 7,
    fontWeight: 'bold',
  },
  logQty: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textDark,
    width: 55,
    textAlign: 'right',
  },
  logRight: {
    flex: 1,
    marginLeft: 8,
  },
  logDate: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.textLightMuted,
  },
  logNotes: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 1,
  },
});
