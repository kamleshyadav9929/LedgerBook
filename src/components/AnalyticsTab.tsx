import React, { useMemo, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView,
  Modal,
  TouchableOpacity
} from 'react-native';
import Svg, { Rect, G, Line, Text as SvgText, Circle } from 'react-native-svg';
import { Calendar, X, Check } from 'lucide-react-native';
import { COLORS, FONTS } from '../theme';
import { Transaction, InventoryEntry } from '../types';
import InventorySection from './InventorySection';

interface BuyerInfo {
  name: string;
  totalGheeKg: number;
  pendingAmount: number;
}

interface AnalyticsTabProps {
  businessName: string;
  defaultRate: number;
  metrics: {
    totalPending: number;
    volumeKg: number;
    dueAccounts: number;
    cashCollected: number;
    totalSalesRevenue: number;
    topBuyers: BuyerInfo[];
    collectionRate: number;
  };
  transactions: Transaction[];
  customers: BuyerInfo[];
  inventory: InventoryEntry[];
  onAddStock: (quantityKg: number, notes: string) => void;
  triggerNotification: (msg: string, type?: 'success' | 'error') => void;
  period: 'this_month' | 'last_month' | 'last_30_days' | 'all';
  onPeriodChange: (period: 'this_month' | 'last_month' | 'last_30_days' | 'all') => void;
  isPeriodModalOpen: boolean;
  setIsPeriodModalOpen: (isOpen: boolean) => void;
  onNavigateToRecordEntry?: () => void;
}

export default function AnalyticsTab({
  businessName,
  metrics,
  transactions,
  customers,
  inventory,
  onAddStock,
  triggerNotification,
  period,
  onPeriodChange,
  isPeriodModalOpen,
  setIsPeriodModalOpen,
  onNavigateToRecordEntry,
}: AnalyticsTabProps) {

  const scrollRef = useRef<ScrollView>(null);
  const handleScrollToStockForm = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
    triggerNotification('Scroll focused on Procurement form!');
  };

  // Dynamic Time-of-Day Greeting and Month calculations
  const now = new Date();
  const currentMonthName = now.toLocaleString('en-US', { month: 'short' });

  // 1. Helper filter function for transactions by period
  const filterTransactionsByPeriod = (txs: Transaction[], p: string) => {
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth();

    return txs.filter(tx => {
      if (!tx.date) return false;
      const txDate = new Date(tx.date);
      if (isNaN(txDate.getTime())) return false;

      switch (p) {
        case 'this_month':
          return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonthNum;
        
        case 'last_month': {
          const lastMonthDate = new Date(currentYear, currentMonthNum - 1, 1);
          return txDate.getFullYear() === lastMonthDate.getFullYear() && txDate.getMonth() === lastMonthDate.getMonth();
        }

        case 'last_30_days': {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          return txDate >= thirtyDaysAgo && txDate <= now;
        }

        case 'all':
        default:
          return true;
      }
    });
  };

  // 2. Helper filter function for inventory by period
  const filterInventoryByPeriod = (entries: InventoryEntry[], p: string) => {
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth();

    return entries.filter(entry => {
      if (!entry.date) return false;
      const entryDate = new Date(entry.date);
      if (isNaN(entryDate.getTime())) return false;

      switch (p) {
        case 'this_month':
          return entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonthNum;
        
        case 'last_month': {
          const lastMonthDate = new Date(currentYear, currentMonthNum - 1, 1);
          return entryDate.getFullYear() === lastMonthDate.getFullYear() && entryDate.getMonth() === lastMonthDate.getMonth();
        }

        case 'last_30_days': {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          return entryDate >= thirtyDaysAgo && entryDate <= now;
        }

        case 'all':
        default:
          return true;
      }
    });
  };

  // Dynamic period-filtered metrics calculations
  const periodMetrics = useMemo(() => {
    const filteredTxs = filterTransactionsByPeriod(transactions, period);
    
    const totalSalesRevenue = filteredTxs
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + t.totalAmount, 0);
      
    const cashCollected = filteredTxs.reduce((sum, t) => sum + t.amountPaid, 0);
    
    const totalPending = period === 'all' 
      ? metrics.totalPending 
      : Math.max(0, totalSalesRevenue - cashCollected);

    const collectionRate = totalSalesRevenue > 0
      ? Math.min(100, Math.round((cashCollected / totalSalesRevenue) * 100))
      : 100;

    return {
      totalSalesRevenue,
      cashCollected,
      totalPending,
      collectionRate,
    };
  }, [transactions, period, metrics.totalPending]);

  // Weekly Stats calculation dynamically based on period
  const weeklyChartData = useMemo(() => {
    const targetMonthDate = new Date();
    if (period === 'last_month') {
      targetMonthDate.setMonth(targetMonthDate.getMonth() - 1);
    }
    const targetMonthName = targetMonthDate.toLocaleString('en-US', { month: 'short' });
    const targetYear = targetMonthDate.getFullYear();
    const targetMonthNum = targetMonthDate.getMonth();

    const periods = [
      { label: `1 ${targetMonthName}`, sales: 0, payments: 0 },
      { label: `7 ${targetMonthName}`, sales: 0, payments: 0 },
      { label: `14 ${targetMonthName}`, sales: 0, payments: 0 },
      { label: `21 ${targetMonthName}`, sales: 0, payments: 0 },
      { label: `28 ${targetMonthName}`, sales: 0, payments: 0 },
    ];

    let hasTxs = false;
    const filteredTxs = filterTransactionsByPeriod(transactions, period);

    filteredTxs.forEach(tx => {
      if (!tx.date) return;
      const txDate = new Date(tx.date);
      if (isNaN(txDate.getTime())) return;
      
      if (period === 'this_month' || period === 'last_month') {
        if (txDate.getFullYear() === targetYear && txDate.getMonth() === targetMonthNum) {
          hasTxs = true;
          const day = txDate.getDate();
          let idx = 0;
          if (day >= 1 && day < 7) idx = 0;
          else if (day >= 7 && day < 14) idx = 1;
          else if (day >= 14 && day < 21) idx = 2;
          else if (day >= 21 && day < 28) idx = 3;
          else idx = 4;

          if (tx.type === 'sale') {
            periods[idx].sales += tx.totalAmount;
            periods[idx].payments += tx.amountPaid;
          } else if (tx.type === 'payment') {
            periods[idx].payments += tx.amountPaid;
          }
        }
      } else if (period === 'last_30_days') {
        hasTxs = true;
        const diffTime = Math.abs(now.getTime() - txDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        let idx = 4;
        if (diffDays <= 6) idx = 4;
        else if (diffDays <= 12) idx = 3;
        else if (diffDays <= 18) idx = 2;
        else if (diffDays <= 24) idx = 1;
        else idx = 0;

        if (tx.type === 'sale') {
          periods[idx].sales += tx.totalAmount;
          periods[idx].payments += tx.amountPaid;
        } else if (tx.type === 'payment') {
          periods[idx].payments += tx.amountPaid;
        }
      } else {
        hasTxs = true;
        const day = txDate.getDate();
        let idx = 0;
        if (day >= 1 && day < 7) idx = 0;
        else if (day >= 7 && day < 14) idx = 1;
        else if (day >= 14 && day < 21) idx = 2;
        else if (day >= 21 && day < 28) idx = 3;
        else idx = 4;

        if (tx.type === 'sale') {
          periods[idx].sales += tx.totalAmount;
          periods[idx].payments += tx.amountPaid;
        } else if (tx.type === 'payment') {
          periods[idx].payments += tx.amountPaid;
        }
      }
    });

    if (period === 'last_30_days') {
      periods[0].label = 'Days 1-6';
      periods[1].label = 'Days 7-12';
      periods[2].label = 'Days 13-18';
      periods[3].label = 'Days 19-24';
      periods[4].label = 'Days 25-30';
    } else if (period === 'all') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let j = 0; j < 5; j++) {
        const mDate = new Date();
        mDate.setMonth(now.getMonth() - (4 - j));
        periods[j].label = monthNames[mDate.getMonth()];
      }
    }

    return {
      periods,
      hasTxs
    };
  }, [transactions, period, currentMonthName]);

  // Max value of weekly periods for chart scaling
  const maxVal = useMemo(() => {
    const list = weeklyChartData.hasTxs ? weeklyChartData.periods : [];
    const max = Math.max(...list.map(w => Math.max(w.sales, w.payments)), 10000);
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    const step = magnitude / 2 > 0 ? magnitude / 2 : 5000;
    return Math.ceil(max / step) * step;
  }, [weeklyChartData]);

  const yLabels = useMemo(() => {
    return [maxVal, maxVal * 0.5, 0];
  }, [maxVal]);

  const paddingLeft = 45;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 25;
  const chartHeight = 160;
  const chartWidth = 320;
  const chartAreaHeight = chartHeight - paddingTop - paddingBottom;
  const chartAreaWidth = chartWidth - paddingLeft - paddingRight;
  const sectionWidth = chartAreaWidth / 5;
  const barWidth = 10;
  const barGap = 3;
  const offset = (sectionWidth - (barWidth * 2 + barGap)) / 2;

  // Donut chart calculations
  const donutSize = 100;
  const donutStroke = 12;
  const donutRadius = (donutSize - donutStroke) / 2;
  const donutCircumference = 2 * Math.PI * donutRadius;

  const collectionPercent = periodMetrics.collectionRate;
  const pendingPercent = 100 - collectionPercent;

  const collectedDash = (collectionPercent / 100) * donutCircumference;
  const outstandingDash = donutCircumference - collectedDash;

  const hasCollectionData = periodMetrics.totalSalesRevenue > 0 || periodMetrics.cashCollected > 0;

  // Stock Summary calculations
  const stockSummary = useMemo(() => {
    let totalAdded = 0;
    let totalDispatched = 0;
    const filteredInventory = filterInventoryByPeriod(inventory, period);

    filteredInventory.forEach(inv => {
      if (inv.type === 'add') totalAdded += inv.quantityKg;
      else totalDispatched += inv.quantityKg;
    });

    if (totalAdded === 0) {
      return {
        totalAdded: 0,
        totalDispatched: 0,
        currentStock: 0,
        percent: 0,
        isLowStock: false,
        hasStockData: false
      };
    }

    const currentStock = totalAdded - totalDispatched;
    const percent = Math.max(0, Math.min(100, Math.round((currentStock / totalAdded) * 100)));
    const isLowStock = currentStock < 15; // Warning banner trigger

    return {
      totalAdded,
      totalDispatched,
      currentStock,
      percent,
      isLowStock,
      hasStockData: true
    };
  }, [inventory, period]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView ref={scrollRef} style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* 1. SALES VS PAYMENTS CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {period === 'this_month' && 'Sales vs Payments (This Month)'}
            {period === 'last_month' && 'Sales vs Payments (Last Month)'}
            {period === 'last_30_days' && 'Sales vs Payments (Last 30 Days)'}
            {period === 'all' && 'Sales vs Payments (All Time)'}
          </Text>
          
          {/* Horizontal Legend Pills */}
          <View style={styles.legendContainer}>
            <View style={styles.legendPill}>
              <View style={[styles.legendDot, { backgroundColor: '#3a8e63' }]} />
              <Text style={styles.legendLabel}>Sales</Text>
              <Text style={styles.legendValue}>
                ₹{periodMetrics.totalSalesRevenue.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.legendPill}>
              <View style={[styles.legendDot, { backgroundColor: '#1b3e30' }]} />
              <Text style={styles.legendLabel}>Payments</Text>
              <Text style={styles.legendValue}>
                ₹{periodMetrics.cashCollected.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {/* SVG Weekly Bar Chart or Empty State */}
          {!weeklyChartData.hasTxs ? (
            <View style={styles.chartEmptyContainer}>
              <Text style={styles.chartEmptyTitle}>No transaction logs this period</Text>
              <Text style={styles.chartEmptySub}>Record your first sale dispatch or payment to view weekly statistics.</Text>
              <TouchableOpacity 
                style={styles.chartEmptyButton} 
                onPress={onNavigateToRecordEntry}
                activeOpacity={0.7}
              >
                <Text style={styles.chartEmptyButtonText}>Record Entry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.chartWrapper}>
              <Svg width={chartWidth} height={chartHeight}>
                {/* Gridlines and Y Labels */}
                {yLabels.map((val, i) => {
                  const y = paddingTop + (i * (chartAreaHeight / 2));
                  return (
                    <G key={i}>
                      <Line
                         x1={paddingLeft}
                         y1={y}
                         x2={chartWidth - paddingRight}
                         y2={y}
                         stroke="#eae7e1"
                         strokeWidth={1}
                      />
                      <SvgText
                        x={paddingLeft - 8}
                        y={y + 3}
                        fontSize={9}
                        fill={COLORS.textLightMuted}
                        textAnchor="end"
                        fontFamily={FONTS.sans}
                        fontWeight="600"
                      >
                        {val >= 1000 ? `₹${(val / 1000).toFixed(0)}K` : `₹${val}`}
                      </SvgText>
                    </G>
                  );
                })}

                {/* Base X-Axis line */}
                <Line
                  x1={paddingLeft}
                  y1={paddingTop + chartAreaHeight}
                  x2={chartWidth - paddingRight}
                  y2={paddingTop + chartAreaHeight}
                  stroke={COLORS.border}
                  strokeWidth={1.5}
                />

                {/* Double Bars */}
                {weeklyChartData.periods.map((item, i) => {
                  const x = paddingLeft + (i * sectionWidth);
                  const salesHeight = (item.sales / maxVal) * chartAreaHeight;
                  const paymentsHeight = (item.payments / maxVal) * chartAreaHeight;

                  const salesY = paddingTop + chartAreaHeight - salesHeight;
                  const paymentsY = paddingTop + chartAreaHeight - paymentsHeight;

                  return (
                    <G key={i}>
                      {/* Sales Bar */}
                      {item.sales > 0 && (
                        <Rect
                          x={x + offset}
                          y={salesY}
                          width={barWidth}
                          height={salesHeight}
                          fill="#3a8e63"
                          rx={3}
                        />
                      )}
                      {/* Payments Bar */}
                      {item.payments > 0 && (
                        <Rect
                          x={x + offset + barWidth + barGap}
                          y={paymentsY}
                          width={barWidth}
                          height={paymentsHeight}
                          fill="#1b3e30"
                          rx={3}
                        />
                      )}
                      {/* Label */}
                      <SvgText
                        x={x + (sectionWidth / 2)}
                        y={chartHeight - 8}
                        fontSize={9}
                        fill={COLORS.textLightMuted}
                        textAnchor="middle"
                        fontFamily={FONTS.sans}
                        fontWeight="600"
                      >
                        {item.label}
                      </SvgText>
                    </G>
                  );
                })}
              </Svg>
            </View>
          )}
        </View>

        {/* 2. COLLECTIONS OVERVIEW CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Collections Overview</Text>

          <View style={styles.donutLayout}>
            {/* Left Donut Svg */}
            <View style={styles.donutContainer}>
              <Svg width={donutSize} height={donutSize}>
                {hasCollectionData ? (
                  <>
                    {/* Background Pending circle */}
                    <Circle
                      cx={donutSize / 2}
                      cy={donutSize / 2}
                      r={donutRadius}
                      stroke="#1b3e30" // Dark green for pending
                      strokeWidth={donutStroke}
                      fill="none"
                    />
                    {/* Collected arc */}
                    <Circle
                      cx={donutSize / 2}
                      cy={donutSize / 2}
                      r={donutRadius}
                      stroke="#3a8e63" // Green for collected
                      strokeWidth={donutStroke}
                      fill="none"
                      strokeDasharray={`${collectedDash} ${outstandingDash}`}
                      strokeDashoffset={donutCircumference * 0.25}
                      strokeLinecap="round"
                    />
                  </>
                ) : (
                  /* Background Neutral circle */
                  <Circle
                    cx={donutSize / 2}
                    cy={donutSize / 2}
                    r={donutRadius}
                    stroke="#efe9de" // Neutral beige for empty
                    strokeWidth={donutStroke}
                    fill="none"
                  />
                )}
              </Svg>
            </View>

            {/* Vertical Divider */}
            <View style={styles.donutDivider} />

            {/* Right Metrics Grid or Placeholder */}
            {hasCollectionData ? (
              <View style={styles.donutMetricsContainer}>
                <View style={styles.donutStatCol}>
                  <Text style={styles.donutStatPercent}>{collectionPercent}%</Text>
                  <Text style={styles.donutStatLabel}>Collected</Text>
                  <Text style={[styles.donutStatValue, { color: '#2e7d32' }]}>
                    ₹{periodMetrics.cashCollected.toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={[styles.donutStatCol, { marginLeft: 16 }]}>
                  <Text style={[styles.donutStatPercent, { color: '#b93c3c' }]}>{pendingPercent}%</Text>
                  <Text style={styles.donutStatLabel}>Pending</Text>
                  <Text style={[styles.donutStatValue, { color: '#b93c3c' }]}>
                    ₹{periodMetrics.totalPending.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.donutEmptyContainer}>
                <Text style={styles.donutEmptyTitle}>No Sales Logged</Text>
                <Text style={styles.donutEmptySub}>Create a client sale to track outstanding dues and collection rates.</Text>
                <TouchableOpacity 
                  style={styles.donutEmptyButton} 
                  onPress={onNavigateToRecordEntry}
                  activeOpacity={0.7}
                >
                  <Text style={styles.donutEmptyButtonText}>Record Sale</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* 3. STOCK OVERVIEW CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Stock Overview</Text>

          {!stockSummary.hasStockData ? (
            <View style={styles.stockEmptyContainer}>
              <Text style={styles.stockEmptyTitle}>No stock logs logged this period</Text>
              <Text style={styles.stockEmptySub}>Procure your first batch of ghee to start tracking inventory levels.</Text>
              <TouchableOpacity 
                style={styles.stockEmptyButton} 
                onPress={handleScrollToStockForm}
                activeOpacity={0.7}
              >
                <Text style={styles.stockEmptyButtonText}>Procure Stock Batch</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* 3 Metrics Row */}
              <View style={styles.stockColumnsRow}>
                <View style={styles.stockStatBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.stockStatLabel}>Procured</Text>
                    <Text style={styles.procuredArrow}> ▸</Text>
                  </View>
                  <Text style={styles.stockStatValue}>{stockSummary.totalAdded.toLocaleString('en-IN')} kg</Text>
                </View>

                <View style={styles.stockStatBox}>
                  <Text style={styles.stockStatLabel}>Dispatched</Text>
                  <Text style={styles.stockStatValue}>{stockSummary.totalDispatched.toLocaleString('en-IN')} kg</Text>
                </View>

                <View style={styles.stockStatBox}>
                  <Text style={styles.stockStatLabel}>In Stock</Text>
                  <Text style={styles.stockStatValue}>{stockSummary.currentStock.toLocaleString('en-IN')} kg</Text>
                </View>
              </View>

              {/* Progress Bar & Label */}
              <View style={styles.stockBarHeaderRow}>
                <Text style={styles.stockLevelText}>Stock Level</Text>
                <Text style={styles.stockLevelPercent}>{stockSummary.percent}%</Text>
              </View>

              <View style={styles.stockBarBg}>
                <View style={[styles.stockBarFill, { width: `${stockSummary.percent}%` }]} />
              </View>

              {/* Warning Badge */}
              {stockSummary.isLowStock && (
                <View style={styles.warningContainer}>
                  <Text style={styles.warningText}>✦ Low Stock Warning</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* 4. STOCK HISTORY LOG (Spacious inventory form and movement logs scrollable underneath) */}
        <InventorySection
          inventory={inventory}
          onAddStock={onAddStock}
          triggerNotification={triggerNotification}
        />

      </ScrollView>

      {/* 5. ELEGANT PERIOD SELECTOR MODAL */}
      <Modal
        visible={isPeriodModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPeriodModalOpen(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.content}>
            
            <View style={styles.notchContainer}>
              <TouchableOpacity onPress={() => setIsPeriodModalOpen(false)} style={styles.notch} />
            </View>

            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.titleRow}>
                <Calendar size={20} color={COLORS.coral} style={{ marginRight: 6 }} />
                <Text style={styles.title}>Select Time Period</Text>
              </View>
              <TouchableOpacity onPress={() => setIsPeriodModalOpen(false)} style={styles.closeButton}>
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Options List */}
            <View style={styles.modalBody}>
              {[
                { key: 'this_month', label: 'This Month' },
                { key: 'last_month', label: 'Last Month' },
                { key: 'last_30_days', label: 'Last 30 Days' },
                { key: 'all', label: 'All Time' },
              ].map(opt => {
                const isActive = period === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.periodOptionRow, isActive && styles.periodOptionRowActive]}
                    onPress={() => {
                      onPeriodChange(opt.key as any);
                      setIsPeriodModalOpen(false);
                      triggerNotification(`Period filtered to ${opt.label}`);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.periodOptionText, isActive && styles.periodOptionTextActive]}>
                      {opt.label}
                    </Text>
                    {isActive && (
                      <Check size={18} color={COLORS.coral} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 40,
    paddingHorizontal: 0,
  },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16, // Beautifully rounded corners
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 14,
  },
  legendContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  legendPill: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendLabel: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    flex: 1,
  },
  legendValue: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  donutContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#efe9de',
    marginHorizontal: 18,
  },
  donutMetricsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  donutStatCol: {
    flex: 1,
  },
  donutStatPercent: {
    fontFamily: FONTS.sans,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  donutStatLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: COLORS.textLightMuted,
    textTransform: 'uppercase',
    marginTop: 2,
    fontWeight: 'bold',
  },
  donutStatValue: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  stockColumnsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f2ee',
    paddingBottom: 14,
  },
  stockStatBox: {
    flex: 1,
  },
  stockStatLabel: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textLightMuted,
    fontWeight: '600',
  },
  procuredArrow: {
    color: '#3a8e63',
    fontSize: 10,
    fontWeight: 'bold',
  },
  stockStatValue: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginTop: 4,
  },
  stockBarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stockLevelText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  stockLevelPercent: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textDark,
    fontWeight: 'bold',
  },
  stockBarBg: {
    height: 8,
    backgroundColor: '#efe9de',
    borderRadius: 4,
    overflow: 'hidden',
  },
  stockBarFill: {
    height: 8,
    backgroundColor: '#244d3d', // Solid Forest Green progress fill
    borderRadius: 4,
  },
  warningContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  warningText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#df9a57', // Beautiful amber low stock warning text
  },
  chartEmptyContainer: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgSand,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  chartEmptyTitle: {
    fontFamily: FONTS.serif,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 6,
  },
  chartEmptySub: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 15,
  },
  chartEmptyButton: {
    backgroundColor: COLORS.coral,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  chartEmptyButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  donutEmptyContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  donutEmptyTitle: {
    fontFamily: FONTS.serif,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  donutEmptySub: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 10,
    lineHeight: 14,
  },
  donutEmptyButton: {
    backgroundColor: COLORS.coral,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  donutEmptyButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stockEmptyContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgSand,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  stockEmptyTitle: {
    fontFamily: FONTS.serif,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 6,
  },
  stockEmptySub: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
    lineHeight: 15,
  },
  stockEmptyButton: {
    backgroundColor: COLORS.coral,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  stockEmptyButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Modal & Slide-up selector styling
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 19, 0.7)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.bgSand,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  notchContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  notch: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  closeButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: COLORS.bgWarm,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  periodOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: COLORS.white,
    marginBottom: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  periodOptionRowActive: {
    borderColor: 'rgba(36, 77, 61, 0.15)',
    backgroundColor: COLORS.bgMintLight,
  },
  periodOptionText: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  periodOptionTextActive: {
    color: COLORS.coral,
    fontWeight: 'bold',
  },
});
