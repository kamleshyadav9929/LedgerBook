import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Modal, 
  ActivityIndicator,
  Linking,
  Platform
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { X, Sparkles, Copy, MessageSquare, Smartphone } from 'lucide-react-native';
import { COLORS, FONTS } from '../theme';
import { Customer } from '../types';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Customer | null;
  activeTemplate: 'gentle' | 'professional' | 'urgent' | 'ai';
  setActiveTemplate: (template: 'gentle' | 'professional' | 'urgent' | 'ai') => void;
  reminderMessage: string;
  isAiGeneratingDraft: boolean;
  aiCustomDraftText: string;
  generateAISmartDraft: (lang?: string) => void;
  triggerNotification: (msg: string, type?: 'success' | 'error') => void;
  businessName: string;
  upiId: string;
}

const templates = {
  en: {
    gentle: (name: string, dues: number, bizName: string, upi: string) => 
      `Hello ${name}, this is a gentle reminder that an outstanding amount of ₹${dues} is pending for your recent Ghee deliveries from ${bizName}. You can pay directly via UPI at ${upi}. Thank you!`,
    professional: (name: string, dues: number, bizName: string, upi: string) => 
      `Dear ${name}, we hope you are doing well. This is a formal statement regarding the outstanding balance of ₹${dues} on your account with ${bizName}. Please settle the dues at your earliest convenience using UPI ID: ${upi}. Let us know if you need a detailed statement.`,
    urgent: (name: string, dues: number, bizName: string, upi: string) => 
      `Urgent: Hello ${name}, your account balance of ₹${dues} with ${bizName} is overdue. Please settle this immediately to continue uninterrupted deliveries. UPI ID: ${upi}. If already paid, please ignore or send us the receipt.`
  },
  hi: {
    gentle: (name: string, dues: number, bizName: string, upi: string) => 
      `नमस्ते ${name}, यह एक विनम्र याद दिलाना है कि ${bizName} से आपके घी के वितरण के लिए ₹${dues} की बकाया राशि लंबित है। आप सीधे UPI द्वारा ${upi} पर भुगतान कर सकते हैं। धन्यवाद!`,
    professional: (name: string, dues: number, bizName: string, upi: string) => 
      `प्रिय ${name}, आशा है कि आप सकुशल होंगे। यह ${bizName} के साथ आपके खाते में ₹${dues} के बकाया शेष के संबंध में एक औपचारिक विवरण है। कृपया UPI आईडी: ${upi} का उपयोग करके जल्द से जल्द बकाया राशि का भुगतान करें। यदि आपको विस्तृत विवरण चाहिए तो हमें बताएं।`,
    urgent: (name: string, dues: number, bizName: string, upi: string) => 
      `अति आवश्यक: नमस्ते ${name}, ${bizName} के साथ आपके खाते का शेष ₹${dues} अतिदेय (overdue) हो गया है। कृपया बिना किसी बाधा के वितरण जारी रखने के लिए इसका तुरंत भुगतान करें। UPI आईडी: ${upi}। यदि आप पहले ही भुगतान कर चुके हैं, तो कृपया इसे अनदेखा करें।`
  }
};

export default function ReminderModal({
  isOpen,
  onClose,
  profile,
  activeTemplate,
  setActiveTemplate,
  reminderMessage,
  isAiGeneratingDraft,
  aiCustomDraftText,
  generateAISmartDraft,
  triggerNotification,
  businessName,
  upiId,
}: ReminderModalProps) {

  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi'>('en');

  const currentMessageText = useMemo(() => {
    if (!profile) return '';
    if (activeTemplate === 'ai') return aiCustomDraftText;
    const formatter = templates[selectedLanguage][activeTemplate];
    return formatter(profile.name, profile.pendingAmount, businessName, upiId);
  }, [activeTemplate, selectedLanguage, profile, aiCustomDraftText, businessName, upiId]);

  if (!profile) return null;

  const handleCopyText = () => {
    if (!currentMessageText || currentMessageText.trim() === '') {
      triggerNotification('No message text to send. Generate or select a template first.', 'error');
      return;
    }
    Clipboard.setStringAsync(currentMessageText);
    triggerNotification('Text copied to clipboard!');
  };

  const handleSendSMS = () => {
    if (!currentMessageText || currentMessageText.trim() === '') {
      triggerNotification('No message text to send. Generate or select a template first.', 'error');
      return;
    }
    if (!profile.phone || profile.phone.trim() === '') {
      triggerNotification('Customer phone number is missing. Please update it first.', 'error');
      return;
    }
    const cleanPhone = profile.phone.replace(/[^0-9]/g, '');
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const url = `sms:91${cleanPhone}${separator}body=${encodeURIComponent(currentMessageText)}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
          onClose();
          triggerNotification('Redirected to SMS!');
        } else {
          Clipboard.setStringAsync(currentMessageText);
          triggerNotification('SMS not supported. Message copied to clipboard.', 'error');
        }
      })
      .catch(() => {
        Clipboard.setStringAsync(currentMessageText);
        triggerNotification('SMS failed to open. Message copied.', 'error');
      });
  };

  const handleSendWhatsApp = () => {
    if (!currentMessageText || currentMessageText.trim() === '') {
      triggerNotification('No message text to send. Generate or select a template first.', 'error');
      return;
    }
    if (!profile.phone || profile.phone.trim() === '') {
      triggerNotification('Customer phone number is missing. Please update it first.', 'error');
      return;
    }
    const cleanPhone = profile.phone.replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=91${cleanPhone}&text=${encodeURIComponent(currentMessageText)}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
          onClose();
          triggerNotification('Redirected to WhatsApp!');
        } else {
          const webUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(currentMessageText)}`;
          Linking.openURL(webUrl);
          onClose();
          triggerNotification('Redirected to WhatsApp Web!');
        }
      })
      .catch(() => {
        // Bug #26: Fallback to clipboard if WhatsApp fails entirely
        Clipboard.setStringAsync(currentMessageText);
        triggerNotification('WhatsApp not available. Message copied to clipboard instead.', 'error');
      });
  };

  const selectLanguageAndDraftAI = (langKey: 'en' | 'hi') => {
    setSelectedLanguage(langKey);
    if (activeTemplate === 'ai') {
      const langNames = { en: 'English', hi: 'Hindi' };
      generateAISmartDraft(langNames[langKey]);
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          
          <View style={styles.notchContainer}>
            <TouchableOpacity onPress={onClose} style={styles.notch} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <MessageSquare size={20} color={COLORS.coral} style={{ marginRight: 6 }} />
              <Text style={styles.title}>Dues Reminder Center</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.body}>
            
            {/* Language Selection Pills */}
            <View style={styles.languageContainer}>
              <Text style={styles.sectionLabel}>Select Language</Text>
              <View style={styles.languagePills}>
                {[
                  { key: 'en', label: 'English' },
                  { key: 'hi', label: 'Hindi (हिंदी)' }
                ].map(lang => (
                  <TouchableOpacity
                    key={lang.key}
                    onPress={() => selectLanguageAndDraftAI(lang.key as any)}
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
            </View>

            {/* Template picker pills */}
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.sectionLabel}>Select Template Tone</Text>
              <View style={styles.templatePills}>
                {[
                  { key: 'gentle', label: 'Gentle' },
                  { key: 'professional', label: 'Professional' },
                  { key: 'urgent', label: 'Urgent' },
                  { key: 'ai', label: 'AI Smart Draft' }
                ].map(temp => (
                  <TouchableOpacity
                    key={temp.key}
                    onPress={() => {
                      setActiveTemplate(temp.key as any);
                      if (temp.key === 'ai') {
                        const langNames = { en: 'English', hi: 'Hindi' };
                        generateAISmartDraft(langNames[selectedLanguage]);
                      }
                    }}
                    style={[
                      styles.pillButton,
                      activeTemplate === temp.key && styles.pillButtonActive
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.pillText,
                      activeTemplate === temp.key && styles.pillTextActive
                    ]}>
                      {temp.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Message Preview */}
            <View style={styles.previewBox}>
              <View style={styles.previewBoxHeader}>
                {activeTemplate === 'ai' && <Sparkles size={12} color={COLORS.coral} style={{ marginRight: 4 }} />}
                <Text style={styles.previewBoxLabel}>
                  {activeTemplate === 'ai' ? 'Gemini Generated Reminder' : 'Message Body Preview'}
                </Text>
              </View>

              {activeTemplate === 'ai' && isAiGeneratingDraft ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.coral} style={{ marginRight: 8 }} />
                  <Text style={styles.loadingText}>Gemini drafting smart reminder...</Text>
                </View>
              ) : activeTemplate === 'ai' && !aiCustomDraftText ? (
                <TouchableOpacity 
                  onPress={() => {
                    const langNames = { en: 'English', hi: 'Hindi' };
                    generateAISmartDraft(langNames[selectedLanguage]);
                  }}
                  style={styles.generateButton}
                >
                  <Text style={styles.generateButtonText}>Generate AI Draft Now</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.messagePreviewText}>
                  "{currentMessageText}"
                </Text>
              )}
            </View>

            {/* Action buttons row (Copy, SMS, WhatsApp) */}
            <View style={styles.buttonsRow}>
              <TouchableOpacity
                onPress={handleCopyText}
                style={styles.actionButton}
                activeOpacity={0.8}
              >
                <Copy size={15} color={COLORS.bgSand} style={{ marginRight: 4 }} />
                <Text style={styles.actionButtonText}>Copy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSendSMS}
                style={[styles.actionButton, styles.actionButtonDark]}
                activeOpacity={0.8}
              >
                <Smartphone size={15} color={COLORS.bgSand} style={{ marginRight: 4 }} />
                <Text style={styles.actionButtonText}>Direct SMS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSendWhatsApp}
                style={[styles.actionButton, styles.actionButtonCoral]}
                activeOpacity={0.8}
              >
                <MessageSquare size={15} color={COLORS.white} style={{ marginRight: 4 }} />
                <Text style={[styles.actionButtonText, { color: COLORS.white }]}>WhatsApp</Text>
              </TouchableOpacity>
            </View>


          </View>
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
    padding: 4,
    backgroundColor: COLORS.bgWarm,
    borderRadius: 16,
  },
  body: {
    padding: 20,
    paddingBottom: 30,
  },
  languageContainer: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  languagePills: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgWarm,
    borderRadius: 6,
    padding: 3,
  },
  langPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 4,
  },
  langPillActive: {
    backgroundColor: COLORS.coral,
  },
  langPillText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  langPillTextActive: {
    color: COLORS.white,
  },
  templatePills: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgWarm,
    borderRadius: 6,
    padding: 3,
  },
  pillButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 4,
  },
  pillButtonActive: {
    backgroundColor: COLORS.coral,
  },
  pillText: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  pillTextActive: {
    color: COLORS.white,
  },
  previewBox: {
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
  },
  previewBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  previewBoxLabel: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  loadingText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  generateButton: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.coral,
    fontWeight: 'bold',
  },
  messagePreviewText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontStyle: 'italic',
    color: '#3d3d3a',
    lineHeight: 18,
  },
  buttonsRow: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgDark,
    borderRadius: 6,
    paddingVertical: 12,
    marginRight: 6,
  },
  actionButtonDark: {
    backgroundColor: '#3d3d3a',
    marginRight: 6,
  },
  actionButtonCoral: {
    backgroundColor: COLORS.coral,
    marginRight: 0,
  },
  actionButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.bgSand,
  },
});
