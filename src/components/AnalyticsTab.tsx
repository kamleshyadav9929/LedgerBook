import React, { useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView 
} from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import Svg, { Rect, G, Line, Text as SvgText, Circle, Polyline } from 'react-native-svg';
import { COLORS, FONTS } from '../theme';
import { Transaction, InventoryEntry } from '../types';
import InventorySection from './InventorySection';
import { AnimatedItem } from './AnimatedList';

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
}

export default function AnalyticsTab({
  businessName,
  metrics,
  transactions,
  customers,
  inventory,
  onAddStock,
  triggerNotification,
}: AnalyticsTabProps) {

  // Premium Monthly Stats Aggregation & Month-over-Month Comparison
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth(); // 0-indexed

    // Current Month formatted as YYYY-MM
    const currentMonthStr = `${currentYear}-${String(currentMonthNum + 1).padStart(2, '0')}`;
    
    // Previous Month calculation
    const prevMonthNum = currentMonthNum === 0 ? 11 : currentMonthNum - 1;
    const prevYear = currentMonthNum === 0 ? currentYear - 1 : currentYear;
    const prevMonthStr = `${prevYear}-${String(prevMonthNum + 1).padStart(2, '0')}`;

    let currentSales = 0;
    let currentVolume = 0;
    let currentCollected = 0;

    let prevSales = 0;
    let prevVolume = 0;
    let prevCollected = 0;

    transactions.forEach(tx => {
      if (!tx.date) return;
      const txMonthStr = tx.date.substring(0, 7);
      
      if (txMonthStr === currentMonthStr) {
        if (tx.type === 'sale') {
          currentSales += tx.totalAmount;
          currentVolume += tx.quantityKg;
          currentCollected += tx.amountPaid;
        } else if (tx.type === 'payment') {
          currentCollected += tx.amountPaid;
        }
      } else if (txMonthStr === prevMonthStr) {
        if (tx.type === 'sale') {
          prevSales += tx.totalAmount;
          prevVolume += tx.quantityKg;
          prevCollected += tx.amountPaid;
        } else if (tx.type === 'payment') {
          prevCollected += tx.amountPaid;
        }
      }
    });

    const calcPercentChange = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 100);
    };

    const salesDiff = calcPercentChange(currentSales, prevSales);
    const volumeDiff = calcPercentChange(currentVolume, prevVolume);
    const collectedDiff = calcPercentChange(currentCollected, prevCollected);

    const currentMonthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const prevMonthLabel = new Date(prevYear, prevMonthNum).toLocaleString('en-US', { month: 'long' });

    return {
      currentMonthLabel,
      prevMonthLabel,
      currentSales,
      currentVolume,
      currentCollected,
      salesDiff,
      volumeDiff,
      collectedDiff,
    };
  }, [transactions]);

  // Aggregate monthly transactions data for the last 6 months
  const chartData = useMemo(() => {
    const months: { label: string; yearMonth: string; sales: number; payments: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short' });
      months.push({ label, yearMonth, sales: 0, payments: 0 });
    }

    transactions.forEach(tx => {
      if (!tx.date) return;
      const txYearMonth = tx.date.substring(0, 7);
      const monthObj = months.find(m => m.yearMonth === txYearMonth);
      if (monthObj) {
        if (tx.type === 'sale') {
          monthObj.sales += tx.totalAmount;
          monthObj.payments += tx.amountPaid;
        } else if (tx.type === 'payment') {
          monthObj.payments += tx.amountPaid;
        }
      }
    });

    return months;
  }, [transactions]);

  const maxVal = useMemo(() => {
    const max = Math.max(...chartData.map(m => Math.max(m.sales, m.payments)), 1000);
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    const step = magnitude / 2 > 0 ? magnitude / 2 : 500;
    return Math.ceil(max / step) * step;
  }, [chartData]);

  const yLabels = useMemo(() => {
    return [maxVal, maxVal * 0.75, maxVal * 0.5, maxVal * 0.25, 0];
  }, [maxVal]);

  const paddingLeft = 45;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 25;
  const chartHeight = 180;
  const chartWidth = 330;
  const chartAreaHeight = chartHeight - paddingTop - paddingBottom;
  const chartAreaWidth = chartWidth - paddingLeft - paddingRight;
  const sectionWidth = chartAreaWidth / 6;
  const barWidth = 10;
  const barGap = 2;
  const offset = (sectionWidth - (barWidth * 2 + barGap)) / 2;

  // Donut chart calculations
  const donutSize = 120;
  const donutStroke = 16;
  const donutRadius = (donutSize - donutStroke) / 2;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const collectedPercent = (metrics.cashCollected + metrics.totalPending) > 0 
    ? metrics.cashCollected / (metrics.cashCollected + metrics.totalPending) 
    : 1;
  const collectedDash = collectedPercent * donutCircumference;
  const outstandingDash = donutCircumference - collectedDash;

  // Top defaulters
  const topDefaulters = useMemo(() => {
    return [...customers]
      .filter(c => c.pendingAmount > 0)
      .sort((a, b) => b.pendingAmount - a.pendingAmount)
      .slice(0, 5);
  }, [customers]);

  // 30-day sparkline data
  const sparklineData = useMemo(() => {
    const days: number[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const count = transactions.filter(t => t.date === dateStr).length;
      days.push(count);
    }
    return days;
  }, [transactions]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Premium Monthly Stats Summary */}
      <View style={styles.statsCard}>
        <View style={styles.statsTitleRow}>
          <TrendingUp size={18} color={COLORS.coral} style={styles.statsIcon} />
          <Text style={styles.statsTitle}>Premium Monthly Report</Text>
        </View>

        <View style={styles.statsExpandContent}>
          <Text style={styles.statsMonthHeader}>{monthlyStats.currentMonthLabel}</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statsItem}>
              <Text style={styles.statsItemLabel}>Ghee Sales Billings</Text>
              <Text style={styles.statsItemValue}>₹{monthlyStats.currentSales.toLocaleString('en-IN')}</Text>
              <View style={styles.diffRow}>
                <Text style={[
                  styles.diffBadge, 
                  monthlyStats.salesDiff >= 0 ? styles.diffBadgeUp : styles.diffBadgeDown
                ]}>
                  {monthlyStats.salesDiff >= 0 ? '▲' : '▼'} {Math.abs(monthlyStats.salesDiff)}%
                </Text>
                <Text style={styles.diffText}>vs {monthlyStats.prevMonthLabel}</Text>
              </View>
            </View>

            <View style={styles.statsItem}>
              <Text style={styles.statsItemLabel}>Ghee Dispatched</Text>
              <Text style={styles.statsItemValue}>{monthlyStats.currentVolume} kg</Text>
              <View style={styles.diffRow}>
                <Text style={[
                  styles.diffBadge, 
                  monthlyStats.volumeDiff >= 0 ? styles.diffBadgeUp : styles.diffBadgeDown
                ]}>
                  {monthlyStats.volumeDiff >= 0 ? '▲' : '▼'} {Math.abs(monthlyStats.volumeDiff)}%
                </Text>
                <Text style={styles.diffText}>vs {monthlyStats.prevMonthLabel}</Text>
              </View>
            </View>

            <View style={styles.statsItem}>
              <Text style={styles.statsItemLabel}>Cash Collected</Text>
              <Text style={styles.statsItemValue}>₹{monthlyStats.currentCollected.toLocaleString('en-IN')}</Text>
              <View style={styles.diffRow}>
                <Text style={[
                  styles.diffBadge, 
                  monthlyStats.collectedDiff >= 0 ? styles.diffBadgeUp : styles.diffBadgeDown
                ]}>
                  {monthlyStats.collectedDiff >= 0 ? '▲' : '▼'} {Math.abs(monthlyStats.collectedDiff)}%
                </Text>
                <Text style={styles.diffText}>vs {monthlyStats.prevMonthLabel}</Text>
              </View>
            </View>

            <View style={styles.statsItem}>
              <Text style={styles.statsItemLabel}>Realization Rate</Text>
              <Text style={styles.statsItemValue}>
                {monthlyStats.currentSales > 0 
                  ? `${Math.round((monthlyStats.currentCollected / monthlyStats.currentSales) * 100)}%`
                  : '100%'
                }
              </Text>
              <View style={styles.diffRow}>
                <Text style={styles.diffTextSingle}>Realized in cash</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Visual Cashflow Chart Card */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <TrendingUp size={18} color={COLORS.coral} style={styles.chartHeaderIcon} />
          <Text style={styles.chartTitle}>Monthly Cashflow Trend</Text>
        </View>

        <View style={styles.chartWrapper}>
          <Svg width={chartWidth} height={chartHeight}>
            {/* Gridlines and Y Labels */}
            {yLabels.map((val, i) => {
              const y = paddingTop + (i * (chartAreaHeight / 4));
              return (
                <G key={i}>
                  <Line
                     x1={paddingLeft}
                     y1={y}
                     x2={chartWidth - paddingRight}
                     y2={y}
                     stroke="rgba(230, 223, 216, 0.45)"
                     strokeWidth={1}
                  />
                  <SvgText
                    x={paddingLeft - 8}
                    y={y + 3}
                    fontSize={9}
                    fill={COLORS.textMuted}
                    textAnchor="end"
                    fontFamily={FONTS.sans}
                    fontWeight="600"
                  >
                    {val >= 1000 ? `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : `₹${val}`}
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

            {/* Bars and Month Labels */}
            {chartData.map((item, i) => {
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
                      fill={COLORS.coral}
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
                      fill={COLORS.green}
                      rx={3}
                    />
                  )}
                  {/* Month name centering */}
                  <SvgText
                    x={x + (sectionWidth / 2)}
                    y={chartHeight - 8}
                    fontSize={10}
                    fill={COLORS.textMuted}
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

        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: COLORS.coral }]} />
            <Text style={styles.legendText}>Sales (Gross Billings)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: COLORS.green }]} />
            <Text style={styles.legendText}>Cash Collected</Text>
          </View>
        </View>
      </View>

      {/* Collection Overview Donut Chart */}
      <View style={styles.donutCard}>
        <View style={styles.chartHeader}>
          <TrendingUp size={18} color={COLORS.coral} style={styles.chartHeaderIcon} />
          <Text style={styles.chartTitle}>Collection Overview</Text>
        </View>
        <View style={styles.donutContainer}>
          <View style={styles.donutChartWrapper}>
            <Svg width={donutSize} height={donutSize}>
              {/* Background circle */}
              <Circle
                cx={donutSize / 2}
                cy={donutSize / 2}
                r={donutRadius}
                stroke="rgba(198, 69, 69, 0.2)"
                strokeWidth={donutStroke}
                fill="none"
              />
              {/* Collected arc */}
              <Circle
                cx={donutSize / 2}
                cy={donutSize / 2}
                r={donutRadius}
                stroke={COLORS.green}
                strokeWidth={donutStroke}
                fill="none"
                strokeDasharray={`${collectedDash} ${outstandingDash}`}
                strokeDashoffset={donutCircumference * 0.25}
                strokeLinecap="round"
              />
            </Svg>
            <View style={styles.donutCenter}>
              <Text style={styles.donutCenterPercent}>{metrics.collectionRate}%</Text>
              <Text style={styles.donutCenterLabel}>collected</Text>
            </View>
          </View>
          <View style={styles.donutLegend}>
            <View style={styles.donutLegendItem}>
              <View style={[styles.legendColor, { backgroundColor: COLORS.green }]} />
              <View>
                <Text style={styles.donutLegendLabel}>Cash Collected</Text>
                <Text style={styles.donutLegendValue}>₹{metrics.cashCollected.toLocaleString('en-IN')}</Text>
              </View>
            </View>
            <View style={[styles.donutLegendItem, { marginTop: 12 }]}>
              <View style={[styles.legendColor, { backgroundColor: COLORS.red }]} />
              <View>
                <Text style={styles.donutLegendLabel}>Outstanding Dues</Text>
                <Text style={[styles.donutLegendValue, { color: COLORS.red }]}>₹{metrics.totalPending.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Top Outstanding Accounts */}
      {topDefaulters.length > 0 && (
        <View style={styles.defaultersCard}>
          <View style={styles.chartHeader}>
            <TrendingUp size={18} color={COLORS.red} style={styles.chartHeaderIcon} />
            <Text style={styles.chartTitle}>Top Outstanding Accounts</Text>
          </View>
          {topDefaulters.map((c, i) => {
            const barPercent = topDefaulters[0].pendingAmount > 0 
              ? (c.pendingAmount / topDefaulters[0].pendingAmount) * 100 
              : 0;
            return (
              <AnimatedItem key={i} index={i} delay={30}>
                <View style={styles.defaulterRow}>
                  <View style={styles.defaulterInfo}>
                    <Text style={styles.defaulterRank}>#{i + 1}</Text>
                    <View>
                      <Text style={styles.defaulterName}>{c.name}</Text>
                      <Text style={styles.defaulterKg}>{c.totalGheeKg} kg supplied</Text>
                    </View>
                  </View>
                  <View style={styles.defaulterBarContainer}>
                    <View style={[styles.defaulterBar, { width: `${Math.max(barPercent, 8)}%` }]} />
                  </View>
                  <Text style={styles.defaulterAmount}>₹{c.pendingAmount.toLocaleString('en-IN')}</Text>
                </View>
              </AnimatedItem>
            );
          })}
        </View>
      )}

      {/* 30-Day Activity Pulse */}
      <View style={styles.sparklineCard}>
        <View style={styles.chartHeader}>
          <TrendingUp size={18} color={COLORS.coral} style={styles.chartHeaderIcon} />
          <Text style={styles.chartTitle}>30-Day Activity Pulse</Text>
        </View>
        <View style={styles.sparklineWrapper}>
          <Svg width={300} height={60}>
            <Polyline
              points={sparklineData.map((val, i) => {
                const x = (i / 29) * 290 + 5;
                const maxSpark = Math.max(...sparklineData, 1);
                const y = 55 - (val / maxSpark) * 45;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke={COLORS.coral}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </Svg>
          <View style={styles.sparklineLabels}>
            <Text style={styles.sparklineLabelText}>30d ago</Text>
            <Text style={styles.sparklineLabelText}>Today</Text>
          </View>
        </View>
      </View>

      <InventorySection
        inventory={inventory}
        onAddStock={onAddStock}
        triggerNotification={triggerNotification}
      />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 40,
  },
  chartCard: {
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartHeaderIcon: {
    marginRight: 6,
  },
  chartTitle: {
    fontFamily: FONTS.serif,
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  statsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsIcon: {
    marginRight: 8,
  },
  statsTitle: {
    fontFamily: FONTS.serif,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  statsExpandContent: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 14,
  },
  statsMonthHeader: {
    fontFamily: FONTS.serif,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsItem: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  statsItemLabel: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.textLightMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statsItemValue: {
    fontFamily: FONTS.serif,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diffBadge: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    fontWeight: 'bold',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginRight: 4,
  },
  diffBadgeUp: {
    backgroundColor: 'rgba(93, 184, 114, 0.15)',
    color: COLORS.green,
  },
  diffBadgeDown: {
    backgroundColor: 'rgba(198, 69, 69, 0.15)',
    color: COLORS.red,
  },
  diffText: {
    fontFamily: FONTS.sans,
    fontSize: 8,
    color: COLORS.textLightMuted,
  },
  diffTextSingle: {
    fontFamily: FONTS.sans,
    fontSize: 8.5,
    color: COLORS.textLightMuted,
    marginTop: 2,
  },
  donutCard: {
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  donutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  donutChartWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterPercent: {
    fontFamily: FONTS.serif,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  donutCenterLabel: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    color: COLORS.textLightMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  donutLegend: {
    marginLeft: 24,
  },
  donutLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  donutLegendLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  donutLegendValue: {
    fontFamily: FONTS.serif,
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.green,
    marginTop: 2,
  },
  defaultersCard: {
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  defaulterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230, 223, 216, 0.4)',
  },
  defaulterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  defaulterRank: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textLightMuted,
    width: 22,
  },
  defaulterName: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  defaulterKg: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    color: COLORS.textLightMuted,
    marginTop: 1,
  },
  defaulterBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(198, 69, 69, 0.1)',
    borderRadius: 3,
    marginHorizontal: 8,
  },
  defaulterBar: {
    height: 6,
    backgroundColor: COLORS.red,
    borderRadius: 3,
  },
  defaulterAmount: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.red,
    width: 70,
    textAlign: 'right',
  },
  sparklineCard: {
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sparklineWrapper: {
    alignItems: 'center',
    marginTop: 8,
  },
  sparklineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 300,
    marginTop: 4,
  },
  sparklineLabelText: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    color: COLORS.textLightMuted,
  },
});
