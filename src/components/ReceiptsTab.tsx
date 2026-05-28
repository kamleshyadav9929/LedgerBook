import React, { useState, useMemo, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { Search, X, FileText, ChevronDown, ChevronRight, Share2, TrendingUp, Check, Copy, Calendar, ChevronLeft } from 'lucide-react-native';
import { COLORS, FONTS } from '../theme';
import { Transaction, Customer } from '../types';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { AnimatedItem } from './AnimatedList';

interface ReceiptsTabProps {
  transactions: Transaction[];
  customers: Customer[];
  onSelectTransaction: (id: string) => void;
  triggerNotification: (msg: string, type?: 'success' | 'error') => void;
}

const localizations = {
  en: {
    statementTitle: 'Account Statement',
    statementSubtitle: 'Premium Butter Dispatches Statement',
    period: 'Period',
    generated: 'Generated',
    statementFor: 'Statement For:',
    phone: 'Phone',
    notes: 'Notes',
    accountStatus: 'Account Status',
    totalOutstanding: 'Total Outstanding Dues',
    gheeSupplied: 'Ghee Supplied',
    grossBillings: 'Gross Billings',
    cashCollected: 'Cash Collected',
    balanceShift: 'Balance Shift',
    timelineRecords: 'Timeline Records',
    dateCol: 'Date',
    typeCol: 'Type',
    descCol: 'Description',
    memoCol: 'Memo',
    billedCol: 'Billed',
    paidCol: 'Paid',
    dueTag: '(due)',
    lessTag: '(less)',
    dispatch: 'Dispatch',
    payment: 'Payment',
    timelineGheeDesc: (qty: number, rate: number) => `Vedic Cow Ghee (${qty} kg @ ₹${rate}/kg)`,
    timelinePaymentDesc: 'Dues Payment Cleared',
    noTimelineRecords: 'No ledger records found for this period.',
    footerText: 'Generated automatically by GheeLedger. Thank you for your continued business!',
    duesAdded: 'Dues Added',
    duesReduced: 'Dues Reduced',
    instantCashPaid: (paid: number, dues: number) => `Instant Cash Paid: ₹${paid} (Dues: ₹${dues})`,
    noMemo: 'No memo notes',
    timelineHeader: 'Timeline Statement'
  },
  hi: {
    statementTitle: 'खाता विवरण',
    statementSubtitle: 'प्रीमियम मक्खन/घी वितरण विवरण',
    period: 'अवधि',
    generated: 'तैयार किया गया',
    statementFor: 'खाता विवरण हेतु:',
    phone: 'फोन',
    notes: 'विवरण',
    accountStatus: 'खाता स्थिति',
    totalOutstanding: 'कुल बकाया राशि',
    gheeSupplied: 'घी की आपूर्ति',
    grossBillings: 'कुल बिलिंग',
    cashCollected: 'प्राप्त नकद',
    balanceShift: 'बैलेंस शिफ्ट',
    timelineRecords: 'समय-सीमा रिकॉर्ड (टाईमलाईन)',
    dateCol: 'दिनांक',
    typeCol: 'प्रकार',
    descCol: 'विवरण',
    memoCol: 'मेमो/नोट',
    billedCol: 'बिल राशि',
    paidCol: 'भुगतान',
    dueTag: '(बकाया)',
    lessTag: '(कम)',
    dispatch: 'वितरण',
    payment: 'भुगतान',
    timelineGheeDesc: (qty: number, rate: number) => `वैदिक गाय का घी (${qty} किलो @ ₹${rate}/किलो)`,
    timelinePaymentDesc: 'बकाया राशि का भुगतान',
    noTimelineRecords: 'इस अवधि के लिए कोई खाता रिकॉर्ड नहीं मिला।',
    footerText: 'घीलेजर द्वारा स्वचालित रूप से तैयार किया गया। व्यापार के लिए धन्यवाद!',
    duesAdded: 'बकाया जुड़ा',
    duesReduced: 'बकाया घटा',
    instantCashPaid: (paid: number, dues: number) => `तुरंत नकद भुगतान: ₹${paid} (बकाया: ₹${dues})`,
    noMemo: 'कोई मेमो नोट नहीं',
    timelineHeader: 'समय-सीमा रसीद विवरण'
  }
};

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ReceiptsTab({
  transactions,
  customers,
  onSelectTransaction,
  triggerNotification,
}: ReceiptsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showReceiptCenter, setShowReceiptCenter] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi'>('en');

  // Receipt Center states
  const [summaryCustomerId, setSummaryCustomerId] = useState('');
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showPickerScrollIndicator, setShowPickerScrollIndicator] = useState(true);
  const searchInputRef = useRef<TextInput>(null);

  const [datePreset, setDatePreset] = useState<'this_month' | 'last_month' | 'last_30_days' | 'all' | 'custom'>('this_month');
  
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, [transactions]);

  const monthStartStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }, [transactions]);

  const [startDateInput, setStartDateInput] = useState(monthStartStr);
  const [endDateInput, setEndDateInput] = useState(todayStr);

  // Date picker states
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [activeDatePickerField, setActiveDatePickerField] = useState<'start' | 'end' | null>(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());

  // Parse date from active input or fallback to today
  const parsedDate = useMemo(() => {
    const targetValue = activeDatePickerField === 'start' ? startDateInput : endDateInput;
    if (!targetValue) return new Date();
    const parts = targetValue.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d;
      }
    }
    const d = new Date(targetValue);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [activeDatePickerField, startDateInput, endDateInput]);

  // Compute days grid for currently viewed month and year
  const calendarMonthDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 = Sun, 1 = Mon ...
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days: (number | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(d);
    }
    return days;
  }, [currentCalendarDate]);

  const prevMonth = () => {
    setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const selectDay = (day: number) => {
    const selected = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), day);
    const yyyy = selected.getFullYear();
    const mm = String(selected.getMonth() + 1).padStart(2, '0');
    const dd = String(selected.getDate()).padStart(2, '0');
    const formatted = `${yyyy}-${mm}-${dd}`;
    
    if (activeDatePickerField === 'start') {
      setStartDateInput(formatted);
    } else if (activeDatePickerField === 'end') {
      setEndDateInput(formatted);
    }
    setIsDatePickerOpen(false);
    setActiveDatePickerField(null);
  };

  const selectToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formatted = `${yyyy}-${mm}-${dd}`;
    
    if (activeDatePickerField === 'start') {
      setStartDateInput(formatted);
    } else if (activeDatePickerField === 'end') {
      setEndDateInput(formatted);
    }
    setCurrentCalendarDate(today);
    setIsDatePickerOpen(false);
    setActiveDatePickerField(null);
  };

  const [isStatementGenerated, setIsStatementGenerated] = useState(false);

  const dict = localizations[selectedLanguage];

  // Selected customer details
  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === summaryCustomerId) || null;
  }, [customers, summaryCustomerId]);

  // Client search within dropdown list
  const filteredCustomersForPicker = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) || 
      c.phone.includes(customerSearchQuery)
    );
  }, [customers, customerSearchQuery]);

  // 1. General list filtration (for bottom scroll view)
  const filteredGeneralTxs = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter(tx => 
        tx.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.date.includes(searchQuery) ||
        (tx.notes || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [transactions, searchQuery]);

  // 2. Receipt Center: Filter transactions for summary calculation
  const filteredTxsForSummary = useMemo(() => {
    let result = transactions;
    if (summaryCustomerId) {
      result = result.filter(tx => tx.customerId === summaryCustomerId);
    }

    const now = new Date();
    let startDateStr = '';
    let endDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (datePreset === 'this_month') {
      startDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    } else if (datePreset === 'last_month') {
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      startDateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-01`;
      
      const lastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
      endDateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    } else if (datePreset === 'last_30_days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startDateStr = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(thirtyDaysAgo.getDate()).padStart(2, '0')}`;
    } else if (datePreset === 'custom') {
      startDateStr = startDateInput;
      endDateStr = endDateInput;
    } else if (datePreset === 'all') {
      return [...result].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    return [...result]
      .filter(tx => {
        if (!tx.date) return false;
        const d = tx.date.substring(0, 10);
        const startMatch = startDateStr ? d >= startDateStr : true;
        const endMatch = endDateStr ? d <= endDateStr : true;
        return startMatch && endMatch;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions, summaryCustomerId, datePreset, startDateInput, endDateInput]);

  // Aggregate metrics
  const summaryMetrics = useMemo(() => {
    let volumeKg = 0;
    let billings = 0;
    let collected = 0;

    filteredTxsForSummary.forEach(tx => {
      if (tx.type === 'sale') {
        volumeKg += tx.quantityKg;
        billings += tx.totalAmount;
        collected += tx.amountPaid;
      } else if (tx.type === 'payment') {
        collected += tx.amountPaid;
      }
    });

    const duesChange = billings - collected;

    return {
      volumeKg,
      billings,
      collected,
      duesChange
    };
  }, [filteredTxsForSummary]);

  // Statement Period label
  const statementPeriodLabel = useMemo(() => {
    if (datePreset === 'this_month') return 'This Month';
    if (datePreset === 'last_month') return 'Last Month';
    if (datePreset === 'last_30_days') return 'Last 30 Days';
    if (datePreset === 'all') return 'All Time';
    return `${startDateInput} to ${endDateInput}`;
  }, [datePreset, startDateInput, endDateInput]);

  // Handle Share/Copy statement text
  const handleCopyStatement = () => {
    if (!selectedCustomer) return;

    let statementTimeline = '';
    filteredTxsForSummary.forEach((tx) => {
      if (tx.type === 'sale') {
        statementTimeline += `- ${tx.date}: ${dict.dispatch} ${tx.quantityKg} kg Ghee @ ₹${tx.ratePerKg}/kg (Total: ₹${tx.totalAmount}, Recd: ₹${tx.amountPaid})\n`;
      } else {
        statementTimeline += `- ${tx.date}: ${dict.payment} Recd ₹${tx.amountPaid}\n`;
      }
    });

    const duesTagText = summaryMetrics.duesChange >= 0 ? dict.duesAdded : dict.duesReduced;

    const shareText = `*${dict.statementTitle} (${selectedCustomer.name})*
Period: ${statementPeriodLabel}
-------------------------------------
${dict.gheeSupplied}: ${summaryMetrics.volumeKg} kg
${dict.grossBillings}: ₹${summaryMetrics.billings.toLocaleString('en-IN')}
${dict.cashCollected}: ₹${summaryMetrics.collected.toLocaleString('en-IN')}
${dict.balanceShift}: ₹${summaryMetrics.duesChange.toLocaleString('en-IN')} (${duesTagText})

*${dict.timelineRecords}:*
${statementTimeline || dict.noTimelineRecords}
-------------------------------------
${dict.footerText}`;

    Clipboard.setStringAsync(shareText);
    triggerNotification('Statement copied to clipboard!');
  };

  const handleExportPDF = async () => {
    if (!selectedCustomer) return;
    // Bug #13: Guard against empty transaction list
    if (filteredTxsForSummary.length === 0) {
      triggerNotification('No transactions in selected period to export.', 'error');
      return;
    }
    try {
      let timelineHtml = '';
      filteredTxsForSummary.forEach((tx) => {
        const isSale = tx.type === 'sale';
        timelineHtml += `
          <tr class="tx-row">
            <td>${tx.date}</td>
            <td>
              <span class="badge ${isSale ? 'badge-dispatch' : 'badge-payment'}">
                ${isSale ? dict.dispatch : dict.payment}
              </span>
            </td>
            <td>${isSale ? dict.timelineGheeDesc(tx.quantityKg, tx.ratePerKg) : dict.timelinePaymentDesc}</td>
            <td>${tx.notes ? tx.notes : '-'}</td>
            <td class="amount">${isSale ? `₹${tx.totalAmount}` : '-'}</td>
            <td class="amount text-green">${!isSale ? `₹${tx.amountPaid}` : (tx.amountPaid > 0 ? `₹${tx.amountPaid}` : '-')}</td>
          </tr>
        `;
      });

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${dict.statementTitle} - ${selectedCustomer.name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #faf9f5;
      color: #141413;
      padding: 30px;
      margin: 0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #efe9de;
      padding: 40px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.02);
      border-radius: 8px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #efe9de;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .business-title {
      font-family: Georgia, serif;
      font-size: 28px;
      font-weight: bold;
      color: #141413;
      margin: 0 0 5px 0;
    }
    .business-sub {
      font-size: 11px;
      font-weight: bold;
      color: #8e8b82;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0;
    }
    .statement-title {
      font-family: Georgia, serif;
      font-size: 22px;
      color: #cc785c;
      margin: 0;
      text-align: right;
    }
    .statement-meta {
      font-size: 12px;
      color: #6c6a64;
      text-align: right;
      margin-top: 5px;
    }
    .details-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      font-size: 13px;
    }
    .client-details h3 {
      font-size: 11px;
      color: #8e8b82;
      text-transform: uppercase;
      margin: 0 0 8px 0;
      letter-spacing: 0.5px;
    }
    .client-name {
      font-size: 18px;
      font-weight: bold;
      margin: 0 0 5px 0;
    }
    .client-info {
      color: #6c6a64;
      margin: 2px 0;
    }
    .metrics-summary {
      display: flex;
      justify-content: space-between;
      background-color: #faf9f5;
      border: 1px solid #efe9de;
      border-radius: 6px;
      padding: 15px 20px;
      margin-bottom: 35px;
    }
    .metric-card {
      text-align: center;
      flex: 1;
    }
    .metric-card:not(:last-child) {
      border-right: 1px dashed #efe9de;
    }
    .metric-label {
      font-size: 10px;
      font-weight: bold;
      color: #8e8b82;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .metric-value {
      font-size: 18px;
      font-weight: bold;
      color: #141413;
    }
    .text-green {
      color: #5db872;
    }
    .text-red {
      color: #c64545;
    }
    .table-title {
      font-family: Georgia, serif;
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 30px;
    }
    th {
      background-color: #faf9f5;
      border-bottom: 2px solid #efe9de;
      color: #8e8b82;
      font-weight: bold;
      text-align: left;
      padding: 10px 12px;
      text-transform: uppercase;
      font-size: 10px;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #efe9de;
    }
    .tx-row:hover {
      background-color: #fdfdfb;
    }
    .amount {
      font-weight: bold;
    }
    .badge {
      display: inline-block;
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .badge-dispatch {
      background-color: rgba(204, 120, 92, 0.1);
      color: #cc785c;
    }
    .badge-payment {
      background-color: rgba(93, 184, 114, 0.1);
      color: #5db872;
    }
    .footer {
      border-top: 1px dashed #efe9de;
      padding-top: 20px;
      text-align: center;
      font-size: 11px;
      color: #8e8b82;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1 class="business-title">GheeLedger</h1>
        <p class="business-sub">${dict.statementSubtitle}</p>
      </div>
      <div>
        <h2 class="statement-title">${dict.statementTitle}</h2>
        <div class="statement-meta">
          ${dict.period}: ${statementPeriodLabel}<br/>
          ${dict.generated}: ${new Date().toLocaleDateString('en-IN')}
        </div>
      </div>
    </div>

    <div class="details-row">
      <div class="client-details">
        <h3>${dict.statementFor}</h3>
        <div class="client-name">${selectedCustomer.name}</div>
        <div class="client-info">${dict.phone}: ${selectedCustomer.phone}</div>
        <div class="client-info">${dict.notes}: ${selectedCustomer.notes || 'N/A'}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 11px; color: #8e8b82; text-transform: uppercase; margin-bottom: 8px;">${dict.accountStatus}</div>
        <div style="font-size: 20px; font-weight: bold; color: ${selectedCustomer.pendingAmount > 0 ? '#c64545' : '#5db872'}">
          ₹${selectedCustomer.pendingAmount}
        </div>
        <div style="font-size: 11px; color: #8e8b82;">${dict.totalOutstanding}</div>
      </div>
    </div>

    <div class="metrics-summary">
      <div class="metric-card">
        <div class="metric-label">${dict.gheeSupplied}</div>
        <div class="metric-value">${summaryMetrics.volumeKg} kg</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">${dict.grossBillings}</div>
        <div class="metric-value">₹${summaryMetrics.billings.toLocaleString('en-IN')}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">${dict.cashCollected}</div>
        <div class="metric-value text-green">₹${summaryMetrics.collected.toLocaleString('en-IN')}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">${dict.balanceShift}</div>
        <div class="metric-value ${summaryMetrics.duesChange >= 0 ? 'text-red' : 'text-green'}">
          ₹${Math.abs(summaryMetrics.duesChange).toLocaleString('en-IN')}${summaryMetrics.duesChange >= 0 ? ` ${dict.dueTag}` : ` ${dict.lessTag}`}
        </div>
      </div>
    </div>

    <div class="table-title">${dict.timelineHeader}</div>
    <table>
      <thead>
        <tr>
          <th style="width: 15%;">${dict.dateCol}</th>
          <th style="width: 15%;">${dict.typeCol}</th>
          <th style="width: 35%;">${dict.descCol}</th>
          <th style="width: 15%;">${dict.memoCol}</th>
          <th style="width: 10%; text-align: right;">${dict.billedCol}</th>
          <th style="width: 10%; text-align: right;">${dict.paidCol}</th>
        </tr>
      </thead>
      <tbody>
        ${timelineHtml || `<tr><td colspan="6" style="text-align: center; color: #8e8b82; font-style: italic;">${dict.noTimelineRecords}</td></tr>`}
      </tbody>
    </table>

    <div class="footer">
      ${dict.footerText}
    </div>
  </div>
</body>
</html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Statement_${selectedCustomer.name}.pdf`,
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      triggerNotification('Could not export PDF statement.', 'error');
    }
  };

  const handleExportCSV = async () => {
    if (!selectedCustomer) return;
    // Bug #13: Guard against empty transaction list
    if (filteredTxsForSummary.length === 0) {
      triggerNotification('No transactions in selected period to export.', 'error');
      return;
    }
    try {
      let csvContent = `GheeLedger Account Statement\n`;
      csvContent += `Customer,${selectedCustomer.name}\n`;
      csvContent += `Phone,${selectedCustomer.phone}\n`;
      csvContent += `Period,${statementPeriodLabel}\n`;
      csvContent += `Generated,${new Date().toLocaleDateString('en-IN')}\n\n`;

      csvContent += `Summary Metrics\n`;
      csvContent += `Ghee Supplied (kg),Gross Billings (INR),Cash Collected (INR),Balance Shift (INR)\n`;
      csvContent += `"${summaryMetrics.volumeKg}","${summaryMetrics.billings}","${summaryMetrics.collected}","${summaryMetrics.duesChange}"\n\n`;

      csvContent += `Timeline Records\n`;
      csvContent += `Date,Type,Description,Memo,Billed Amount,Paid Amount\n`;

      filteredTxsForSummary.forEach((tx) => {
        const isSale = tx.type === 'sale';
        const typeStr = isSale ? 'Dispatch' : 'Payment';
        const descStr = isSale ? `Vedic Cow Ghee (${tx.quantityKg} kg @ Rate ₹${tx.ratePerKg})` : 'Dues Payment Cleared';
        const notesStr = tx.notes ? tx.notes.replace(/"/g, '""') : '';
        const billedAmt = isSale ? tx.totalAmount : '';
        const paidAmt = tx.amountPaid;

        csvContent += `"${tx.date}","${typeStr}","${descStr}","${notesStr}","${billedAmt}","${paidAmt}"\n`;
      });

      const fileName = `statement_${selectedCustomer.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: `Export ${fileName}`,
        UTI: 'public.comma-separated-values-text',
      });
    } catch (error) {
      triggerNotification('Could not export CSV statement.', 'error');
    }
  };

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
        scrollEnabled={!isCustomerPickerOpen}
      >
      
      {/* 1. ROW WITH SEARCH BAR AND TOGGLE ICON */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Search size={16} color={COLORS.textLightMuted} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (isStatementGenerated) setIsStatementGenerated(false);
            }}
            placeholder="Search receipts..."
            placeholderTextColor={COLORS.textLightMuted}
            style={styles.searchInput}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearIcon}>
              <X size={16} color={COLORS.textLightMuted} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          onPress={() => setShowReceiptCenter(prev => !prev)}
          style={[styles.receiptCenterToggleButton, showReceiptCenter && styles.receiptCenterToggleButtonActive]}
          activeOpacity={0.8}
        >
          <FileText size={20} color={showReceiptCenter ? COLORS.white : COLORS.coral} />
        </TouchableOpacity>
      </View>

      {/* 2. RECEIPT CENTER PANEL (Collapsible) */}
      {showReceiptCenter && (
        <View style={styles.receiptCenterCard}>
          <View style={styles.form}>
            
            {/* NEW: Language Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Statement Language</Text>
              <View style={styles.presetsRow}>
                {[
                  { key: 'en', label: 'English' },
                  { key: 'hi', label: 'Hindi (हिंदी)' }
                ].map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setSelectedLanguage(opt.key as any)}
                    style={[
                      styles.presetPill,
                      selectedLanguage === opt.key && styles.presetPillActive
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.presetPillText,
                      selectedLanguage === opt.key && styles.presetPillTextActive
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Customer Selection dropdown trigger with custom modal picker */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Select Client Portfolio *</Text>
              <View>
                <TouchableOpacity
                  onPress={() => setIsCustomerPickerOpen(true)}
                  style={styles.pickerTrigger}
                  activeOpacity={0.8}
                >
                  <Text style={styles.pickerTriggerText}>
                    {selectedCustomer 
                      ? `${selectedCustomer.name} (UPI Dues: ₹${selectedCustomer.pendingAmount})`
                      : '-- Choose registered customer --'
                    }
                  </Text>
                  <ChevronDown size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Date preset segment */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Statement Period preset</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsRow}>
                {[
                  { key: 'this_month', label: 'This Month' },
                  { key: 'last_month', label: 'Last Month' },
                  { key: 'last_30_days', label: '30 Days' },
                  { key: 'all', label: 'All Time' },
                  { key: 'custom', label: 'Custom Range' },
                ].map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setDatePreset(opt.key as any)}
                    style={[
                      styles.presetPill,
                      datePreset === opt.key && styles.presetPillActive
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.presetPillText,
                      datePreset === opt.key && styles.presetPillTextActive
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Custom start/end dates inputs */}
            {datePreset === 'custom' && (
              <View style={styles.dateInputsRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.smallLabel}>Start Date</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setActiveDatePickerField('start');
                      const parts = startDateInput.split('-');
                      if (parts.length === 3) {
                        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                        if (!isNaN(d.getTime())) setCurrentCalendarDate(d);
                      }
                      setIsDatePickerOpen(true);
                    }}
                    style={styles.datePickerTrigger}
                    activeOpacity={0.7}
                  >
                    <Calendar size={14} color={COLORS.coral} style={{ marginRight: 6 }} />
                    <Text style={styles.datePickerTriggerText}>{startDateInput}</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.smallLabel}>End Date</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setActiveDatePickerField('end');
                      const parts = endDateInput.split('-');
                      if (parts.length === 3) {
                        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                        if (!isNaN(d.getTime())) setCurrentCalendarDate(d);
                      }
                      setIsDatePickerOpen(true);
                    }}
                    style={styles.datePickerTrigger}
                    activeOpacity={0.7}
                  >
                    <Calendar size={14} color={COLORS.coral} style={{ marginRight: 6 }} />
                    <Text style={styles.datePickerTriggerText}>{endDateInput}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={() => {
                if (!summaryCustomerId) {
                  triggerNotification('Please select a customer first.', 'error');
                  return;
                }
                setIsStatementGenerated(true);
              }}
              style={styles.generateButton}
              activeOpacity={0.8}
            >
              <Text style={styles.generateButtonText}>Generate Summary Statement</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 3. GENERATED STATEMENT SUMMARY SECTION */}
      {isStatementGenerated && selectedCustomer && (
        <View style={styles.summarySection}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryTitle}>{selectedCustomer.name}</Text>
              <Text style={styles.summaryPeriod}>Period: {statementPeriodLabel}</Text>
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.statementActionRow}>
            <TouchableOpacity
              onPress={handleCopyStatement}
              style={styles.actionBtn}
              activeOpacity={0.7}
            >
              <Copy size={13} color={COLORS.white} style={{ marginRight: 4 }} />
              <Text style={styles.actionBtnText}>Copy Text</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleExportPDF}
              style={[styles.actionBtn, { backgroundColor: COLORS.coral }]}
              activeOpacity={0.7}
            >
              <FileText size={13} color={COLORS.white} style={{ marginRight: 4 }} />
              <Text style={styles.actionBtnText}>Export PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleExportCSV}
              style={[styles.actionBtn, { backgroundColor: COLORS.green }]}
              activeOpacity={0.7}
            >
              <TrendingUp size={13} color={COLORS.white} style={{ marginRight: 4 }} />
              <Text style={styles.actionBtnText}>Export CSV</Text>
            </TouchableOpacity>
          </View>

          {/* Metrics dashboard */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>{dict.gheeSupplied}</Text>
              <Text style={styles.metricValue}>{summaryMetrics.volumeKg} kg</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>{dict.grossBillings}</Text>
              <Text style={styles.metricValue}>₹{summaryMetrics.billings.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>{dict.cashCollected}</Text>
              <Text style={[styles.metricValue, { color: COLORS.green }]}>
                ₹{summaryMetrics.collected.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>{dict.balanceShift}</Text>
              <Text style={[
                styles.metricValue, 
                summaryMetrics.duesChange >= 0 ? { color: COLORS.red } : { color: COLORS.green }
              ]}>
                ₹{Math.abs(summaryMetrics.duesChange).toLocaleString('en-IN')}
                <Text style={{ fontSize: 9, fontWeight: 'normal' }}>
                  {summaryMetrics.duesChange >= 0 ? ` ${dict.dueTag}` : ` ${dict.lessTag}`}
                </Text>
              </Text>
            </View>
          </View>

          {/* Timeline listing statement records */}
          <Text style={styles.timelineHeader}>{dict.timelineHeader}</Text>
          <View style={styles.timelineBox}>
            {filteredTxsForSummary.length === 0 ? (
              <Text style={styles.emptyTimelineText}>{dict.noTimelineRecords}</Text>
            ) : (
              filteredTxsForSummary.map((tx, idx) => {
                const isSale = tx.type === 'sale';
                return (
                  <AnimatedItem key={tx.id} index={idx}>
                    <View style={styles.timelineItem}>
                      {/* Line & Bullet Column */}
                      <View style={styles.bulletCol}>
                        <View style={[
                          styles.bulletDot, 
                          isSale ? { backgroundColor: COLORS.coral } : { backgroundColor: COLORS.green }
                        ]} />
                        {idx < filteredTxsForSummary.length - 1 && <View style={styles.bulletLine} />}
                      </View>

                      {/* Content Column */}
                      <TouchableOpacity
                        onPress={() => onSelectTransaction(tx.id)}
                        style={styles.timelineCard}
                        activeOpacity={0.7}
                      >
                        <View style={styles.timelineCardHeader}>
                          <Text style={styles.timelineDate}>{tx.date}</Text>
                          <Text style={[
                            styles.timelineTypeBadge,
                            isSale ? styles.badgeDispatch : styles.badgePayment
                          ]}>
                            {isSale ? dict.dispatch : dict.payment}
                          </Text>
                        </View>
                        
                        <Text style={styles.timelineText}>
                          {isSale 
                            ? `${tx.quantityKg} kg Ghee Supplied @ ₹${tx.ratePerKg}/kg`
                            : dict.timelinePaymentDesc
                          }
                        </Text>

                        <View style={styles.timelineFooter}>
                          <Text style={styles.timelineNotes}>
                            {tx.notes ? `Memo: ${tx.notes}` : dict.noMemo}
                          </Text>
                          <Text style={styles.timelineAmount}>
                            ₹{isSale ? tx.totalAmount : tx.amountPaid}
                          </Text>
                        </View>

                        {isSale && tx.amountPaid > 0 && (
                          <View style={styles.timelineSubRow}>
                            <Check size={11} color={COLORS.green} style={{ marginRight: 3 }} />
                            <Text style={styles.timelineSubText}>
                              {dict.instantCashPaid(tx.amountPaid, tx.totalAmount - tx.amountPaid)}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  </AnimatedItem>
                );
              })
            )}
          </View>
        </View>
      )}

      {/* 4. GENERAL PRINTABLE LIST */}
      {!isStatementGenerated && (
        <View style={styles.generalListSection}>
          {filteredGeneralTxs.length === 0 ? (
            <Text style={styles.vEmptyText}>No matching transaction receipts found.</Text>
          ) : (
            filteredGeneralTxs.map((item, index) => (
              <AnimatedItem key={item.id} index={index}>
                <TouchableOpacity
                  onPress={() => onSelectTransaction(item.id)}
                  style={styles.voucherListItem}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text style={styles.vName}>{item.customerName}</Text>
                    <Text style={[styles.vDate, { color: item.type === 'sale' ? COLORS.textMuted : COLORS.green }]}>
                      {item.date} • {item.type === 'sale' ? 'Dispatch' : 'Payment'}
                    </Text>
                  </View>
                  <View style={styles.vRight}>
                    <Text style={[styles.vAmt, { color: item.type === 'sale' ? COLORS.textDark : COLORS.green }]}>
                      ₹{item.type === 'sale' ? item.totalAmount : item.amountPaid}
                    </Text>
                    <View style={styles.actionLink}>
                      <Text style={styles.vAction}>Receipt</Text>
                      <ChevronRight size={12} color={COLORS.coral} />
                    </View>
                  </View>
                </TouchableOpacity>
              </AnimatedItem>
            ))
          )}
        </View>
      )}

      {/* Custom Customer Picker Modal */}
      <Modal
        visible={isCustomerPickerOpen}
        transparent={true}
        animationType="fade"
        onShow={() => {
          setTimeout(() => {
            searchInputRef.current?.focus();
          }, 100);
        }}
        onRequestClose={() => {
          setIsCustomerPickerOpen(false);
          setCustomerSearchQuery('');
        }}
      >
        <TouchableOpacity
          style={styles.calendarOverlay}
          activeOpacity={1}
          onPress={() => {
            setIsCustomerPickerOpen(false);
            setCustomerSearchQuery('');
          }}
        >
          <TouchableOpacity
            style={styles.pickerModalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Customer</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsCustomerPickerOpen(false);
                  setCustomerSearchQuery('');
                }}
                style={styles.pickerModalCloseBtn}
              >
                <X size={18} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.pickerSearchContainer}>
              <Search size={14} color={COLORS.textLightMuted} style={{ marginRight: 8 }} />
              <TextInput
                ref={searchInputRef}
                value={customerSearchQuery}
                onChangeText={(text) => {
                  setCustomerSearchQuery(text);
                  setShowPickerScrollIndicator(true);
                }}
                placeholder="Search customer name..."
                placeholderTextColor={COLORS.textLightMuted}
                style={styles.pickerSearchInput}
                autoFocus={true}
              />
            </View>

            {/* Scrollable list wrapper */}
            <View style={{ maxHeight: 280, position: 'relative', paddingBottom: 14 }}>
              <ScrollView
                style={styles.pickerModalListScroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                onScroll={(event) => {
                  const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
                  const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
                  setShowPickerScrollIndicator(!isCloseToBottom);
                }}
                scrollEventThrottle={16}
              >
                {filteredCustomersForPicker.length === 0 ? (
                  <Text style={styles.pickerModalEmptyText}>No clients found.</Text>
                ) : (
                  filteredCustomersForPicker.map(c => (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => {
                        setSummaryCustomerId(c.id);
                        setIsCustomerPickerOpen(false);
                        setCustomerSearchQuery('');
                        setIsStatementGenerated(false);
                      }}
                      style={styles.pickerModalItem}
                      activeOpacity={0.7}
                    >
                      <View style={styles.pickerModalItemRow}>
                        <Text style={styles.pickerModalItemText}>{c.name}</Text>
                        <Text style={styles.pickerModalItemSubText}>
                          UPI Pending: ₹{c.pendingAmount}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>

              {/* Dynamic scroll down arrow visual cue */}
              {showPickerScrollIndicator && (
                <View style={styles.scrollIndicator}>
                  <ChevronDown size={11} color={COLORS.textLightMuted} strokeWidth={3} />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Custom Date Picker Modal */}
      <Modal
        visible={isDatePickerOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setIsDatePickerOpen(false);
          setActiveDatePickerField(null);
        }}
      >
        <TouchableOpacity
          style={styles.calendarOverlay}
          activeOpacity={1}
          onPress={() => {
            setIsDatePickerOpen(false);
            setActiveDatePickerField(null);
          }}
        >
          <TouchableOpacity
            style={styles.calendarCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header: Month and Year navigation */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                onPress={prevMonth}
                style={styles.calendarNavBtn}
                activeOpacity={0.7}
              >
                <ChevronLeft size={16} color={COLORS.textMuted} />
              </TouchableOpacity>

              <Text style={styles.calendarHeaderTitle}>
                {months[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}
              </Text>

              <TouchableOpacity
                onPress={nextMonth}
                style={styles.calendarNavBtn}
                activeOpacity={0.7}
              >
                <ChevronRight size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Weekdays Row */}
            <View style={styles.weekdaysRow}>
              {weekdays.map((day, idx) => (
                <Text key={idx} style={styles.weekdayText}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {calendarMonthDays.map((day, idx) => {
                if (day === null) {
                  return <View key={idx} style={styles.emptyDayCell} />;
                }

                const isSelected =
                  parsedDate.getDate() === day &&
                  parsedDate.getMonth() === currentCalendarDate.getMonth() &&
                  parsedDate.getFullYear() === currentCalendarDate.getFullYear();

                const today = new Date();
                const isToday =
                  today.getDate() === day &&
                  today.getMonth() === currentCalendarDate.getMonth() &&
                  today.getFullYear() === currentCalendarDate.getFullYear();

                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => selectDay(day)}
                    style={[
                      styles.dayCell,
                      isSelected && styles.selectedDayCell,
                      isToday && !isSelected && styles.todayDayCell,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.selectedDayText,
                        isToday && !isSelected && styles.todayDayText,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Footer Buttons */}
            <View style={styles.calendarFooter}>
              <TouchableOpacity
                onPress={() => {
                  setIsDatePickerOpen(false);
                  setActiveDatePickerField(null);
                }}
                style={[styles.calendarFooterBtn, { backgroundColor: COLORS.bgWarm }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.calendarFooterBtnText, { color: COLORS.textMuted }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={selectToday}
                style={[styles.calendarFooterBtn, { backgroundColor: COLORS.coral }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.calendarFooterBtnText, { color: COLORS.white }]}>
                  Today
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <View style={{ height: 60 }} />
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 233, 222, 0.5)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 44,
    marginRight: 10,
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
  receiptCenterToggleButton: {
    width: 44,
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(239, 233, 222, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptCenterToggleButtonActive: {
    backgroundColor: COLORS.coral,
    borderColor: COLORS.coral,
  },
  receiptCenterCard: {
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  form: {
    marginTop: 0,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  smallLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgSand,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 44,
  },
  pickerTriggerText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  inlineDropdown: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    maxHeight: 220,
    zIndex: 1000,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: -2000,
    bottom: -2000,
    left: -2000,
    right: -2000,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  dropdownSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgWarm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 10,
    height: 36,
  },
  dropdownSearchInput: {
    flex: 1,
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textDark,
    paddingVertical: 4,
  },
  dropdownList: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dropdownListScroll: {
    maxHeight: 180,
  },
  dropdownEmptyText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 14,
  },
  dropdownItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230, 223, 216, 0.4)',
  },
  dropdownItemText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  dropdownItemSubText: {
    fontFamily: FONTS.sans,
    fontSize: 10.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  // Custom Customer Picker Modal styles
  pickerModalCard: {
    width: '100%',
    maxWidth: 340,
    maxHeight: '85%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  pickerModalTitle: {
    fontFamily: FONTS.serif,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  pickerModalCloseBtn: {
    padding: 4,
  },
  pickerSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgWarm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  pickerSearchInput: {
    flex: 1,
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textDark,
    paddingVertical: 6,
  },
  pickerModalListScroll: {
    maxHeight: 280,
  },
  pickerModalItem: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230, 223, 216, 0.4)',
  },
  pickerModalItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerModalItemText: {
    fontFamily: FONTS.sans,
    fontSize: 13.5,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  pickerModalItemSubText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  pickerModalEmptyText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  scrollIndicator: {
    position: 'absolute',
    bottom: -2,
    left: '50%',
    transform: [{ translateX: -10 }],
    backgroundColor: COLORS.bgWarm,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  presetsRow: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  presetPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: COLORS.bgSand,
    borderWidth: 1,
    borderColor: 'rgba(230, 223, 216, 0.6)',
    marginRight: 6,
  },
  presetPillActive: {
    backgroundColor: COLORS.coral,
    borderColor: COLORS.coral,
  },
  presetPillText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  presetPillTextActive: {
    color: COLORS.white,
  },
  dateInputsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dateInput: {
    backgroundColor: COLORS.bgSand,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 40,
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.textDark,
  },
  generateButton: {
    backgroundColor: COLORS.bgDark,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    zIndex: 1,
  },
  generateButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summarySection: {
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
    marginBottom: 12,
  },
  summaryTitle: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  summaryPeriod: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  shareIconButton: {
    backgroundColor: COLORS.coral,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  shareText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricItem: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
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
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  timelineHeader: {
    fontFamily: FONTS.serif,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timelineBox: {
    paddingLeft: 4,
  },
  emptyTimelineText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textLightMuted,
    fontStyle: 'italic',
    paddingVertical: 14,
    textAlign: 'center',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  bulletCol: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 2,
    marginTop: 6,
  },
  bulletLine: {
    position: 'absolute',
    top: 14,
    bottom: -18,
    width: 1.5,
    backgroundColor: COLORS.border,
    zIndex: 1,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 10,
    marginLeft: 4,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineDate: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textLightMuted,
  },
  timelineTypeBadge: {
    fontFamily: FONTS.sans,
    fontSize: 8,
    fontWeight: 'bold',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    textTransform: 'uppercase',
  },
  badgeDispatch: {
    backgroundColor: 'rgba(204, 120, 92, 0.1)',
    color: COLORS.coral,
  },
  badgePayment: {
    backgroundColor: 'rgba(93, 184, 114, 0.1)',
    color: COLORS.green,
  },
  timelineText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textDark,
    fontWeight: '600',
    marginBottom: 4,
  },
  timelineFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  timelineNotes: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: COLORS.textLightMuted,
    fontStyle: 'italic',
  },
  timelineAmount: {
    fontFamily: FONTS.serif,
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  timelineSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(230, 223, 216, 0.4)',
    paddingTop: 6,
    marginTop: 6,
  },
  timelineSubText: {
    fontFamily: FONTS.sans,
    fontSize: 9.5,
    color: COLORS.textMuted,
  },
  generalListSection: {
    paddingBottom: 20,
  },
  vEmptyText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textLightMuted,
    fontStyle: 'italic',
    paddingVertical: 20,
    textAlign: 'center',
  },
  voucherListItem: {
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
  vName: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  vDate: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    marginTop: 2,
  },
  vRight: {
    alignItems: 'flex-end',
  },
  vAmt: {
    fontFamily: FONTS.serif,
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  vAction: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.coral,
    marginRight: 2,
  },
  statementActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgDark,
    paddingVertical: 8,
    borderRadius: 6,
    height: 36,
  },
  actionBtnText: {
    fontFamily: FONTS.sans,
    fontSize: 10.5,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  datePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSand,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 40,
  },
  datePickerTriggerText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.textDark,
  },
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: COLORS.bgSand,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarHeaderTitle: {
    fontFamily: FONTS.serif,
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  calendarNavBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: COLORS.bgWarm,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontFamily: FONTS.sans,
    fontSize: 10.5,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayCell: {
    width: '14.28%',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 1,
  },
  dayText: {
    fontFamily: FONTS.sans,
    fontSize: 12.5,
    color: COLORS.textDark,
  },
  emptyDayCell: {
    width: '14.28%',
    height: 36,
  },
  selectedDayCell: {
    backgroundColor: COLORS.coral,
    borderRadius: 18,
  },
  selectedDayText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  todayDayCell: {
    borderWidth: 1,
    borderColor: COLORS.coral,
    borderStyle: 'dashed',
    borderRadius: 18,
  },
  todayDayText: {
    color: COLORS.coral,
    fontWeight: 'bold',
  },
  calendarFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  calendarFooterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  calendarFooterBtnText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
