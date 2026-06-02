import React, { useState, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Image,
  Animated,
  Dimensions,
  Easing,
  Share,
} from 'react-native';
import {
  Keyboard,
  Mic,
  Camera,
  X,
  Edit2,
  ChevronDown,
  Check,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Package,
  Banknote,
  QrCode,
  Copy,
  Volume2,
  Share2,
  Printer,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import * as Print from 'expo-print';
import * as Clipboard from 'expo-clipboard';
import { COLORS, FONTS } from '../theme';
import { Customer, QuickTxState, ParsedPreviewState } from '../types';
import { AnimatedItem } from './AnimatedList';

const RUPEE = '\u20b9';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const METHODS: { key: 'manual' | 'voice' | 'scan'; label: string }[] = [
  { key: 'manual', label: 'Form' },
  { key: 'voice', label: 'Voice AI' },
  { key: 'scan', label: 'Scan' },
];

const labels = {
  en: {
    title: 'Ghee Dispatch Receipt',
    voucherNo: 'VOUCHER NO:',
    timestamp: 'TIMESTAMP:',
    receiver: 'RECEIVER:',
    description: 'ITEM DESCRIPTION',
    total: 'LINE TOTAL',
    ghee: 'Vedic Cow Ghee',
    subtotal: 'SUBTOTAL:',
    paid: 'AMOUNT PAID:',
    unsettled: 'UNSETTLED BALANCE:',
    totalDues: 'TOTAL CLIENT DUES:',
    cashReceived: 'CASH RECEIVED',
    remainingBalance: 'REMAINING BALANCE:',
    gratitude: 'Gratitude.',
    allSettled: 'All Dues Settled. Gratitude.',
    payDirect: 'Pay directly to UPI:',
    scanPay: (amt: number) => `Scan to Pay ₹${amt} via UPI`,
    ttsSales: (biz: string, qty: number, name: string, total: number, paid: number) => 
      `Hello! This is a dispatch receipt from ${biz}. We successfully delivered ${qty} kilograms of Vedic Ghee to ${name}. The total bill is Rupees ${total}, with Rupees ${paid} paid instantly.`,
  },
  hi: {
    title: 'घी वितरण रसीद',
    voucherNo: 'वाउचर सं.:',
    timestamp: 'दिनांक/समय:',
    receiver: 'प्राप्तकर्ता:',
    description: 'सामग्री विवरण',
    total: 'कुल योग',
    ghee: 'वैदिक गाय का घी',
    subtotal: 'कुल राशि:',
    paid: 'भुगतान राशि:',
    unsettled: 'शेष बकाया:',
    totalDues: 'कुल ग्राहक बकाया:',
    cashReceived: 'प्राप्त नकद',
    remainingBalance: 'शेष बकाया:',
    gratitude: 'सधन्यवाद।',
    allSettled: 'सभी बकाया राशि का भुगतान हुआ। सधन्यवाद।',
    payDirect: 'UPI द्वारा भुगतान करें:',
    scanPay: (amt: number) => `UPI द्वारा ₹${amt} भुगतान हेतु स्कैन करें`,
    ttsSales: (biz: string, qty: number, name: string, total: number, paid: number) => 
      `नमस्ते! यह ${biz} की तरफ से वितरण रसीद है। हमने ${name} को ${qty} किलो वैदिक घी भेजा है। कुल बिल ${total} रुपये है, जिसमें से ${paid} रुपये का भुगतान तुरंत किया गया है।`,
  },
  pa: {
    title: 'ਘਿਓ ਸਪਲਾਈ ਰਸੀਦ',
    voucherNo: 'ਵਾਊਚਰ ਨੰ.:',
    timestamp: 'ਮਿਤੀ/ਸਮਾਂ:',
    receiver: 'ਪ੍ਰਾਪਤਕਰਤਾ:',
    description: 'ਵੇਰਵਾ',
    total: 'ਕੁੱਲ ਰਕਮ',
    ghee: 'ਵੈਦਿਕ ਗਊ ਘਿਓ',
    subtotal: 'ਕੁੱਲ ਬਿੱਲ:',
    paid: 'ਭੁਗਤਾਨ ਰਾਸ਼ੀ:',
    unsettled: 'ਬਾਕੀ ਬਕਾਇਆ:',
    totalDues: 'ਕੁੱਲ ਗਾਹਕ ਬਕਾਇਆ:',
    cashReceived: 'ਪ੍ਰਾਪਤ ਨਕਦ',
    remainingBalance: 'ਬਾਕੀ ਬਕਾਇਆ ਰਕਮ:',
    gratitude: 'ਧੰਨਵਾਦ।',
    allSettled: 'ਸਾਰਾ ਬਕਾਇਆ ਭੁਗਤਾਨ ਹੋ ਗਿਆ। ਧੰਨਵਾਦ।',
    payDirect: 'UPI ਰਾਹੀਂ ਭੁਗਤਾਨ ਕਰੋ:',
    scanPay: (amt: number) => `UPI ਰਾਹੀਂ ₹${amt} ਭੁਗਤਾਨ ਕਰਨ ਲਈ ਸਕੈਨ ਕਰੋ`,
    ttsSales: (biz: string, qty: number, name: string, total: number, paid: number) => 
      `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਇਹ ${biz} ਵੱਲੋਂ ਸਪਲਾਈ ਰਸੀਦ ਹੈ। ਅਸੀਂ ਸਫਲਤਾਪੂਰਵਕ ${name} ਨੂੰ ${qty} ਕਿਲੋ ਵੈਦਿਕ ਘਿਓ ਭੇਜਿਆ ਹੈ। ਕੁੱਲ ਬਿੱਲ ${total} ਰੁਪਏ ਹੈ, ਜਿਸ ਵਿੱਚੋਂ ${paid} ਰੁਪਏ ਦਾ ਤੁਰੰਤ ਭੁਗਤਾਨ ਕੀਤਾ ਗਿਆ ਹੈ।`,
  }
};

interface QuickRecordTabProps {
  businessName: string;
  upiId: string;
  customers: Customer[];
  defaultRate: number;
  weightPresets: number[];
  ratePresets: number[];
  quickTx: QuickTxState;
  setQuickTx: React.Dispatch<React.SetStateAction<QuickTxState>>;
  recordMethod: 'manual' | 'voice' | 'scan';
  setRecordMethod: (method: 'manual' | 'voice' | 'scan') => void;
  showCustomWeight: boolean;
  setShowCustomWeight: (show: boolean) => void;
  showCustomRate: boolean;
  setShowCustomRate: (show: boolean) => void;
  showCustomAmount: boolean;
  setShowCustomAmount: (show: boolean) => void;
  speechResultText: string;
  setSpeechResultText: (text: string) => void;
  isAiProcessing: boolean;
  parsedPreviewList: ParsedPreviewState[] | null;
  setParsedPreviewList: React.Dispatch<React.SetStateAction<ParsedPreviewState[] | null>>;
  scanPreviewImage: string | null;
  isScanningImage: boolean;
  handleVoiceProcessing: (text: string) => void;
  handleOCRFileSelection: () => void;
  handleCommitParsedPreview: () => void;
  commitQuickTransaction: () => void;
  triggerNotification: (msg: string, type?: 'success' | 'error') => void;
}

export default function QuickRecordTab({
  businessName,
  upiId,
  customers,
  defaultRate,
  weightPresets,
  ratePresets,
  quickTx,
  setQuickTx,
  recordMethod,
  setRecordMethod,
  showCustomWeight,
  setShowCustomWeight,
  showCustomRate,
  setShowCustomRate,
  showCustomAmount,
  setShowCustomAmount,
  speechResultText,
  setSpeechResultText,
  isAiProcessing,
  parsedPreviewList,
  setParsedPreviewList,
  scanPreviewImage,
  isScanningImage,
  handleVoiceProcessing,
  handleOCRFileSelection,
  handleCommitParsedPreview,
  commitQuickTransaction,
  triggerNotification,
}: QuickRecordTabProps) {

  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showPickerScrollIndicator, setShowPickerScrollIndicator] = useState(true);
  const searchInputRef = useRef<TextInput>(null);

  // Touch/Scroll Stepper gestures state and handlers
  const [isDraggingStepper, setIsDraggingStepper] = useState(false);
  const dragStartWeightY = useRef<number | null>(null);
  const dragStartWeightVal = useRef<number>(0);
  const dragStartRateY = useRef<number | null>(null);
  const dragStartRateVal = useRef<number>(0);
  const dragStartAmountY = useRef<number | null>(null);
  const dragStartAmountVal = useRef<number>(0);

  // Slip Action states
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'pa'>('en');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Stop speaking on unmount
  React.useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const onTouchStartWeight = (e: any) => {
    dragStartWeightY.current = e.nativeEvent.pageY;
    dragStartWeightVal.current = quickTx.quantityKg;
    setIsDraggingStepper(true);
  };

  const onTouchMoveWeight = (e: any) => {
    if (dragStartWeightY.current === null) return;
    const currentY = e.nativeEvent.pageY;
    const diffY = dragStartWeightY.current - currentY; // Upward drag = increase

    // Adjust step scale: 12 pixels of drag = 0.5 kg
    const steps = Math.round(diffY / 12);
    if (steps !== 0) {
      const nextVal = Math.max(0, parseFloat((dragStartWeightVal.current + steps * 0.5).toFixed(2)));
      if (nextVal !== quickTx.quantityKg) {
        setQuickTx(prev => ({
          ...prev,
          quantityKg: nextVal,
          amountPaid: prev.type === 'sale' ? Math.round(nextVal * prev.ratePerKg) : prev.amountPaid,
        }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const onTouchEndWeight = () => {
    dragStartWeightY.current = null;
    setIsDraggingStepper(false);
  };

  const onTouchStartRate = (e: any) => {
    dragStartRateY.current = e.nativeEvent.pageY;
    dragStartRateVal.current = quickTx.ratePerKg;
    setIsDraggingStepper(true);
  };

  const onTouchMoveRate = (e: any) => {
    if (dragStartRateY.current === null) return;
    const currentY = e.nativeEvent.pageY;
    const diffY = dragStartRateY.current - currentY;

    // Adjust step scale: 8 pixels of drag = ₹10
    const steps = Math.round(diffY / 8);
    if (steps !== 0) {
      const nextVal = Math.max(1, dragStartRateVal.current + steps * 10);
      if (nextVal !== quickTx.ratePerKg) {
        setQuickTx(prev => ({
          ...prev,
          ratePerKg: nextVal,
          amountPaid: prev.type === 'sale' ? Math.round(prev.quantityKg * nextVal) : prev.amountPaid,
        }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const onTouchEndRate = () => {
    dragStartRateY.current = null;
    setIsDraggingStepper(false);
  };

  const onTouchStartAmount = (e: any) => {
    dragStartAmountY.current = e.nativeEvent.pageY;
    dragStartAmountVal.current = quickTx.amountPaid;
    setIsDraggingStepper(true);
  };

  const onTouchMoveAmount = (e: any) => {
    if (dragStartAmountY.current === null) return;
    const currentY = e.nativeEvent.pageY;
    const diffY = dragStartAmountY.current - currentY;

    // Adjust step scale: 8 pixels of drag = ₹50
    const steps = Math.round(diffY / 8);
    if (steps !== 0) {
      const nextVal = Math.max(0, dragStartAmountVal.current + steps * 50);
      if (nextVal !== quickTx.amountPaid) {
        setQuickTx(prev => ({
          ...prev,
          amountPaid: nextVal,
        }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const onTouchEndAmount = () => {
    dragStartAmountY.current = null;
    setIsDraggingStepper(false);
  };

  // Sliding indicator animation for method tabs
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const TAB_WIDTH = (SCREEN_WIDTH - 32 - 8) / 3; // container padding 16*2, inner pad 4*2
  const methodIndexMap: Record<string, number> = { manual: 0, voice: 1, scan: 2 };
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  const switchMethod = (method: 'manual' | 'voice' | 'scan') => {
    const index = methodIndexMap[method];
    Animated.timing(indicatorAnim, {
      toValue: index * TAB_WIDTH,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    setRecordMethod(method);
  };

  // Sliding indicator for transaction type (0 = sale, 1 = payment)
  const typeIndicatorAnim = useRef(new Animated.Value(0)).current;
  const switchType = (type: 'sale' | 'payment') => {
    Animated.timing(typeIndicatorAnim, {
      toValue: type === 'sale' ? 0 : 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // need layout-based width
    }).start();
    setQuickTx(prev => ({
      ...prev,
      type,
      amountPaid: type === 'payment' && selectedCustomer ? selectedCustomer.pendingAmount : 0,
    }));
  };

  // Date picker states
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());

  const parsedDate = useMemo(() => {
    if (!quickTx.date) return new Date();
    const parts = quickTx.date.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
    const d = new Date(quickTx.date);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [quickTx.date]);

  const calendarMonthDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const startDayOfWeek = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++) days.push(d);
    return days;
  }, [currentCalendarDate]);

  const prevMonth = () =>
    setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const selectDay = (day: number) => {
    const selected = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), day);
    const yyyy = selected.getFullYear();
    const mm = String(selected.getMonth() + 1).padStart(2, '0');
    const dd = String(selected.getDate()).padStart(2, '0');
    setQuickTx(prev => ({ ...prev, date: `${yyyy}-${mm}-${dd}` }));
    setIsDatePickerOpen(false);
  };

  const selectToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setQuickTx(prev => ({ ...prev, date: `${yyyy}-${mm}-${dd}` }));
    setCurrentCalendarDate(today);
    setIsDatePickerOpen(false);
  };

  const filteredCustomersForPicker = useMemo(() => {
    if (!customerSearchQuery.trim()) {
      return [...customers].sort((a, b) => {
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
      });
    }
    return customers.filter(c => c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()));
  }, [customers, customerSearchQuery]);

  const updateParsedPreviewItem = (index: number, updatedFields: Partial<ParsedPreviewState>) => {
    setParsedPreviewList(prev => {
      if (!prev) return null;
      const next = [...prev];
      next[index] = { ...next[index], ...updatedFields };
      return next;
    });
  };

  const deleteParsedPreviewItem = (index: number) => {
    setParsedPreviewList(prev => {
      if (!prev) return null;
      const next = prev.filter((_, idx) => idx !== index);
      return next.length > 0 ? next : null;
    });
  };

  const computedTotalBill = useMemo(() => {
    if (quickTx.type !== 'sale') return 0;
    return Math.round(quickTx.quantityKg * quickTx.ratePerKg);
  }, [quickTx.type, quickTx.quantityKg, quickTx.ratePerKg]);

  const computedLeftoverDues = useMemo(() => {
    if (quickTx.type !== 'sale') return 0;
    return Math.max(0, computedTotalBill - quickTx.amountPaid);
  }, [quickTx.type, computedTotalBill, quickTx.amountPaid]);

  const selectedCustomer = customers.find(c => c.id === quickTx.customerId);

  // Compute total client dues dynamically (current pending + current leftover dues)
  const clientTotalDues = useMemo(() => {
    const custDues = selectedCustomer ? selectedCustomer.pendingAmount : 0;
    return custDues + computedLeftoverDues;
  }, [selectedCustomer, computedLeftoverDues]);

  const upiAmount = clientTotalDues;
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(businessName)}&am=${upiAmount}&cu=INR&tn=${encodeURIComponent('Ledger Entry')}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;

  const dict = labels[selectedLanguage];

  const handleCopySummary = () => {
    let text = '';
    text = `${businessName} ${dict.title}\n-----------------------\n` +
           `${dict.receiver} ${selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}\n` +
           `${dict.timestamp} ${quickTx.date}\n` +
           `${dict.description}: ${dict.ghee}\n` +
           `Quantity: ${quickTx.quantityKg} kg @ ₹${quickTx.ratePerKg}/kg\n` +
           `${dict.subtotal} ₹${computedTotalBill}\n` +
           `${dict.paid} ₹${quickTx.amountPaid}\n` +
           `${dict.unsettled} ₹${computedLeftoverDues}\n` +
           `${dict.totalDues} ₹${clientTotalDues}\n-----------------------\n` +
           `${dict.payDirect} ${upiId}\nThank you!`;
    Clipboard.setStringAsync(text);
    triggerNotification('Receipt text copied!');
  };

  const handleShareSummary = async () => {
    try {
      let text = '';
      text = `${businessName} ${dict.title}\n` +
             `Client: ${selectedCustomer ? selectedCustomer.name : 'Walk-in'}\n` +
             `Date: ${quickTx.date}\n` +
             `Qty: ${quickTx.quantityKg} kg @ ₹${quickTx.ratePerKg}/kg\n` +
             `Total: ₹${computedTotalBill}\n` +
             `Paid: ₹${quickTx.amountPaid}\n` +
             `Dues: ₹${clientTotalDues}\n` +
             `UPI: ${upiId}`;
      await Share.share({
        message: text,
      });
    } catch (e) {
      triggerNotification('Could not share summary.', 'error');
    }
  };

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${dict.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #faf9f5;
      color: #141413;
      padding: 20px;
      margin: 0;
    }
    .voucher {
      max-width: 400px;
      margin: 0 auto;
      background-color: #faf9f5;
      border: 1px solid #efe9de;
      padding: 24px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      position: relative;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .business-name {
      font-family: Georgia, serif;
      font-size: 26px;
      font-weight: bold;
      margin: 0 0 4px 0;
      color: #141413;
    }
    .subtitle {
      font-size: 10px;
      font-weight: bold;
      color: #8e8b82;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0;
    }
    .meta-table {
      border-top: 1px dashed #e6dfd8;
      border-bottom: 1px dashed #e6dfd8;
      padding: 10px 0;
      margin-bottom: 20px;
      font-size: 12px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
    }
    .meta-label {
      color: #8e8b82;
      font-weight: bold;
    }
    .meta-value {
      font-weight: 600;
    }
    .description-section {
      margin-bottom: 20px;
    }
    .table-header {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-weight: bold;
      color: #8e8b82;
      margin-bottom: 8px;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(230, 223, 216, 0.4);
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .item-name {
      font-size: 14px;
      font-weight: bold;
    }
    .item-details {
      font-size: 11px;
      color: #8e8b82;
      margin-top: 2px;
    }
    .item-total {
      font-size: 14px;
      font-weight: bold;
    }
    .pricing-section {
      font-size: 12px;
      text-align: right;
    }
    .pricing-row {
      display: flex;
      justify-content: space-between;
      margin: 6px 0;
    }
    .pricing-label {
      color: #8e8b82;
      font-weight: 600;
    }
    .pricing-value {
      font-weight: 600;
    }
    .unsettled-row {
      border-top: 1px dashed #e6dfd8;
      padding-top: 8px;
      margin-top: 6px;
      font-size: 14px;
    }
    .text-red {
      color: #c64545;
    }
    .text-green {
      color: #5db872;
    }
    .remaining-dues {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      font-weight: bold;
      color: #c64545;
      border-top: 1px dashed #e6dfd8;
      padding-top: 8px;
      margin: 8px auto;
      max-width: 200px;
    }
    .notes-box {
      background-color: rgba(239, 233, 222, 0.3);
      border: 1px solid rgba(230, 223, 216, 0.4);
      border-radius: 4px;
      padding: 10px;
      margin-bottom: 20px;
      font-size: 11px;
      font-style: italic;
      color: #6c6a64;
      text-align: center;
    }
    .upi-section {
      border-top: 1px dashed #e6dfd8;
      padding-top: 16px;
      text-align: center;
      font-size: 11px;
    }
    .upi-badge {
      display: inline-block;
      background-color: #efe9de;
      border: 1px solid rgba(230, 223, 216, 0.5);
      border-radius: 6px;
      padding: 6px 12px;
      margin-bottom: 10px;
      font-weight: bold;
    }
    .upi-id {
      color: #cc785c;
    }
    .footer-biz-name {
      font-weight: bold;
      font-size: 12px;
      margin-top: 6px;
    }
    .qr-code-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 15px;
      margin-bottom: 15px;
      padding: 12px;
      background-color: #ffffff;
      border-radius: 8px;
      border: 1px solid #efe9de;
    }
    .qr-code-image {
      width: 150px;
      height: 150px;
    }
    .qr-code-text {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      font-weight: bold;
      color: #141413;
      margin-top: 8px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="voucher">
    <div class="header">
      <h1 class="business-name">${businessName}</h1>
      <p class="subtitle">${dict.title}</p>
    </div>

    <div class="meta-table">
      <div class="meta-row">
        <span class="meta-label">${dict.voucherNo}</span>
        <span class="meta-value">DRAFT</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">${dict.timestamp}</span>
        <span class="meta-value">${quickTx.date}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">${dict.receiver}</span>
        <span class="meta-value">${selectedCustomer ? selectedCustomer.name : 'Walk-in Client'}</span>
      </div>
    </div>

    <div class="description-section">
      <div class="table-header">
        <span>${dict.description}</span>
        <span>${dict.total}</span>
      </div>
      <div class="item-row">
        <div>
          <div class="item-name">${dict.ghee}</div>
          <div class="item-details">${quickTx.quantityKg} kg @ ₹${quickTx.ratePerKg}/kg</div>
        </div>
        <span class="item-total">₹${computedTotalBill}</span>
      </div>
      <div class="pricing-section">
        <div class="pricing-row">
          <span class="pricing-label">${dict.subtotal}</span>
          <span class="pricing-value">₹${computedTotalBill}</span>
        </div>
        <div class="pricing-row text-green">
          <span class="pricing-label text-green">${dict.paid}</span>
          <span class="pricing-value">₹${quickTx.amountPaid}</span>
        </div>
        <div class="pricing-row unsettled-row text-red">
          <span class="pricing-label text-red">${dict.unsettled}</span>
          <span class="pricing-value">₹${computedLeftoverDues}</span>
        </div>
        ${clientTotalDues > computedLeftoverDues ? `
          <div class="pricing-row text-red" style="font-weight: bold; font-size: 13px; border-top: 1px dashed #e6dfd8; padding-top: 6px; margin-top: 6px;">
            <span>${dict.totalDues}</span>
            <span>₹${clientTotalDues}</span>
          </div>
        ` : ''}
      </div>
    </div>

    ${quickTx.notes ? `
      <div class="notes-box">
        * "${quickTx.notes}"
      </div>
    ` : ''}

    <div class="upi-section">
      <div class="upi-badge">
        ${dict.payDirect} <span class="upi-id">${upiId}</span>
      </div>
      ${upiId && upiAmount > 0 ? `
        <div class="qr-code-section">
          <img src="${qrCodeUrl}" class="qr-code-image" />
          <div class="qr-code-text">${dict.scanPay(upiAmount)}</div>
        </div>
      ` : ''}
      <div class="footer-biz-name">${businessName}</div>
    </div>
  </div>
</body>
</html>
      `;

      await Print.printAsync({ html });
    } catch (e) {
      triggerNotification('Could not print receipt.', 'error');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleTtsSpeak = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    const speakText = dict.ttsSales(businessName, quickTx.quantityKg, selectedCustomer ? selectedCustomer.name : 'Walk-in Customer', computedTotalBill, quickTx.amountPaid);
    const speechLang = selectedLanguage === 'hi' ? 'hi-IN' : selectedLanguage === 'pa' ? 'pa-IN' : 'en-IN';

    setIsSpeaking(true);
    Speech.speak(speakText, {
      language: speechLang,
      onDone: () => setIsSpeaking(false),
      onError: () => {
        setIsSpeaking(false);
        triggerNotification('Audio narration failed.', 'error');
      }
    });
  };

  const adjustQuantity = (val: number) => {
    setQuickTx(prev => {
      const nextQty = Math.max(0, parseFloat((prev.quantityKg + val).toFixed(2)));
      return {
        ...prev,
        quantityKg: nextQty,
        amountPaid: prev.type === 'sale' ? Math.round(nextQty * prev.ratePerKg) : prev.amountPaid,
      };
    });
  };

  const setFixedQuantity = (val: number) => {
    setShowCustomWeight(false);
    setQuickTx(prev => ({
      ...prev,
      quantityKg: val,
      amountPaid: prev.type === 'sale' ? Math.round(val * prev.ratePerKg) : prev.amountPaid,
    }));
  };

  // Avatar letter helper
  const getInitial = (name: string) => name.trim().charAt(0).toUpperCase();

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      scrollEnabled={!isCustomerPickerOpen && !isDraggingStepper}
      keyboardShouldPersistTaps="handled"
    >

      {/* ─── METHOD SWITCHER (pill slider) ─── */}
      <View style={styles.methodBar}>
        <Animated.View
          style={[
            styles.methodIndicator,
            { width: TAB_WIDTH, transform: [{ translateX: indicatorAnim }] },
          ]}
        />
        {METHODS.map(({ key, label }) => {
          const active = recordMethod === key;
          const Icon = key === 'manual' ? Keyboard : key === 'voice' ? Mic : Camera;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => switchMethod(key)}
              style={[styles.methodTab, { width: TAB_WIDTH }]}
              activeOpacity={0.8}
            >
              <Icon size={14} color={active ? COLORS.white : COLORS.textMuted} />
              <Text style={[styles.methodTabText, active && styles.methodTabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ─── PARSED PREVIEW (AI result confirmation) ─── */}
      {parsedPreviewList && parsedPreviewList.length > 0 && (
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <View style={styles.previewTitleRow}>
              <Edit2 size={14} color={COLORS.coral} style={{ marginRight: 6 }} />
              <Text style={styles.previewTitle}>
                Confirm Extracted Records ({parsedPreviewList.length})
              </Text>
            </View>
            <TouchableOpacity onPress={() => setParsedPreviewList(null)}>
              <X size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {parsedPreviewList.map((item, index) => {
            const bill = item.type === 'sale' ? Math.round(item.quantityKg * item.ratePerKg) : 0;
            const dueAddition = item.type === 'sale' ? Math.max(0, bill - item.amountPaid) : 0;
            return (
              <AnimatedItem key={index} index={index} delay={30}>
                <View style={styles.previewCard}>
                  <View style={styles.previewCardHeader}>
                    <Text style={styles.previewCardNumber}>Record #{index + 1}</Text>
                    <TouchableOpacity onPress={() => deleteParsedPreviewItem(index)} style={styles.deleteCardButton}>
                      <X size={16} color={COLORS.red} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.previewForm}>
                    <View style={styles.metaGrid}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.smallLabel}>Customer Name</Text>
                        <TextInput
                          value={item.customerName}
                          onChangeText={text => updateParsedPreviewItem(index, { customerName: text })}
                          style={styles.previewInput}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.smallLabel}>Type</Text>
                        <TouchableOpacity
                          onPress={() => updateParsedPreviewItem(index, { type: item.type === 'sale' ? 'payment' : 'sale' })}
                          style={styles.previewInputToggle}
                        >
                          <Text style={styles.previewToggleText}>
                            {item.type === 'sale' ? 'Dispatch (Sale)' : 'Receive Payment'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {item.type === 'sale' && (
                      <View style={styles.metaGrid}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.smallLabel}>Quantity (kg)</Text>
                          <TextInput
                            keyboardType="numeric"
                            value={item.quantityKg.toString()}
                            onChangeText={text => updateParsedPreviewItem(index, { quantityKg: parseFloat(text) || 0 })}
                            style={styles.previewInput}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.smallLabel}>Rate ({RUPEE}/kg)</Text>
                          <TextInput
                            keyboardType="numeric"
                            value={item.ratePerKg.toString()}
                            onChangeText={text => updateParsedPreviewItem(index, { ratePerKg: parseFloat(text) || 0 })}
                            style={styles.previewInput}
                          />
                        </View>
                      </View>
                    )}

                    <View style={styles.metaGrid}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.smallLabel}>Amount Paid ({RUPEE})</Text>
                        <TextInput
                          keyboardType="numeric"
                          value={item.amountPaid.toString()}
                          onChangeText={text => updateParsedPreviewItem(index, { amountPaid: parseInt(text) || 0 })}
                          style={[styles.previewInput, { color: COLORS.green, fontWeight: 'bold' }]}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.smallLabel}>Memo/Notes</Text>
                        <TextInput
                          value={item.notes || ''}
                          onChangeText={text => updateParsedPreviewItem(index, { notes: text })}
                          style={styles.previewInput}
                        />
                      </View>
                    </View>

                    {item.type === 'sale' && (
                      <View style={styles.inlineBillRow}>
                        <Text style={styles.inlineBillText}>
                          Total: <Text style={{ fontWeight: 'bold', color: COLORS.textDark }}>{RUPEE}{bill}</Text>
                          {'  ·  '}
                          <Text style={{ color: COLORS.red }}>Dues: {RUPEE}{dueAddition}</Text>
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </AnimatedItem>
            );
          })}

          <TouchableOpacity
            onPress={handleCommitParsedPreview}
            style={styles.confirmSaveButton}
            activeOpacity={0.8}
          >
            <Check size={16} color={COLORS.white} style={{ marginRight: 6 }} />
            <Text style={styles.confirmSaveButtonText}>Approve & Save All Records</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── PANEL A: MANUAL FORM ─── */}
      {recordMethod === 'manual' && !parsedPreviewList && (
        <View style={styles.formCard}>

          {/* Customer Picker */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>Customer</Text>
            <TouchableOpacity
              onPress={() => setIsCustomerPickerOpen(true)}
              style={styles.customerTrigger}
              activeOpacity={0.8}
            >
              {selectedCustomer ? (
                <View style={styles.customerTriggerAvatar}>
                  <Text style={styles.customerAvatarText}>
                    {getInitial(selectedCustomer.name)}
                  </Text>
                </View>
              ) : (
                <View style={[styles.customerTriggerAvatar, { backgroundColor: COLORS.bgWarm }]}>
                  <Text style={[styles.customerAvatarText, { color: COLORS.textMuted }]}>?</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                {selectedCustomer ? (
                  <>
                    <Text style={styles.customerTriggerName}>{selectedCustomer.name}</Text>
                    <Text style={styles.customerTriggerSub}>
                      Outstanding: {RUPEE}{selectedCustomer.pendingAmount}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.customerTriggerPlaceholder}>
                    Choose a registered customer
                  </Text>
                )}
              </View>
              <ChevronDown size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Transaction Type Toggle — pill segmented control */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>Transaction Type</Text>
            <View style={styles.typeSegment}>
              {/* Animated sliding pill */}
              <Animated.View
                style={[
                  styles.typeSegmentIndicator,
                  {
                    left: typeIndicatorAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['2%', '50%'],
                    }),
                    width: '48%',
                  },
                ]}
              />
              <TouchableOpacity
                onPress={() => switchType('sale')}
                style={styles.typeSegmentTab}
                activeOpacity={0.8}
              >
                <Package size={15} color={quickTx.type === 'sale' ? COLORS.white : COLORS.coral} />
                <Text style={[styles.typeSegmentText, quickTx.type === 'sale' && styles.typeSegmentTextActive]}>
                  Dispatch Ghee
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => switchType('payment')}
                style={styles.typeSegmentTab}
                activeOpacity={0.8}
              >
                <Banknote size={15} color={quickTx.type === 'payment' ? COLORS.white : COLORS.green} />
                <Text style={[styles.typeSegmentText, quickTx.type === 'payment' && styles.typeSegmentTextActive]}>
                  Receive Cash
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {quickTx.type === 'sale' ? (
            <>
              {/* ── Weight ── */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>Weight (kg)</Text>

                {/* ONE outer box → [−0.5] | value | [+1] inside it */}
                <View 
                  style={styles.stepperBox}
                  onTouchStart={onTouchStartWeight}
                  onTouchMove={onTouchMoveWeight}
                  onTouchEnd={onTouchEndWeight}
                  onTouchCancel={onTouchEndWeight}
                >
                  <TouchableOpacity
                    onPress={() => adjustQuantity(-0.5)}
                    style={styles.stepperInnerBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stepperInnerBtnText}>−0.5</Text>
                  </TouchableOpacity>

                  <View style={styles.stepperDivider} />

                  <View style={styles.stepperValueArea}>
                    <TextInput
                      keyboardType="numeric"
                      value={quickTx.quantityKg.toString()}
                      onChangeText={text => {
                        if (text === '') {
                          setQuickTx(prev => ({ ...prev, quantityKg: 0, amountPaid: 0 }));
                          return;
                        }
                        const v = parseFloat(text) || 0;
                        setQuickTx(prev => ({
                          ...prev,
                          quantityKg: Math.max(0, v),
                          amountPaid: prev.type === 'sale'
                            ? Math.round(Math.max(0, v) * prev.ratePerKg)
                            : prev.amountPaid,
                        }));
                      }}
                      style={styles.stepperValueInput}
                      selectTextOnFocus
                    />
                    <Text style={styles.stepperValueUnit}>kg</Text>
                  </View>

                  <View style={styles.stepperDivider} />

                  <TouchableOpacity
                    onPress={() => adjustQuantity(1)}
                    style={styles.stepperInnerBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stepperInnerBtnText}>+1</Text>
                  </TouchableOpacity>
                </View>

                {/* Quick chips */}
                <View style={styles.chipGrid}>
                  {weightPresets.map(val => (
                    <TouchableOpacity
                      key={val}
                      onPress={() => setFixedQuantity(val)}
                      style={[styles.chip, quickTx.quantityKg === val && !showCustomWeight && styles.chipActiveCoral]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, quickTx.quantityKg === val && !showCustomWeight && styles.chipTextActive]}>
                        {val} kg
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    onPress={() => setShowCustomWeight(!showCustomWeight)}
                    style={[styles.chip, styles.chipOutline, showCustomWeight && styles.chipActiveCoral]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, { color: COLORS.coral }, showCustomWeight && styles.chipTextActive]}>
                      Custom
                    </Text>
                  </TouchableOpacity>
                </View>

                {showCustomWeight && (
                  <View style={styles.inlineInputRow}>
                    <TextInput
                      keyboardType="numeric"
                      value={quickTx.quantityKg.toString()}
                      onChangeText={text => {
                        if (text === '') {
                          setQuickTx(prev => ({ ...prev, quantityKg: 0, amountPaid: 0 }));
                          return;
                        }
                        const v = parseFloat(text) || 0;
                        setQuickTx(prev => ({
                          ...prev,
                          quantityKg: Math.max(0, v),
                          amountPaid: prev.type === 'sale'
                            ? Math.round(Math.max(0, v) * prev.ratePerKg)
                            : prev.amountPaid,
                        }));
                      }}
                      style={styles.inlineInput}
                      placeholder="Enter weight"
                      placeholderTextColor={COLORS.textLightMuted}
                    />
                    <Text style={styles.inlineInputUnit}>kg</Text>
                  </View>
                )}
              </View>

              {/* ── Rate per kg ── */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>Rate per kg</Text>

                {/* ONE outer box → [−50] | ₹value/kg | [+100] inside it */}
                <View 
                  style={styles.stepperBox}
                  onTouchStart={onTouchStartRate}
                  onTouchMove={onTouchMoveRate}
                  onTouchEnd={onTouchEndRate}
                  onTouchCancel={onTouchEndRate}
                >
                  <TouchableOpacity
                    onPress={() => {
                      const r = Math.max(0, quickTx.ratePerKg - 50);
                      setQuickTx(prev => ({
                        ...prev,
                        ratePerKg: r,
                        amountPaid: prev.type === 'sale' ? Math.round(prev.quantityKg * r) : prev.amountPaid,
                      }));
                    }}
                    style={styles.stepperInnerBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stepperInnerBtnText}>−50</Text>
                  </TouchableOpacity>

                  <View style={styles.stepperDivider} />

                  <View style={styles.stepperValueArea}>
                    <Text style={styles.stepperValueUnit}>{RUPEE}</Text>
                    <TextInput
                      keyboardType="number-pad"
                      value={quickTx.ratePerKg.toString()}
                      onChangeText={text => {
                        const r = parseFloat(text) || 0;
                        setQuickTx(prev => ({
                          ...prev,
                          ratePerKg: r,
                          amountPaid: prev.type === 'sale' ? Math.round(prev.quantityKg * r) : prev.amountPaid,
                        }));
                      }}
                      style={styles.stepperValueInput}
                      selectTextOnFocus
                    />
                    <Text style={styles.stepperValueUnit}>/kg</Text>
                  </View>

                  <View style={styles.stepperDivider} />

                  <TouchableOpacity
                    onPress={() => {
                      const r = quickTx.ratePerKg + 100;
                      setQuickTx(prev => ({
                        ...prev,
                        ratePerKg: r,
                        amountPaid: prev.type === 'sale' ? Math.round(prev.quantityKg * r) : prev.amountPaid,
                      }));
                    }}
                    style={styles.stepperInnerBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stepperInnerBtnText}>+100</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.chipGrid}>
                  {ratePresets.map(rate => (
                    <TouchableOpacity
                      key={rate}
                      onPress={() => {
                        setShowCustomRate(false);
                        setQuickTx(prev => ({
                          ...prev,
                          ratePerKg: rate,
                          amountPaid: prev.type === 'sale'
                            ? Math.round(prev.quantityKg * rate)
                            : prev.amountPaid,
                        }));
                      }}
                      style={[styles.chip, quickTx.ratePerKg === rate && !showCustomRate && styles.chipActiveDark]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, quickTx.ratePerKg === rate && !showCustomRate && styles.chipTextActive]}>
                        {RUPEE}{rate}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    onPress={() => setShowCustomRate(!showCustomRate)}
                    style={[styles.chip, styles.chipOutline, showCustomRate && styles.chipActiveDark]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, { color: COLORS.coral }, showCustomRate && styles.chipTextActive]}>
                      Custom
                    </Text>
                  </TouchableOpacity>
                </View>

                {showCustomRate && (
                  <View style={styles.inlineInputRow}>
                    <Text style={styles.inlineInputUnit}>{RUPEE}</Text>
                    <TextInput
                      keyboardType="number-pad"
                      value={quickTx.ratePerKg.toString()}
                      onChangeText={text => {
                        const r = parseFloat(text) || 0;
                        setQuickTx(prev => ({
                          ...prev,
                          ratePerKg: r,
                          amountPaid: prev.type === 'sale'
                            ? Math.round(prev.quantityKg * r)
                            : prev.amountPaid,
                        }));
                      }}
                      style={styles.inlineInput}
                      placeholder="Enter rate"
                      placeholderTextColor={COLORS.textLightMuted}
                    />
                    <Text style={styles.inlineInputUnit}>/kg</Text>
                  </View>
                )}
              </View>

              {/* ── Amount Paid ── */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionLabelRow}>
                  <Text style={styles.sectionLabel}>Amount Paid</Text>
                  <View style={[styles.valuePill, { backgroundColor: 'rgba(46,125,50,0.1)' }]}>
                    <Text style={[styles.valuePillText, { color: COLORS.green }]}>
                      {RUPEE}{quickTx.amountPaid}
                    </Text>
                  </View>
                </View>

                <View 
                  style={styles.stepperBox}
                  onTouchStart={onTouchStartAmount}
                  onTouchMove={onTouchMoveAmount}
                  onTouchEnd={onTouchEndAmount}
                  onTouchCancel={onTouchEndAmount}
                >
                  <TouchableOpacity
                    onPress={() => {
                      setQuickTx(prev => ({
                        ...prev,
                        amountPaid: Math.max(0, prev.amountPaid - 100),
                      }));
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={styles.stepperInnerBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stepperInnerBtnText}>−100</Text>
                  </TouchableOpacity>

                  <View style={styles.stepperDivider} />

                  <View style={styles.stepperValueArea}>
                    <Text style={styles.stepperValueUnit}>{RUPEE}</Text>
                    <TextInput
                      keyboardType="number-pad"
                      value={quickTx.amountPaid.toString()}
                      onChangeText={text => {
                        const v = parseFloat(text) || 0;
                        setQuickTx(prev => ({
                          ...prev,
                          amountPaid: Math.max(0, v),
                        }));
                      }}
                      style={styles.stepperValueInput}
                      selectTextOnFocus
                    />
                  </View>

                  <View style={styles.stepperDivider} />

                  <TouchableOpacity
                    onPress={() => {
                      setQuickTx(prev => ({
                        ...prev,
                        amountPaid: prev.amountPaid + 100,
                      }));
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={styles.stepperInnerBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stepperInnerBtnText}>+100</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.chipGrid}>
                  <TouchableOpacity
                    onPress={() => { setShowCustomAmount(false); setQuickTx(prev => ({ ...prev, amountPaid: 0 })); }}
                    style={[styles.chip, quickTx.amountPaid === 0 && !showCustomAmount && styles.chipActiveRed]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, quickTx.amountPaid === 0 && !showCustomAmount && styles.chipTextActive]}>
                      Unpaid
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => { setShowCustomAmount(false); setQuickTx(prev => ({ ...prev, amountPaid: computedTotalBill })); }}
                    style={[styles.chip, quickTx.amountPaid === computedTotalBill && !showCustomAmount && styles.chipActiveGreen]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, quickTx.amountPaid === computedTotalBill && !showCustomAmount && styles.chipTextActive]}>
                      Full
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => { setShowCustomAmount(false); setQuickTx(prev => ({ ...prev, amountPaid: Math.round(computedTotalBill / 2) })); }}
                    style={[styles.chip, quickTx.amountPaid === Math.round(computedTotalBill / 2) && !showCustomAmount && styles.chipActiveDark]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, quickTx.amountPaid === Math.round(computedTotalBill / 2) && !showCustomAmount && styles.chipTextActive]}>
                      50%
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowCustomAmount(!showCustomAmount)}
                    style={[styles.chip, styles.chipOutline, showCustomAmount && styles.chipActiveCoral]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, { color: COLORS.coral }, showCustomAmount && styles.chipTextActive]}>
                      Custom
                    </Text>
                  </TouchableOpacity>
                </View>

                {showCustomAmount && (
                  <View style={styles.inlineInputRow}>
                    <Text style={styles.inlineInputUnit}>{RUPEE}</Text>
                    <TextInput
                      keyboardType="number-pad"
                      value={quickTx.amountPaid.toString()}
                      onChangeText={text => setQuickTx(prev => ({ ...prev, amountPaid: parseFloat(text) || 0 }))}
                      style={styles.inlineInput}
                      placeholder="Enter amount"
                      placeholderTextColor={COLORS.textLightMuted}
                    />
                  </View>
                )}
              </View>

              {/* ── Realistic Thermal Receipt Bill ── */}
              <View style={styles.receiptContainer}>
                {/* Top black serrated edge representation */}
                <View style={styles.serratedHeader}>
                  {Array.from({ length: 15 }).map((_, i) => (
                    <View key={i} style={styles.serratedTriangle} />
                  ))}
                </View>
                
                <View style={styles.receiptPaper}>
                  
                  {/* Language Selector pills inside receipt */}
                  <View style={styles.langPillsContainer}>
                    {[
                      { key: 'en', label: 'EN' },
                      { key: 'hi', label: 'हिन्दी' },
                      { key: 'pa', label: 'ਪੰਜਾਬੀ' }
                    ].map(lang => (
                      <TouchableOpacity
                        key={lang.key}
                        onPress={() => setSelectedLanguage(lang.key as any)}
                        style={[
                          styles.langPill,
                          selectedLanguage === lang.key && styles.langPillActive
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text style={[
                          styles.langPillText,
                          selectedLanguage === lang.key && styles.langPillTextActive
                        ]}>
                          {lang.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.businessHeader}>
                    <Text style={styles.bizName}>{businessName}</Text>
                    <Text style={styles.bizSub}>{dict.title}</Text>
                  </View>

                  {/* Meta Table */}
                  <View style={styles.metaTable}>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>{dict.voucherNo}</Text>
                      <Text style={styles.metaValue}>DRAFT</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>{dict.timestamp}</Text>
                      <Text style={styles.metaValue}>{quickTx.date}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>{dict.receiver}</Text>
                      <Text style={styles.metaValue}>{selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}</Text>
                    </View>
                  </View>

                  {/* Description Section */}
                  <View style={styles.descriptionSection}>
                    <View style={styles.descTableHeader}>
                      <Text style={styles.descTableHeaderText}>{dict.description}</Text>
                      <Text style={styles.descTableHeaderText}>{dict.total}</Text>
                    </View>

                    <TouchableOpacity 
                      style={styles.itemRow}
                      onPress={() => {
                        setShowCustomWeight(true);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      }}
                      activeOpacity={0.7}
                    >
                      <View>
                        <Text style={styles.itemName}>{dict.ghee}</Text>
                        <Text style={styles.itemDetails}>{quickTx.quantityKg} kg @ ₹{quickTx.ratePerKg}/kg</Text>
                      </View>
                      <Text style={styles.itemTotal}>₹{computedTotalBill}</Text>
                    </TouchableOpacity>

                    <View style={styles.pricingSection}>
                      <View style={styles.pricingRow}>
                        <Text style={styles.pricingLabel}>{dict.subtotal}</Text>
                        <Text style={styles.pricingValue}>₹{computedTotalBill}</Text>
                      </View>
                      
                      <TouchableOpacity 
                        style={styles.pricingRow}
                        onPress={() => {
                          setShowCustomAmount(true);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.pricingLabel, { color: COLORS.green }]}>{dict.paid}</Text>
                        <Text style={[styles.pricingValue, { color: COLORS.green, fontWeight: 'bold' }]}>₹{quickTx.amountPaid}</Text>
                      </TouchableOpacity>
                      
                      <View style={[styles.pricingRow, styles.unsettledRow]}>
                        <Text style={[styles.pricingLabel, { color: COLORS.red, fontWeight: 'bold' }]}>{dict.unsettled}</Text>
                        <Text style={[styles.pricingValue, { color: COLORS.red, fontWeight: 'bold', fontSize: 13 }]}>₹{computedLeftoverDues}</Text>
                      </View>
                      
                      {clientTotalDues > computedLeftoverDues && (
                        <View style={[styles.pricingRow, { borderTopWidth: 1, borderStyle: 'dashed', borderColor: COLORS.border, paddingTop: 6, marginTop: 6 }]}>
                          <Text style={[styles.pricingLabel, { color: COLORS.red, fontWeight: 'bold' }]}>{dict.totalDues}</Text>
                          <Text style={[styles.pricingValue, { color: COLORS.red, fontWeight: 'bold', fontSize: 13 }]}>₹{clientTotalDues}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {quickTx.notes && quickTx.notes !== '' && (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesText}>* "{quickTx.notes}"</Text>
                    </View>
                  )}

                  {/* UPI Section */}
                  <View style={styles.upiContainer}>
                    <View style={styles.upiBadge}>
                      <QrCode size={14} color={COLORS.coral} style={{ marginRight: 4 }} />
                      <Text style={styles.upiText}>
                        {dict.payDirect} <Text style={styles.upiId}>{upiId}</Text>
                      </Text>
                    </View>
                    {upiId && upiAmount > 0 ? (
                      <View style={styles.qrCodeSection}>
                        <Image source={{ uri: qrCodeUrl }} style={styles.qrCodeImage} />
                        <Text style={styles.qrCodeText}>{dict.scanPay(upiAmount)}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.bizNameFooter}>{businessName}</Text>
                  </View>

                  {/* Rubber stamp overlay - PAID / PARTIAL / UNPAID (Clickable to toggle full/no payment!) */}
                  <TouchableOpacity 
                    style={styles.stampWrapper}
                    onPress={() => {
                      const nextPaid = quickTx.amountPaid === computedTotalBill ? 0 : computedTotalBill;
                      setQuickTx(prev => ({
                        ...prev,
                        amountPaid: nextPaid
                      }));
                      Haptics.notificationAsync(
                        nextPaid === computedTotalBill 
                          ? Haptics.NotificationFeedbackType.Success 
                          : Haptics.NotificationFeedbackType.Warning
                      );
                    }}
                    activeOpacity={0.8}
                  >
                    {computedLeftoverDues === 0 ? (
                      <View style={[styles.stampContainer, styles.stampPaid]}>
                        <Text style={[styles.stampText, styles.stampTextPaid]}>PAID</Text>
                      </View>
                    ) : quickTx.amountPaid > 0 ? (
                      <View style={[styles.stampContainer, styles.stampPartial]}>
                        <Text style={[styles.stampText, styles.stampTextPartial]}>PARTIAL</Text>
                      </View>
                    ) : (
                      <View style={[styles.stampContainer, styles.stampUnpaid]}>
                        <Text style={[styles.stampText, styles.stampTextUnpaid]}>UNPAID</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                </View>
                
                {/* Action operations footer */}
                <View style={styles.actionFooter}>
                  <TouchableOpacity
                    onPress={handleTtsSpeak}
                    style={styles.ttsButton}
                    activeOpacity={0.8}
                  >
                    {isSpeaking ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Volume2 size={18} color={COLORS.white} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleCopySummary}
                    style={styles.copyButton}
                    activeOpacity={0.8}
                  >
                    <Copy size={16} color={COLORS.bgSand} style={{ marginRight: 6 }} />
                    <Text style={styles.copyButtonText}>Copy Text</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handlePrint}
                    style={styles.printButton}
                    activeOpacity={0.8}
                  >
                    {isPrinting ? (
                      <ActivityIndicator size="small" color={COLORS.textDark} />
                    ) : (
                      <Printer size={18} color={COLORS.textDark} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleShareSummary}
                    style={styles.shareButton}
                    activeOpacity={0.8}
                  >
                    <Share2 size={16} color={COLORS.textDark} />
                  </TouchableOpacity>
                </View>

                <View style={styles.receiptTornEdgeBottom} />
              </View>
            </>
          ) : (
            /* PAYMENT MODE */
            <View style={styles.sectionBlock}>
              <View style={styles.sectionLabelRow}>
                <Text style={styles.sectionLabel}>Cash Received</Text>
                <View style={[styles.valuePill, { backgroundColor: 'rgba(46,125,50,0.1)' }]}>
                  <Text style={[styles.valuePillText, { color: COLORS.green }]}>
                    {RUPEE}{quickTx.amountPaid}
                  </Text>
                </View>
              </View>
              <View 
                style={[styles.stepperBox, { marginTop: 4 }]}
                onTouchStart={onTouchStartAmount}
                onTouchMove={onTouchMoveAmount}
                onTouchEnd={onTouchEndAmount}
                onTouchCancel={onTouchEndAmount}
              >
                <TouchableOpacity
                  onPress={() => {
                    setQuickTx(prev => ({
                      ...prev,
                      amountPaid: Math.max(0, prev.amountPaid - 100),
                    }));
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={styles.stepperInnerBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepperInnerBtnText}>−100</Text>
                </TouchableOpacity>

                <View style={styles.stepperDivider} />

                <View style={styles.stepperValueArea}>
                  <Text style={styles.stepperValueUnit}>{RUPEE}</Text>
                  <TextInput
                    keyboardType="number-pad"
                    value={quickTx.amountPaid.toString()}
                    onChangeText={text => {
                      const v = parseFloat(text) || 0;
                      setQuickTx(prev => ({
                        ...prev,
                        amountPaid: Math.max(0, v),
                      }));
                    }}
                    style={styles.stepperValueInput}
                    selectTextOnFocus
                    placeholder="0"
                    placeholderTextColor={COLORS.textLightMuted}
                  />
                </View>

                <View style={styles.stepperDivider} />

                <TouchableOpacity
                  onPress={() => {
                    setQuickTx(prev => ({
                      ...prev,
                      amountPaid: prev.amountPaid + 100,
                    }));
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={styles.stepperInnerBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepperInnerBtnText}>+100</Text>
                </TouchableOpacity>
              </View>
              {selectedCustomer && selectedCustomer.pendingAmount > 0 && (
                <TouchableOpacity
                  onPress={() => setQuickTx(prev => ({ ...prev, amountPaid: selectedCustomer.pendingAmount }))}
                  style={styles.fillDueButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.fillDueText}>
                    Fill outstanding: {RUPEE}{selectedCustomer.pendingAmount}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── Date & Memo ── */}
          <View style={styles.metaStrip}>
            <TouchableOpacity
              onPress={() => { setCurrentCalendarDate(parsedDate); setIsDatePickerOpen(true); }}
              style={styles.metaStripItem}
              activeOpacity={0.8}
            >
              <Calendar size={13} color={COLORS.coral} />
              <Text style={styles.metaStripText}>{quickTx.date}</Text>
            </TouchableOpacity>
            <View style={styles.metaStripDivider} />
            <View style={[styles.metaStripItem, { flex: 1 }]}>
              <TextInput
                value={quickTx.notes}
                onChangeText={text => setQuickTx(prev => ({ ...prev, notes: text }))}
                placeholder="Memo (UPI, Cash…)"
                placeholderTextColor={COLORS.textLightMuted}
                style={styles.metaMemoInput}
              />
            </View>
          </View>

          {/* ── Submit ── */}
          <TouchableOpacity
            onPress={commitQuickTransaction}
            style={[
              styles.submitButton,
              { backgroundColor: quickTx.type === 'sale' ? COLORS.coral : COLORS.green },
            ]}
            activeOpacity={0.85}
          >
            <Text style={styles.submitButtonText}>
              {quickTx.type === 'sale' ? 'Commit Dispatch Record' : 'Confirm Payment Received'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── PANEL B: VOICE AI ─── */}
      {recordMethod === 'voice' && !parsedPreviewList && (
        <View style={styles.aiCard}>
          <View style={styles.aiIconWrap}>
            <Mic size={28} color={COLORS.white} />
          </View>
          <Text style={styles.aiCardTitle}>Voice Dictation Parser</Text>
          <Text style={styles.aiCardSubtitle}>
            Use your keyboard mic or type a statement below.{'\n'}
            <Text style={styles.aiExample}>"Rajesh took 5 kg ghee and paid 3000 rupees"</Text>
          </Text>

          <TextInput
            multiline
            numberOfLines={4}
            value={speechResultText}
            onChangeText={setSpeechResultText}
            placeholder="Tap and dictate or type here…"
            placeholderTextColor={COLORS.textLightMuted}
            style={styles.aiTextArea}
            textAlignVertical="top"
          />

          <TouchableOpacity
            onPress={() => {
              if (!speechResultText.trim()) {
                triggerNotification('Please enter or dictate a statement first.', 'error');
                return;
              }
              handleVoiceProcessing(speechResultText);
            }}
            style={styles.aiAnalyzeBtn}
            activeOpacity={0.85}
            disabled={isAiProcessing}
          >
            {isAiProcessing ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.aiAnalyzeBtnText}>Analyze with Gemini AI</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ─── PANEL C: PAPER SCAN ─── */}
      {recordMethod === 'scan' && !parsedPreviewList && (
        <View style={styles.aiCard}>
          <TouchableOpacity
            onPress={handleOCRFileSelection}
            style={[styles.aiIconWrap, { backgroundColor: COLORS.green }]}
            activeOpacity={0.8}
          >
            <Camera size={28} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.aiCardTitle}>Scan Handwritten Ledger</Text>
          <Text style={styles.aiCardSubtitle}>
            Tap the camera icon to photograph your delivery book or receipt.{'\n'}
            Gemini AI will extract and digitize the records automatically.
          </Text>

          {scanPreviewImage && (
            <View style={styles.scanPreviewBox}>
              <Image
                source={{ uri: scanPreviewImage }}
                style={styles.scanPreviewImage}
                resizeMode="cover"
              />
              {isScanningImage && (
                <View style={styles.scanLoadingOverlay}>
                  <View style={styles.scanLoadingBadge}>
                    <ActivityIndicator size="small" color={COLORS.green} style={{ marginRight: 8 }} />
                    <Text style={styles.scanLoadingText}>Reading handwritten values…</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {!scanPreviewImage && (
            <TouchableOpacity
              onPress={handleOCRFileSelection}
              style={styles.scanPlaceholder}
              activeOpacity={0.8}
            >
              <Camera size={32} color={COLORS.textLightMuted} />
              <Text style={styles.scanPlaceholderText}>Tap to select a photo</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ─── CUSTOMER PICKER MODAL ─── */}
      <Modal
        visible={isCustomerPickerOpen}
        transparent={true}
        animationType="fade"
        onShow={() => { setTimeout(() => searchInputRef.current?.focus(), 100); }}
        onRequestClose={() => { setIsCustomerPickerOpen(false); setCustomerSearchQuery(''); }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => { setIsCustomerPickerOpen(false); setCustomerSearchQuery(''); }}
        >
          <TouchableOpacity style={styles.pickerCard} activeOpacity={1} onPress={e => e.stopPropagation()}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Customer</Text>
              <TouchableOpacity
                onPress={() => { setIsCustomerPickerOpen(false); setCustomerSearchQuery(''); }}
                style={{ padding: 4 }}
              >
                <X size={18} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerSearch}>
              <Search size={14} color={COLORS.textLightMuted} style={{ marginRight: 8 }} />
              <TextInput
                ref={searchInputRef}
                value={customerSearchQuery}
                onChangeText={text => { setCustomerSearchQuery(text); setShowPickerScrollIndicator(true); }}
                placeholder="Search customer name…"
                placeholderTextColor={COLORS.textLightMuted}
                style={styles.pickerSearchInput}
                autoFocus={true}
              />
            </View>

            <View style={{ maxHeight: 300, position: 'relative', paddingBottom: 14 }}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                onScroll={event => {
                  const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
                  setShowPickerScrollIndicator(
                    layoutMeasurement.height + contentOffset.y < contentSize.height - 20
                  );
                }}
                scrollEventThrottle={16}
              >
                <TouchableOpacity
                  onPress={() => { setQuickTx(prev => ({ ...prev, customerId: '' })); setIsCustomerPickerOpen(false); setCustomerSearchQuery(''); }}
                  style={styles.pickerItem}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pickerItemName, { color: COLORS.textMuted }]}>
                    — None / Clear —
                  </Text>
                </TouchableOpacity>

                {filteredCustomersForPicker.length === 0 ? (
                  <Text style={styles.pickerEmpty}>No clients found.</Text>
                ) : (
                  filteredCustomersForPicker.map(c => (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => {
                        setQuickTx(prev => ({
                          ...prev,
                          customerId: c.id,
                          amountPaid: prev.type === 'sale' ? prev.amountPaid : c.pendingAmount,
                        }));
                        setIsCustomerPickerOpen(false);
                        setCustomerSearchQuery('');
                      }}
                      style={styles.pickerItem}
                      activeOpacity={0.7}
                    >
                      <View style={styles.pickerItemAvatar}>
                        <Text style={styles.pickerItemAvatarText}>{getInitial(c.name)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pickerItemName}>{c.name}</Text>
                        <Text style={styles.pickerItemSub}>Outstanding: {RUPEE}{c.pendingAmount}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>

              {showPickerScrollIndicator && (
                <View style={styles.scrollIndicator}>
                  <ChevronDown size={11} color={COLORS.textLightMuted} strokeWidth={3} />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ─── DATE PICKER MODAL ─── */}
      <Modal
        visible={isDatePickerOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDatePickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsDatePickerOpen(false)}
        >
          <TouchableOpacity style={styles.calendarCard} activeOpacity={1} onPress={e => e.stopPropagation()}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={prevMonth} style={styles.calendarNavBtn} activeOpacity={0.7}>
                <ChevronLeft size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
              <Text style={styles.calendarHeaderTitle}>
                {months[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={styles.calendarNavBtn} activeOpacity={0.7}>
                <ChevronRight size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekdaysRow}>
              {weekdays.map((day, idx) => (
                <Text key={idx} style={styles.weekdayText}>{day}</Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {calendarMonthDays.map((day, idx) => {
                if (day === null) return <View key={idx} style={styles.emptyDayCell} />;
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
                    style={[styles.dayCell, isSelected && styles.selectedDayCell, isToday && !isSelected && styles.todayDayCell]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dayText, isSelected && styles.selectedDayText, isToday && !isSelected && styles.todayDayText]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.calendarFooter}>
              <TouchableOpacity
                onPress={() => setIsDatePickerOpen(false)}
                style={[styles.calendarFooterBtn, { backgroundColor: COLORS.bgWarm }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.calendarFooterBtnText, { color: COLORS.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={selectToday}
                style={[styles.calendarFooterBtn, { backgroundColor: COLORS.coral }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.calendarFooterBtnText, { color: COLORS.white }]}>Today</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 12,
  },

  // ── Method tab bar ──
  methodBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgWarm,
    borderRadius: 100,
    padding: 4,
    marginBottom: 20,
    position: 'relative',
  },
  methodIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    backgroundColor: COLORS.coral,
    borderRadius: 100,
  },
  methodTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    zIndex: 1,
  },
  methodTabText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  methodTabTextActive: {
    color: COLORS.white,
  },

  // ── Form card ──
  formCard: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    padding: 0,
    marginBottom: 16,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },

  // ── Section block ──
  sectionBlock: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textLightMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  // ── Value pill badge ──
  valuePill: {
    backgroundColor: 'rgba(36,77,61,0.1)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  valuePillText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.coral,
  },

  // ── Customer picker trigger ──
  customerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSand,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  customerTriggerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarText: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  customerTriggerName: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  customerTriggerSub: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  customerTriggerPlaceholder: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textMuted,
  },

  // ── Transaction type pill segment ──
  typeSegment: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgWarm,
    borderRadius: 100,
    padding: 4,
    position: 'relative',
  },
  typeSegmentIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    backgroundColor: COLORS.coral,
    borderRadius: 100,
  },
  typeSegmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    zIndex: 1,
  },
  typeSegmentText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  typeSegmentTextActive: {
    color: COLORS.white,
  },

  // ── Stepper: one outer box, two inner btns, value in center ──
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: COLORS.bgSand,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    height: 72,
  },
  stepperInnerBtn: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgWarm,
  },
  stepperInnerBtnText: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  stepperDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  stepperValueArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  stepperValueInput: {
    fontFamily: FONTS.sans,
    fontSize: 30,
    fontWeight: 'bold',
    color: COLORS.textDark,
    textAlign: 'center',
    minWidth: 60,
    paddingVertical: 0,
  },
  stepperValueUnit: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    alignSelf: 'flex-end',
    paddingBottom: 8,
  },

  // ── Chip grid ──
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipOutline: {
    backgroundColor: 'transparent',
    borderColor: COLORS.coral,
  },
  chipActiveCoral: {
    backgroundColor: COLORS.coral,
    borderColor: COLORS.coral,
  },
  chipActiveDark: {
    backgroundColor: COLORS.bgDark,
    borderColor: COLORS.bgDark,
  },
  chipActiveRed: {
    backgroundColor: COLORS.red,
    borderColor: COLORS.red,
  },
  chipActiveGreen: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  chipText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  chipTextActive: {
    color: COLORS.white,
  },

  // ── Inline input (custom value) ──
  inlineInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSand,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginTop: 10,
    height: 44,
  },
  inlineInput: {
    flex: 1,
    fontFamily: FONTS.sans,
    fontSize: 15,
    color: COLORS.textDark,
    paddingVertical: 0,
  },
  inlineInputUnit: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },

  // ── Bill summary ──
  billSummaryRow: {
    backgroundColor: 'rgba(36,77,61,0.05)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(36,77,61,0.1)',
  },
  billSummaryText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  billSummaryBig: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  billSummaryDue: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.red,
    fontWeight: '600',
  },

  // ── Fill due button (payment mode) ──
  fillDueButton: {
    marginTop: 10,
    backgroundColor: 'rgba(46,125,50,0.08)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(46,125,50,0.2)',
  },
  fillDueText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.green,
  },

  // ── Meta strip (date + memo) ──
  metaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSand,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 14,
  },
  metaStripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaStripText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  metaStripDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  metaMemoInput: {
    flex: 1,
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textDark,
    paddingVertical: 0,
  },

  // ── Submit button ──
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 0.3,
  },

  aiCard: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    padding: 0,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  aiIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  aiCardTitle: {
    fontFamily: FONTS.serif,
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 6,
    textAlign: 'center',
  },
  aiCardSubtitle: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  aiExample: {
    fontStyle: 'italic',
    color: COLORS.textDark,
  },
  aiTextArea: {
    width: '100%',
    backgroundColor: COLORS.bgSand,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textDark,
    height: 100,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  aiAnalyzeBtn: {
    width: '100%',
    backgroundColor: COLORS.coral,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAnalyzeBtnText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 0.3,
  },

  // ── Scan ──
  scanPreviewBox: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
    marginTop: 8,
  },
  scanPreviewImage: {
    width: '100%',
    height: '100%',
  },
  scanLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLoadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgDark,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scanLoadingText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.green,
    fontWeight: '600',
  },
  scanPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    backgroundColor: COLORS.bgSand,
  },
  scanPlaceholderText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textLightMuted,
  },

  // ── Preview container (AI parsed results) ──
  previewContainer: {
    borderWidth: 1.5,
    borderColor: COLORS.coral,
    backgroundColor: COLORS.bgSand,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
    marginBottom: 12,
  },
  previewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewTitle: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.coral,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 12,
  },
  previewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230,223,216,0.5)',
    paddingBottom: 6,
    marginBottom: 10,
  },
  previewCardNumber: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  deleteCardButton: { padding: 4 },
  previewForm: { marginBottom: 4 },
  metaGrid: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  smallLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  previewInput: {
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 38,
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textDark,
  },
  previewInputToggle: {
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 8,
    height: 38,
  },
  previewToggleText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  inlineBillRow: {
    backgroundColor: 'rgba(36,77,61,0.05)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 4,
  },
  inlineBillText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  confirmSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.green,
    borderRadius: 12,
    paddingVertical: 13,
  },
  confirmSaveButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.white,
  },

  // ── Customer Picker Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  pickerTitle: {
    fontFamily: FONTS.serif,
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  pickerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgWarm,
    borderRadius: 10,
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
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230,223,216,0.4)',
    gap: 10,
  },
  pickerItemAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.bgMintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemAvatarText: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.coral,
  },
  pickerItemName: {
    fontFamily: FONTS.sans,
    fontSize: 13.5,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  pickerItemSub: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  pickerEmpty: {
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
  },

  // ── Date Picker Modal ──
  calendarCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: COLORS.bgSand,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 6,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
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
    padding: 8,
    borderRadius: 10,
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
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  calendarFooterBtnText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: 'bold',
  },
  // ── Realistic Thermal Receipt ──
  receiptContainer: {
    marginVertical: 18,
    marginHorizontal: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  receiptTornEdge: {
    height: 6,
    backgroundColor: 'transparent',
    borderStyle: 'dotted',
    borderWidth: 3,
    borderColor: '#D4CDC1',
    marginBottom: -3,
  },
  receiptTornEdgeBottom: {
    height: 6,
    backgroundColor: 'transparent',
    borderStyle: 'dotted',
    borderWidth: 3,
    borderColor: '#D4CDC1',
    marginTop: -3,
  },
  receiptPaper: {
    backgroundColor: '#FCFAF6',
    borderWidth: 1,
    borderColor: '#EFEAE0',
    borderRadius: 8,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  langPillsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  langPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langPillActive: {
    backgroundColor: COLORS.coral,
    borderColor: COLORS.coral,
  },
  langPillText: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  langPillTextActive: {
    color: COLORS.white,
  },
  businessHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  bizName: {
    fontFamily: FONTS.serif,
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textDark,
    textAlign: 'center',
  },
  bizSub: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.textLightMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  metaTable: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    paddingVertical: 8,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  metaLabel: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textLightMuted,
    fontWeight: 'bold',
  },
  metaValue: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  descriptionSection: {
    marginBottom: 16,
  },
  descTableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  descTableHeaderText: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textLightMuted,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(230, 223, 216, 0.4)',
    paddingBottom: 8,
    marginBottom: 8,
  },
  itemName: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  itemDetails: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: COLORS.textLightMuted,
    marginTop: 2,
  },
  itemTotal: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  pricingSection: {
    alignItems: 'flex-end',
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 4,
  },
  pricingLabel: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textLightMuted,
    fontWeight: '600',
  },
  pricingValue: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  unsettledRow: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    paddingTop: 6,
    marginTop: 4,
  },
  notesBox: {
    backgroundColor: 'rgba(239, 233, 222, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(230, 223, 216, 0.4)',
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  notesText: {
    fontFamily: FONTS.sans,
    fontSize: 10.5,
    fontStyle: 'italic',
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  upiContainer: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    paddingTop: 12,
    alignItems: 'center',
  },
  upiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#efe9de',
    borderWidth: 1,
    borderColor: 'rgba(230, 223, 216, 0.5)',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  upiText: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  upiId: {
    color: COLORS.coral,
  },
  qrCodeSection: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    marginVertical: 10,
  },
  qrCodeImage: {
    width: 140,
    height: 140,
  },
  qrCodeText: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginTop: 6,
    textAlign: 'center',
  },
  bizNameFooter: {
    fontFamily: FONTS.serif,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginTop: 4,
  },
  // Action operations footer inside Record Entry tab
  actionFooter: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
    alignItems: 'center',
  },
  ttsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButton: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  printButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serratedHeader: {
    height: 8,
    backgroundColor: COLORS.bgDark,
    flexDirection: 'row',
    justifyContent: 'space-around',
    overflow: 'hidden',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  serratedTriangle: {
    width: 12,
    height: 12,
    backgroundColor: '#FCFAF6', // matching receiptPaper background color!
    transform: [{ rotate: '45deg' }, { translateY: 4 }],
  },
  receiptItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  receiptItemCell: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: '#3C3A35',
  },
  receiptCellBold: {
    fontWeight: 'bold',
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  receiptTotalLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6E6C64',
  },
  receiptTotalVal: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3C3A35',
  },
  receiptFinalLabel: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1A1813',
  },
  receiptFinalVal: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#B23A3A',
  },
  receiptFooter: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    color: '#8C8A82',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  // Rubber Stamp Style
  stampWrapper: {
    position: 'absolute',
    right: 15,
    bottom: 50, // shifted slightly to clear the action footer
    zIndex: 10,
  },
  stampContainer: {
    borderWidth: 2,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    transform: [{ rotate: '-12deg' }],
    backgroundColor: 'rgba(252, 250, 246, 0.9)',
    borderStyle: 'dashed',
  },
  stampPaid: {
    borderColor: '#2E7D32',
  },
  stampPartial: {
    borderColor: '#E65100',
  },
  stampUnpaid: {
    borderColor: '#C62828',
  },
  stampText: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  stampTextPaid: {
    color: '#2E7D32',
  },
  stampTextPartial: {
    color: '#E65100',
  },
  stampTextUnpaid: {
    color: '#C62828',
  },
});
