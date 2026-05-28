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
  Image 
} from 'react-native';
import { Keyboard, Mic, Camera, X, Edit2, ChevronDown, Check, Search, Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { COLORS, FONTS } from '../theme';
import { Customer, QuickTxState, ParsedPreviewState } from '../types';
import { AnimatedItem } from './AnimatedList';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface QuickRecordTabProps {
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

  // Date picker states
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());

  // Parse date from quickTx.date or fallback to today
  const parsedDate = useMemo(() => {
    if (!quickTx.date) return new Date();
    const parts = quickTx.date.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d;
      }
    }
    const d = new Date(quickTx.date);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [quickTx.date]);

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

  // Computations
  const computedTotalBill = useMemo(() => {
    if (quickTx.type !== 'sale') return 0;
    return Math.round(quickTx.quantityKg * quickTx.ratePerKg);
  }, [quickTx.type, quickTx.quantityKg, quickTx.ratePerKg]);

  const computedLeftoverDues = useMemo(() => {
    if (quickTx.type !== 'sale') return 0;
    return Math.max(0, computedTotalBill - quickTx.amountPaid);
  }, [quickTx.type, computedTotalBill, quickTx.amountPaid]);

  const selectedCustomer = customers.find(c => c.id === quickTx.customerId);

  const adjustQuantity = (val: number) => {
    setQuickTx(prev => {
      const nextQty = Math.max(0.01, prev.quantityKg + val);
      return {
        ...prev,
        quantityKg: nextQty,
        amountPaid: prev.type === 'sale' ? Math.round(nextQty * prev.ratePerKg) : prev.amountPaid
      };
    });
  };

  const setFixedQuantity = (val: number) => {
    setShowCustomWeight(false);
    setQuickTx(prev => ({
      ...prev,
      quantityKg: val,
      amountPaid: prev.type === 'sale' ? Math.round(val * prev.ratePerKg) : prev.amountPaid
    }));
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      scrollEnabled={!isCustomerPickerOpen}
    >
      


      {/* 1. ENTRY METHOD TOP ROW BUTTONS */}
      <View style={styles.methodToggleRow}>
        <TouchableOpacity
          onPress={() => setRecordMethod('manual')}
          style={[styles.methodButton, recordMethod === 'manual' && styles.methodButtonActive]}
          activeOpacity={0.8}
        >
          <Keyboard size={16} color={recordMethod === 'manual' ? COLORS.white : COLORS.coral} />
          <Text style={[styles.methodButtonText, recordMethod === 'manual' && styles.methodButtonTextActive]}>
            Form
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setRecordMethod('voice')}
          style={[styles.methodButton, recordMethod === 'voice' && styles.methodButtonActive]}
          activeOpacity={0.8}
        >
          <Mic size={16} color={recordMethod === 'voice' ? COLORS.white : COLORS.coral} />
          <Text style={[styles.methodButtonText, recordMethod === 'voice' && styles.methodButtonTextActive]}>
            Voice AI
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setRecordMethod('scan')}
          style={[styles.methodButton, recordMethod === 'scan' && styles.methodButtonActive]}
          activeOpacity={0.8}
        >
          <Camera size={16} color={recordMethod === 'scan' ? COLORS.white : COLORS.coral} />
          <Text style={[styles.methodButtonText, recordMethod === 'scan' && styles.methodButtonTextActive]}>
            Paper Scan
          </Text>
        </TouchableOpacity>
      </View>

      {/* ================= METHOD A: MANUAL RECORD FORM ================= */}
      {recordMethod === 'manual' && !parsedPreviewList && (
        <View style={styles.formContainer}>
          {/* Target Customer Dropdown with custom modal picker */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Deliver Ghee To *</Text>
            <View>
              <TouchableOpacity
                onPress={() => setIsCustomerPickerOpen(true)}
                style={styles.pickerTrigger}
                activeOpacity={0.8}
              >
                <Text style={styles.pickerTriggerText}>
                  {selectedCustomer 
                    ? `${selectedCustomer.name} (Outstanding: ₹${selectedCustomer.pendingAmount})`
                    : '-- Choose registered customer --'
                  }
                </Text>
                <ChevronDown size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Operation Mode segment */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Select Operation Mode</Text>
            <View style={styles.segmentContainer}>
              <TouchableOpacity
                onPress={() => setQuickTx(prev => ({
                  ...prev,
                  type: 'sale',
                  amountPaid: 0
                }))}
                style={[styles.segmentButton, quickTx.type === 'sale' && styles.segmentButtonActiveCoral]}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, quickTx.type === 'sale' && styles.segmentTextActive]}>
                  Dispatch Ghee
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setQuickTx(prev => ({
                  ...prev,
                  type: 'payment',
                  amountPaid: selectedCustomer ? selectedCustomer.pendingAmount : 0
                }))}
                style={[styles.segmentButton, quickTx.type === 'payment' && styles.segmentButtonActiveGreen]}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, quickTx.type === 'payment' && styles.segmentTextActive]}>
                  Receive Cash
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {quickTx.type === 'sale' ? (
            <>
              {/* Weight selection presets & adjustments */}
              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Weight (kg / Liters)</Text>
                  <View style={styles.valueBadgeCoral}>
                    <Text style={styles.valueBadgeCoralText}>{quickTx.quantityKg} kg</Text>
                  </View>
                </View>

                {/* Weights preset row */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.presetsScroll}
                  contentContainerStyle={styles.presetsScrollContent}
                >
                  {weightPresets.map((val) => (
                    <TouchableOpacity
                      key={val}
                      onPress={() => setFixedQuantity(val)}
                      style={[
                        styles.presetButton,
                        quickTx.quantityKg === val && !showCustomWeight && styles.presetButtonActive
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.presetButtonText,
                        quickTx.quantityKg === val && !showCustomWeight && styles.presetButtonTextActive
                      ]}>
                        {val} kg
                      </Text>
                    </TouchableOpacity>
                  ))}
                  
                  <TouchableOpacity
                    onPress={() => setShowCustomWeight(!showCustomWeight)}
                    style={[styles.presetButtonCustom, showCustomWeight && styles.presetButtonCustomActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.presetButtonCustomText, showCustomWeight && styles.presetButtonCustomTextActive]}>
                      Custom
                    </Text>
                  </TouchableOpacity>
                </ScrollView>

                {/* Custom weight numeric input */}
                {showCustomWeight && (
                  <View style={styles.customInputContainer}>
                    <Text style={styles.customInputLabel}>Enter Custom Ghee Weight (kg)</Text>
                    <View style={styles.inputUnitWrapper}>
                      <TextInput
                        keyboardType="numeric"
                        value={quickTx.quantityKg.toString()}
                        onChangeText={(text) => setQuickTx(prev => ({
                          ...prev,
                          quantityKg: Math.max(0.01, parseFloat(text) || 0),
                          amountPaid: prev.type === 'sale' ? Math.round(Math.max(0.01, parseFloat(text) || 0) * prev.ratePerKg) : prev.amountPaid
                        }))}
                        style={styles.customTextInput}
                      />
                      <Text style={styles.inputUnit}>kg</Text>
                    </View>
                  </View>
                )}

                {/* Steppers */}
                <View style={styles.stepperRow}>
                  <TouchableOpacity 
                    onPress={() => adjustQuantity(-0.5)}
                    style={styles.stepperButton}
                  >
                    <Text style={styles.stepperText}>- 0.5 kg</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => adjustQuantity(0.5)}
                    style={styles.stepperButton}
                  >
                    <Text style={styles.stepperText}>+ 0.5 kg</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Rate presets */}
              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Rate per kg</Text>
                  <Text style={styles.subText}>₹{quickTx.ratePerKg} / kg</Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.presetsScroll}
                  contentContainerStyle={styles.presetsScrollContent}
                >
                  {ratePresets.map((rate) => (
                    <TouchableOpacity
                      key={rate}
                      onPress={() => {
                        setShowCustomRate(false);
                        setQuickTx(prev => ({
                          ...prev,
                          ratePerKg: rate,
                          amountPaid: prev.type === 'sale' ? Math.round(prev.quantityKg * rate) : prev.amountPaid
                        }));
                      }}
                      style={[
                        styles.presetButton,
                        quickTx.ratePerKg === rate && !showCustomRate && styles.presetButtonActiveDark
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.presetButtonText,
                        quickTx.ratePerKg === rate && !showCustomRate && styles.presetButtonTextActive
                      ]}>
                        ₹{rate}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    onPress={() => setShowCustomRate(!showCustomRate)}
                    style={[styles.presetButtonCustom, showCustomRate && styles.presetButtonCustomActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.presetButtonCustomText, showCustomRate && styles.presetButtonCustomTextActive]}>
                      Custom
                    </Text>
                  </TouchableOpacity>
                </ScrollView>

                {showCustomRate && (
                  <View style={styles.customInputContainer}>
                    <Text style={styles.customInputLabel}>Custom Rate (₹ per kg)</Text>
                    <TextInput
                      keyboardType="number-pad"
                      value={quickTx.ratePerKg.toString()}
                      onChangeText={(text) => setQuickTx(prev => {
                        const parsedRate = parseFloat(text) || 0;
                        return {
                          ...prev,
                          ratePerKg: parsedRate,
                          amountPaid: prev.type === 'sale' ? Math.round(prev.quantityKg * parsedRate) : prev.amountPaid
                        };
                      })}
                      style={styles.customTextInput}
                    />
                  </View>
                )}
              </View>

              {/* Bill dynamic preview */}
              <View style={styles.billPreviewBox}>
                <View style={styles.billPreviewRow}>
                  <Text style={styles.billPreviewLabel}>Calculated Bill:</Text>
                  <Text style={styles.billPreviewVal}>₹{computedTotalBill}</Text>
                </View>
                {computedLeftoverDues > 0 && (
                  <View style={[styles.billPreviewRow, { marginTop: 6 }]}>
                    <Text style={[styles.billPreviewLabel, { color: COLORS.red }]}>Pending Addition:</Text>
                    <Text style={[styles.billPreviewVal, { color: COLORS.red }]}>₹{computedLeftoverDues}</Text>
                  </View>
                )}
              </View>

              {/* Amount paid instantly shortcuts */}
              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Amount Paid Instantly (₹)</Text>
                  <View style={styles.valueBadgeGreen}>
                    <Text style={styles.valueBadgeGreenText}>₹{quickTx.amountPaid}</Text>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.presetsScroll}
                  contentContainerStyle={styles.presetsScrollContent}
                >
                  <TouchableOpacity
                    onPress={() => { setShowCustomAmount(false); setQuickTx(prev => ({ ...prev, amountPaid: 0 })); }}
                    style={[styles.presetButton, quickTx.amountPaid === 0 && !showCustomAmount && styles.presetButtonActiveRed]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.presetButtonText, quickTx.amountPaid === 0 && !showCustomAmount && styles.presetButtonTextActive]}>
                      Unpaid
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => { setShowCustomAmount(false); setQuickTx(prev => ({ ...prev, amountPaid: computedTotalBill })); }}
                    style={[styles.presetButton, quickTx.amountPaid === computedTotalBill && !showCustomAmount && styles.presetButtonActiveGreen]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.presetButtonText, quickTx.amountPaid === computedTotalBill && !showCustomAmount && styles.presetButtonTextActive]}>
                      Fully Paid
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => { setShowCustomAmount(false); setQuickTx(prev => ({ ...prev, amountPaid: Math.round(computedTotalBill / 2) })); }}
                    style={[styles.presetButton, quickTx.amountPaid === Math.round(computedTotalBill / 2) && !showCustomAmount && styles.presetButtonActiveDark]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.presetButtonText, quickTx.amountPaid === Math.round(computedTotalBill / 2) && !showCustomAmount && styles.presetButtonTextActive]}>
                      50% Paid
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowCustomAmount(!showCustomAmount)}
                    style={[styles.presetButtonCustom, showCustomAmount && styles.presetButtonCustomActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.presetButtonCustomText, showCustomAmount && styles.presetButtonCustomTextActive]}>
                      Custom
                    </Text>
                  </TouchableOpacity>
                </ScrollView>

                {showCustomAmount && (
                  <View style={styles.customInputContainer}>
                    <Text style={styles.customInputLabel}>Enter Custom Paid Cash (₹)</Text>
                    <TextInput
                      keyboardType="number-pad"
                      value={quickTx.amountPaid.toString()}
                      onChangeText={(text) => setQuickTx(prev => ({ ...prev, amountPaid: parseFloat(text) || 0 }))}
                      style={styles.customTextInput}
                    />
                  </View>
                )}
              </View>
            </>
          ) : (
            /* PAYMENT MODE */
            <View style={styles.formGroup}>
              <Text style={styles.label}>Cash Amount Received (₹)</Text>
              <TextInput
                keyboardType="number-pad"
                value={quickTx.amountPaid.toString()}
                onChangeText={(text) => setQuickTx(prev => ({ ...prev, amountPaid: parseFloat(text) || 0 }))}
                style={styles.textInputStyle}
              />
            </View>
          )}

          {/* Date & notes */}
          <View style={styles.metaGrid}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.smallLabel}>Log Date</Text>
              <TouchableOpacity
                onPress={() => {
                  setCurrentCalendarDate(parsedDate);
                  setIsDatePickerOpen(true);
                }}
                style={styles.datePickerTrigger}
                activeOpacity={0.7}
              >
                <Calendar size={14} color={COLORS.coral} style={{ marginRight: 6 }} />
                <Text style={styles.datePickerTriggerText}>{quickTx.date}</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.smallLabel}>Dispatch Memo</Text>
              <TextInput
                value={quickTx.notes}
                onChangeText={(text) => setQuickTx(prev => ({ ...prev, notes: text }))}
                placeholder="UPI, Cash, etc."
                placeholderTextColor={COLORS.textLightMuted}
                style={styles.smallTextInputStyle}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={commitQuickTransaction}
            style={styles.submitButton}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>Commit Ledger Record</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ================= METHOD B: VOICE ASSIST RECORDER ================= */}
      {recordMethod === 'voice' && !parsedPreviewList && (
        <View style={styles.voiceSection}>
          <View style={styles.voiceVisualizerCard}>
            <View style={styles.voiceTextContainer}>
              <Text style={styles.voiceHeadline}>Voice Dictation Parser</Text>
              <Text style={styles.voiceSubHeadline}>
                Use your keyboard microphone or type below:{"\n"}
                e.g. <Text style={styles.italicText}>"Rajesh Kumar took 5 kg ghee and paid 3000 rupees"</Text> or <Text style={styles.italicText}>"Meenakshi Iyer cleared 1500 rupees dues"</Text>
              </Text>
            </View>

            <TextInput
              multiline
              numberOfLines={4}
              value={speechResultText}
              onChangeText={setSpeechResultText}
              placeholder="Tap here and dictate or type your statement..."
              placeholderTextColor={COLORS.textLightMuted}
              style={styles.voiceDictationInput}
            />

            <TouchableOpacity
              onPress={() => {
                if (speechResultText.trim() === '') {
                  triggerNotification('Please enter or dictate a statement first.', 'error');
                  return;
                }
                handleVoiceProcessing(speechResultText);
              }}
              style={styles.voiceAnalyzeButton}
              activeOpacity={0.8}
              disabled={isAiProcessing}
            >
              {isAiProcessing ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.voiceAnalyzeButtonText}>Analyze Dictation with Gemini</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ================= METHOD C: PAPER DOCUMENT SCANNER ================= */}
      {recordMethod === 'scan' && !parsedPreviewList && (
        <View style={styles.voiceSection}>
          <View style={[styles.voiceVisualizerCard, { backgroundColor: COLORS.bgWarm }]}>
            <TouchableOpacity
              onPress={handleOCRFileSelection}
              style={[styles.micButton, { backgroundColor: COLORS.green }]}
              activeOpacity={0.8}
            >
              <Camera size={28} color={COLORS.white} />
            </TouchableOpacity>

            <View style={styles.voiceTextContainer}>
              <Text style={styles.voiceHeadline}>Scan handwritten ledger / note</Text>
              <Text style={styles.voiceSubHeadline}>
                Snap a photo of your hand-written delivery book notes or receipts to digitize and save automatically using Gemini AI.
              </Text>
            </View>
          </View>

          {scanPreviewImage && (
            <View style={styles.scanPreviewBox}>
              <Image 
                source={{ uri: scanPreviewImage }} 
                style={styles.scanPreviewImageStyle} 
                resizeMode="cover"
              />
              {isScanningImage && (
                <View style={styles.scanLoadingOverlay}>
                  <View style={styles.scanLoadingBadge}>
                    <ActivityIndicator size="small" color={COLORS.green} style={{ marginRight: 8 }} />
                    <Text style={styles.scanLoadingText}>Reading handwritten values...</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* ================= EDITABLE REAL-TIME PREVIEW CONFIRMATION COMPONENT ================= */}
      {parsedPreviewList && parsedPreviewList.length > 0 && (
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <View style={styles.previewTitleRow}>
              <Edit2 size={14} color={COLORS.coral} style={{ marginRight: 6 }} />
              <Text style={styles.previewTitle}>Confirm Extracted Records ({parsedPreviewList.length})</Text>
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
                          onChangeText={(text) => updateParsedPreviewItem(index, { customerName: text })}
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
                            onChangeText={(text) => updateParsedPreviewItem(index, { quantityKg: parseFloat(text) || 0 })}
                            style={styles.previewInput}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.smallLabel}>Rate (₹/kg)</Text>
                          <TextInput
                            keyboardType="numeric"
                            value={item.ratePerKg.toString()}
                            onChangeText={(text) => updateParsedPreviewItem(index, { ratePerKg: parseFloat(text) || 0 })}
                            style={styles.previewInput}
                          />
                        </View>
                      </View>
                    )}

                    <View style={styles.metaGrid}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.smallLabel}>Amount Paid (₹)</Text>
                        <TextInput
                          keyboardType="numeric"
                          value={item.amountPaid.toString()}
                          onChangeText={(text) => updateParsedPreviewItem(index, { amountPaid: parseInt(text) || 0 })}
                          style={[styles.previewInput, { color: COLORS.green, fontWeight: 'bold' }]}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.smallLabel}>Memo/Notes</Text>
                        <TextInput
                          value={item.notes || ''}
                          onChangeText={(text) => updateParsedPreviewItem(index, { notes: text })}
                          style={styles.previewInput}
                        />
                      </View>
                    </View>

                    {item.type === 'sale' && (
                      <View style={styles.billPreviewBox}>
                        <View style={styles.billPreviewRow}>
                          <Text style={styles.billPreviewLabel}>Total Bill:</Text>
                          <Text style={styles.billPreviewVal}>₹{bill}</Text>
                        </View>
                        <View style={[styles.billPreviewRow, { marginTop: 4 }]}>
                          <Text style={[styles.billPreviewLabel, { color: COLORS.red }]}>Dues Addition:</Text>
                          <Text style={[styles.billPreviewVal, { color: COLORS.red }]}>
                            ₹{dueAddition}
                          </Text>
                        </View>
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
                <TouchableOpacity
                  onPress={() => {
                    setQuickTx(prev => ({ ...prev, customerId: '' }));
                    setIsCustomerPickerOpen(false);
                    setCustomerSearchQuery('');
                  }}
                  style={styles.pickerModalItem}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pickerModalItemText, { color: COLORS.textMuted }]}>
                    -- None / Choose registered customer --
                  </Text>
                </TouchableOpacity>

                {filteredCustomersForPicker.length === 0 ? (
                  <Text style={styles.pickerModalEmptyText}>No clients found.</Text>
                ) : (
                  filteredCustomersForPicker.map(c => (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => {
                        setQuickTx(prev => ({
                          ...prev,
                          customerId: c.id,
                          amountPaid: prev.type === 'sale' ? prev.amountPaid : c.pendingAmount
                        }));
                        setIsCustomerPickerOpen(false);
                        setCustomerSearchQuery('');
                      }}
                      style={styles.pickerModalItem}
                      activeOpacity={0.7}
                    >
                      <View style={styles.pickerModalItemRow}>
                        <Text style={styles.pickerModalItemText}>{c.name}</Text>
                        <Text style={styles.pickerModalItemSubText}>
                          Outstanding: ₹{c.pendingAmount}
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
        onRequestClose={() => setIsDatePickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.calendarOverlay}
          activeOpacity={1}
          onPress={() => setIsDatePickerOpen(false)}
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
                onPress={() => setIsDatePickerOpen(false)}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  methodToggleRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgWarm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 4,
    marginBottom: 16,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
  },
  methodButtonActive: {
    backgroundColor: COLORS.coral,
  },
  methodButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.coral,
    marginLeft: 6,
  },
  methodButtonTextActive: {
    color: COLORS.white,
  },
  formContainer: {
    paddingBottom: 20,
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  subText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 46,
  },
  pickerTriggerText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgWarm,
    borderRadius: 6,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 5,
  },
  segmentButtonActiveCoral: {
    backgroundColor: COLORS.coral,
  },
  segmentButtonActiveGreen: {
    backgroundColor: COLORS.green,
  },
  segmentText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  segmentTextActive: {
    color: COLORS.white,
  },
  valueBadgeCoral: {
    backgroundColor: 'rgba(204, 120, 92, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  valueBadgeCoralText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.coral,
  },
  valueBadgeGreen: {
    backgroundColor: 'rgba(93, 184, 114, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  valueBadgeGreenText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.green,
  },
  presetsScroll: {
    marginBottom: 8,
  },
  presetsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  presetButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    minWidth: 80,
  },
  presetButtonActive: {
    backgroundColor: COLORS.coral,
    borderColor: COLORS.coral,
  },
  presetButtonActiveDark: {
    backgroundColor: COLORS.bgDark,
    borderColor: COLORS.bgDark,
  },
  presetButtonActiveRed: {
    backgroundColor: COLORS.red,
    borderColor: COLORS.red,
  },
  presetButtonActiveGreen: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  presetButtonCustom: {
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: 'rgba(204, 120, 92, 0.3)',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  presetButtonCustomActive: {
    backgroundColor: COLORS.bgDark,
    borderColor: COLORS.bgDark,
  },
  presetButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  presetButtonTextActive: {
    color: COLORS.white,
  },
  presetButtonCustomText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.coral,
  },
  presetButtonCustomTextActive: {
    color: COLORS.bgSand,
  },
  customInputContainer: {
    marginBottom: 10,
    padding: 12,
    backgroundColor: 'rgba(239, 233, 222, 0.55)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
  },
  customInputLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputUnitWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 12,
  },
  customTextInput: {
    flex: 1,
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textDark,
    height: 38,
  },
  inputUnit: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLightMuted,
    marginLeft: 6,
  },
  stepperRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  stepperButton: {
    flex: 1,
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 6,
  },
  stepperText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  billPreviewBox: {
    backgroundColor: COLORS.bgWarm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 14,
  },
  billPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  billPreviewLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  billPreviewVal: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  textInputStyle: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 46,
    fontFamily: FONTS.sans,
    fontSize: 14,
    color: COLORS.textDark,
  },
  metaGrid: {
    flexDirection: 'row',
    marginVertical: 4,
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
  smallTextInputStyle: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 38,
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textDark,
  },
  submitButton: {
    backgroundColor: COLORS.coral,
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  voiceSection: {
    paddingBottom: 20,
  },
  voiceVisualizerCard: {
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  voiceDictationInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    width: '100%',
    height: 90,
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textDark,
    textAlignVertical: 'top',
  },
  voiceAnalyzeButton: {
    backgroundColor: COLORS.coral,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    width: '100%',
  },
  voiceAnalyzeButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  micButtonContainer: {
    position: 'relative',
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  voicePulseCircle: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.coral,
    opacity: 0.3,
    transform: [{ scale: 1.4 }],
  },
  micButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.coral,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  micButtonActive: {
    backgroundColor: COLORS.red,
  },
  voiceTextContainer: {
    alignItems: 'center',
  },
  voiceHeadline: {
    fontFamily: FONTS.serif,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 4,
  },
  voiceSubHeadline: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: '90%',
  },
  italicText: {
    fontStyle: 'italic',
    color: COLORS.textDark,
  },
  speechResultBox: {
    backgroundColor: 'rgba(239, 233, 222, 0.5)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 12,
    marginBottom: 14,
  },
  speechResultLabel: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  speechResultText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontStyle: 'italic',
    color: COLORS.textDark,
  },
  aiLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  aiLoadingText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  scanPreviewBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    overflow: 'hidden',
    height: 180,
    backgroundColor: 'rgba(0,0,0,0.05)',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanPreviewImageStyle: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  scanMockImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanMockText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.textLightMuted,
  },
  scanLoadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLoadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgDark,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#252320',
  },
  scanLoadingText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.green,
    fontWeight: '600',
  },
  previewContainer: {
    borderWidth: 2,
    borderColor: COLORS.coral,
    backgroundColor: COLORS.bgSand,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
    marginBottom: 12,
  },
  previewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewTitle: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.coral,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewForm: {
    marginBottom: 12,
  },
  previewInput: {
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
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
    borderRadius: 4,
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
  confirmSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.green,
    borderRadius: 6,
    paddingVertical: 12,
  },
  confirmSaveButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  // Inline Dropdown styles
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
  previewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 16,
    elevation: 1,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  previewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230, 223, 216, 0.5)',
    paddingBottom: 6,
    marginBottom: 10,
  },
  previewCardNumber: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  deleteCardButton: {
    padding: 4,
  },
  datePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 38,
  },
  datePickerTriggerText: {
    fontFamily: FONTS.sans,
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
