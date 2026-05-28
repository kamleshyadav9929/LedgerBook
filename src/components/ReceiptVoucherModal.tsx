import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Modal, 
  Share,
  ActivityIndicator,
  Image,
  ScrollView
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { X, QrCode, Copy, Volume2, Share2, Printer } from 'lucide-react-native';
import { COLORS, FONTS } from '../theme';
import { Transaction, Customer } from '../types';
import * as Speech from 'expo-speech';
import * as Print from 'expo-print';

interface ReceiptVoucherModalProps {
  txId: string | null;
  onClose: () => void;
  transactions: Transaction[];
  customers: Customer[];
  businessName: string;
  upiId: string;
  triggerNotification: (msg: string, type?: 'success' | 'error') => void;
}

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
    ttsPayment: (biz: string, paid: number, name: string) => 
      `Hello! This is a payment receipt from ${biz}. We successfully recorded a payment of Rupees ${paid} from ${name}. Thank you.`
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
    ttsPayment: (biz: string, paid: number, name: string) => 
      `नमस्ते! यह ${biz} की तरफ से भुगतान रसीद है। हमने ${name} से ${paid} रुपये का भुगतान दर्ज कर लिया है। धन्यवाद।`
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
    ttsPayment: (biz: string, paid: number, name: string) => 
      `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਇਹ ${biz} ਵੱਲੋਂ ਭੁਗਤਾਨ ਰਸੀਦ ਹੈ। ਅਸੀਂ ${name} ਤੋਂ ${paid} ਰੁਪਏ ਦਾ ਭੁਗਤਾਨ ਸਫਲਤਾਪੂਰਵਕ ਦਰਜ ਕਰ ਲਿਆ ਹੈ। ਧੰਨਵਾਦ।`
  }
};

export default function ReceiptVoucherModal({
  txId,
  onClose,
  transactions,
  customers,
  businessName,
  upiId,
  triggerNotification,
}: ReceiptVoucherModalProps) {

  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'pa'>('en');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Stop speaking on unmount
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  if (!txId) return null;

  const tx = transactions.find(t => t.id === txId);
  if (!tx) return null;

  const isSale = tx.type === 'sale';
  const unsettled = isSale ? Math.max(0, tx.totalAmount - tx.amountPaid) : 0;

  // Calculate chronological running balance of the customer up to this transaction
  const customerTxs = transactions.filter(t => t.customerId === tx.customerId);
  const sortedCustomerTxs = [...customerTxs].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    const indexA = transactions.findIndex(t => t.id === a.id);
    const indexB = transactions.findIndex(t => t.id === b.id);
    return indexA - indexB; // higher index = older item in newest-first array, so ascending sort puts older first
  });

  let runningBalance = 0;
  for (const t of sortedCustomerTxs) {
    const change = t.type === 'sale' ? (t.totalAmount - t.amountPaid) : -t.amountPaid;
    runningBalance += change;
    if (t.id === tx.id) {
      break;
    }
  }

  const upiAmount = isSale ? unsettled : (runningBalance > 0 ? runningBalance : 0);
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(businessName)}&am=${upiAmount}&cu=INR&tn=${encodeURIComponent('Voucher ' + tx.id)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;

  const dict = labels[selectedLanguage];

  const handleCopySummary = () => {
    let text = '';
    if (isSale) {
      text = `${businessName} ${dict.title}\n-----------------------\n` +
             `${dict.receiver} ${tx.customerName}\n` +
             `${dict.timestamp} ${tx.date}\n` +
             `${dict.description}: ${dict.ghee}\n` +
             `Quantity: ${tx.quantityKg} kg @ ₹${tx.ratePerKg}/kg\n` +
             `${dict.subtotal} ₹${tx.totalAmount}\n` +
             `${dict.paid} ₹${tx.amountPaid}\n` +
             `${dict.unsettled} ₹${unsettled}\n` +
             `${dict.totalDues} ₹${runningBalance}\n-----------------------\n` +
             `${dict.payDirect} ${upiId}\nThank you!`;
    } else {
      text = `${businessName} Payment Receipt\n-----------------------\n` +
             `${dict.receiver} ${tx.customerName}\n` +
             `${dict.timestamp} ${tx.date}\n` +
             `${dict.cashReceived}: ₹${tx.amountPaid}\n` +
             `${dict.remainingBalance} ₹${runningBalance > 0 ? runningBalance : 0}\n-----------------------\n` +
             `${dict.payDirect} ${upiId}\nThank you!`;
    }
    Clipboard.setStringAsync(text);
    triggerNotification('Receipt text copied!');
  };

  const handleShareSummary = async () => {
    try {
      let text = '';
      if (isSale) {
        text = `${businessName} ${dict.title}\n` +
               `Client: ${tx.customerName}\n` +
               `Date: ${tx.date}\n` +
               `Qty: ${tx.quantityKg} kg @ ₹${tx.ratePerKg}/kg\n` +
               `Total: ₹${tx.totalAmount}\n` +
               `Paid: ₹${tx.amountPaid}\n` +
               `Dues: ₹${runningBalance}\n` +
               `UPI: ${upiId}`;
      } else {
        text = `${businessName} Payment Receipt\n` +
               `Client: ${tx.customerName}\n` +
               `Date: ${tx.date}\n` +
               `Received: ₹${tx.amountPaid}\n` +
               `Remaining Dues: ₹${runningBalance > 0 ? runningBalance : 0}\n` +
               `UPI: ${upiId}`;
      }
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
    .payment-receipt {
      text-align: center;
      padding: 16px 0;
    }
    .payment-receipt-label {
      font-size: 11px;
      font-weight: bold;
      color: #8e8b82;
      letter-spacing: 1px;
    }
    .payment-receipt-val {
      font-family: Georgia, serif;
      font-size: 32px;
      font-weight: bold;
      color: #5db872;
      margin: 8px 0;
    }
    .payment-receipt-sub {
      font-size: 13px;
      color: #6c6a64;
      font-weight: 600;
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
        <span class="meta-value">${tx.id}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">${dict.timestamp}</span>
        <span class="meta-value">${tx.date}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">${dict.receiver}</span>
        <span class="meta-value">${tx.customerName}</span>
      </div>
    </div>

    <div class="description-section">
      ${isSale ? `
        <div class="table-header">
          <span>${dict.description}</span>
          <span>${dict.total}</span>
        </div>
        <div class="item-row">
          <div>
            <div class="item-name">${dict.ghee}</div>
            <div class="item-details">${tx.quantityKg} kg @ ₹${tx.ratePerKg}/kg</div>
          </div>
          <span class="item-total">₹${tx.totalAmount}</span>
        </div>
        <div class="pricing-section">
          <div class="pricing-row">
            <span class="pricing-label">${dict.subtotal}</span>
            <span class="pricing-value">₹${tx.totalAmount}</span>
          </div>
          <div class="pricing-row text-green">
            <span class="pricing-label text-green">${dict.paid}</span>
            <span class="pricing-value">₹${tx.amountPaid}</span>
          </div>
          <div class="pricing-row unsettled-row text-red">
            <span class="pricing-label text-red">${dict.unsettled}</span>
            <span class="pricing-value">₹${unsettled}</span>
          </div>
          ${runningBalance > unsettled ? `
            <div class="pricing-row text-red" style="font-weight: bold; font-size: 13px; border-top: 1px dashed #e6dfd8; padding-top: 6px; margin-top: 6px;">
              <span>${dict.totalDues}</span>
              <span>₹${runningBalance}</span>
            </div>
          ` : ''}
        </div>
      ` : `
        <div class="payment-receipt">
          <div class="payment-receipt-label">${dict.cashReceived}</div>
          <div class="payment-receipt-val">₹${tx.amountPaid}</div>
          ${runningBalance > 0 ? `
            <div class="remaining-dues">
              <span>${dict.remainingBalance}</span>
              <span>₹${runningBalance}</span>
            </div>
            <div class="payment-receipt-sub">${dict.gratitude}</div>
          ` : `
            <div class="payment-receipt-sub">${dict.allSettled}</div>
          `}
        </div>
      `}
    </div>

    ${tx.notes ? `
      <div class="notes-box">
        * "${tx.notes}"
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

    const speakText = isSale 
      ? dict.ttsSales(businessName, tx.quantityKg, tx.customerName, tx.totalAmount, tx.amountPaid)
      : dict.ttsPayment(businessName, tx.amountPaid, tx.customerName);

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

  return (
    <Modal
      visible={!!txId}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          
          {/* Top black serrated edge representation */}
          <View style={styles.serratedHeader}>
            {Array.from({ length: 15 }).map((_, i) => (
              <View key={i} style={styles.serratedTriangle} />
            ))}
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.8}>
            <X size={16} color={COLORS.white} />
          </TouchableOpacity>

          {/* Scrollable invoice body wrapper to prevent screen overflow */}
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {/* Invoice body container */}
            <View style={styles.voucherBody}>
              
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
                  <Text style={styles.metaValue}>{tx.id}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{dict.timestamp}</Text>
                  <Text style={styles.metaValue}>{tx.date}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{dict.receiver}</Text>
                  <Text style={styles.metaValue}>{tx.customerName}</Text>
                </View>
              </View>

              {/* Description Grid */}
              <View style={styles.descriptionSection}>
                {isSale ? (
                  <>
                    <View style={styles.descTableHeader}>
                      <Text style={styles.descTableHeaderText}>{dict.description}</Text>
                      <Text style={styles.descTableHeaderText}>{dict.total}</Text>
                    </View>

                    <View style={styles.itemRow}>
                      <View>
                        <Text style={styles.itemName}>{dict.ghee}</Text>
                        <Text style={styles.itemDetails}>{tx.quantityKg} kg @ ₹{tx.ratePerKg}/kg</Text>
                      </View>
                      <Text style={styles.itemTotal}>₹{tx.totalAmount}</Text>
                    </View>

                    <View style={styles.pricingSection}>
                      <View style={styles.pricingRow}>
                        <Text style={styles.pricingLabel}>{dict.subtotal}</Text>
                        <Text style={styles.pricingValue}>₹{tx.totalAmount}</Text>
                      </View>
                      <View style={styles.pricingRow}>
                        <Text style={[styles.pricingLabel, { color: COLORS.green }]}>{dict.paid}</Text>
                        <Text style={[styles.pricingValue, { color: COLORS.green, fontWeight: 'bold' }]}>₹{tx.amountPaid}</Text>
                      </View>
                      <View style={[styles.pricingRow, styles.unsettledRow]}>
                        <Text style={[styles.pricingLabel, { color: COLORS.red, fontWeight: 'bold' }]}>{dict.unsettled}</Text>
                        <Text style={[styles.pricingValue, { color: COLORS.red, fontWeight: 'bold', fontSize: 13 }]}>₹{unsettled}</Text>
                      </View>
                      {runningBalance > unsettled && (
                        <View style={[styles.pricingRow, { borderTopWidth: 1, borderStyle: 'dashed', borderColor: COLORS.border, paddingTop: 6, marginTop: 6 }]}>
                          <Text style={[styles.pricingLabel, { color: COLORS.red, fontWeight: 'bold' }]}>{dict.totalDues}</Text>
                          <Text style={[styles.pricingValue, { color: COLORS.red, fontWeight: 'bold', fontSize: 13 }]}>₹{runningBalance}</Text>
                        </View>
                      )}
                    </View>
                  </>
                ) : (
                  <View style={styles.paymentReceipt}>
                    <Text style={styles.paymentReceiptLabel}>{dict.cashReceived}</Text>
                    <Text style={styles.paymentReceiptVal}>₹{tx.amountPaid}</Text>
                    {runningBalance > 0 ? (
                      <View style={styles.remainingDuesBox}>
                        <Text style={styles.remainingDuesLabel}>{dict.remainingBalance}</Text>
                        <Text style={styles.remainingDuesVal}>₹{runningBalance}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.paymentReceiptSub}>
                      {runningBalance > 0 ? dict.gratitude : dict.allSettled}
                    </Text>
                  </View>
                )}
              </View>

              {tx.notes && tx.notes !== '' && (
                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>* "{tx.notes}"</Text>
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

            </View>
          </ScrollView>
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

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 19, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  content: {
    width: '100%',
    maxWidth: 340,
    maxHeight: '90%',
    backgroundColor: COLORS.bgSand,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  scrollContainer: {
    flexShrink: 1,
  },
  serratedHeader: {
    height: 8,
    backgroundColor: COLORS.bgDark,
    flexDirection: 'row',
    justifyContent: 'space-around',
    overflow: 'hidden',
  },
  serratedTriangle: {
    width: 12,
    height: 12,
    backgroundColor: COLORS.bgSand,
    transform: [{ rotate: '45deg' }, { translateY: 4 }],
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  voucherBody: {
    padding: 20,
    backgroundColor: '#faf9f5',
    borderWidth: 2,
    borderColor: 'transparent',
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
  },
  bizSub: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  langPillsContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#efe9de',
    borderRadius: 6,
    padding: 3,
    marginBottom: 14,
    width: '60%',
  },
  langPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: 4,
  },
  langPillActive: {
    backgroundColor: COLORS.coral,
  },
  langPillText: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  langPillTextActive: {
    color: COLORS.white,
  },
  metaTable: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    paddingVertical: 8,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 1.5,
  },
  metaLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  metaValue: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  descriptionSection: {
    marginBottom: 14,
  },
  descTableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  descTableHeaderText: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230, 223, 216, 0.4)',
    paddingBottom: 8,
    marginBottom: 8,
  },
  itemName: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  itemDetails: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  itemTotal: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  pricingSection: {
    marginTop: 4,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  pricingLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  pricingValue: {
    fontFamily: FONTS.sans,
    fontSize: 10,
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
  paymentReceipt: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  paymentReceiptLabel: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  paymentReceiptVal: {
    fontFamily: FONTS.serif,
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.green,
    marginVertical: 4,
  },
  paymentReceiptSub: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  notesBox: {
    backgroundColor: 'rgba(239, 233, 222, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(230, 223, 216, 0.4)',
    borderRadius: 4,
    padding: 8,
    marginBottom: 14,
  },
  notesText: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontStyle: 'italic',
    color: COLORS.textLightMuted,
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
    backgroundColor: COLORS.bgWarm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(230, 223, 216, 0.5)',
  },
  upiText: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    color: COLORS.textDark,
    fontWeight: 'bold',
  },
  upiId: {
    color: COLORS.coral,
  },
  bizNameFooter: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginTop: 8,
  },
  actionFooter: {
    backgroundColor: COLORS.bgWarm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 12,
    flexDirection: 'row',
  },
  ttsButton: {
    backgroundColor: COLORS.coral,
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  copyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgDark,
    borderRadius: 6,
    paddingVertical: 10,
  },
  copyButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.bgSand,
  },
  shareButton: {
    backgroundColor: COLORS.bgSand,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  printButton: {
    backgroundColor: COLORS.bgSand,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  remainingDuesBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    paddingTop: 8,
    marginTop: 8,
    marginBottom: 8,
    width: '100%',
  },
  remainingDuesLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.red,
  },
  remainingDuesVal: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.red,
  },
  qrCodeSection: {
    alignItems: 'center',
    marginVertical: 12,
    padding: 8,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
});
