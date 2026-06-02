import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { 
  CreditCard, 
  Database, 
  Key, 
  Shield, 
  FileText, 
  Sliders, 
  Info, 
  ChevronRight, 
  ChevronLeft,
  Upload, 
  RefreshCw, 
  Trash2,
  Lock,
  CloudLightning
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS, FONTS } from '../theme';

interface SettingsTabProps {
  businessName: string;
  setBusinessName: (name: string) => void;
  upiId: string;
  setUpiId: (id: string) => void;
  defaultRate: number;
  setDefaultRate: (rate: number) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  geminiModel: string;
  setGeminiModel: (model: string) => void;
  weightPresetsInput: string;
  setWeightPresetsInput: (input: string) => void;
  ratePresetsInput: string;
  setRatePresetsInput: (input: string) => void;
  savePresetConfigurations: () => void;
  onOpenLogs: () => void;
  clearDatabase: () => void;
  onImportBackupJSON: (jsonStr: string) => void;
  syncCode: string;
  setSyncCode: (code: string) => void;
  bucketId: string;
  setBucketId: (id: string) => void;
  backupToCloud: (code: string) => void;
  restoreFromCloud: (code: string) => void;
  isSyncing: boolean;
  activeSection: 'upi' | 'backup' | 'gemini' | 'security' | 'presets' | 'about' | 'import' | null;
  setActiveSection: (section: 'upi' | 'backup' | 'gemini' | 'security' | 'presets' | 'about' | 'import' | null) => void;
  lastBackupTime: string;
  backupRecords: number;
  backupSizeFormatted: string;
}

export default function SettingsTab({
  businessName,
  setBusinessName,
  upiId,
  setUpiId,
  defaultRate,
  setDefaultRate,
  apiKey,
  setApiKey,
  geminiModel,
  setGeminiModel,
  weightPresetsInput,
  setWeightPresetsInput,
  ratePresetsInput,
  setRatePresetsInput,
  savePresetConfigurations,
  onOpenLogs,
  clearDatabase,
  onImportBackupJSON,
  syncCode,
  setSyncCode,
  bucketId,
  setBucketId,
  backupToCloud,
  restoreFromCloud,
  isSyncing,
  activeSection,
  setActiveSection,
  lastBackupTime,
  backupRecords,
  backupSizeFormatted,
}: SettingsTabProps) {

  const [importText, setImportText] = useState('');
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);

  const triggerImport = () => {
    if (!importText.trim()) return;
    onImportBackupJSON(importText);
    setImportText('');
    setActiveSection('backup');
    Alert.alert("Success", "Backup payload imported successfully!");
  };

  const handleClearDatabasePress = () => {
    Alert.alert(
      "Confirm Wipe",
      "Are you sure you want to completely clear GheeLedger? This wipes all customer history.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Wipe Database", style: "destructive", onPress: () => { clearDatabase(); setActiveSection(null); } }
      ]
    );
  };

  const handleSavePresetsPress = () => {
    savePresetConfigurations();
    Alert.alert("Success", "Settings and shortcuts successfully saved!");
    setActiveSection(null);
  };

  const categories = [
    {
      id: 'upi',
      title: 'UPI & Payments',
      description: 'Manage UPI IDs and payment settings',
      icon: <CreditCard size={18} color={COLORS.coral} />,
      action: () => setActiveSection('upi')
    },
    {
      id: 'backup',
      title: 'Backup & Restore',
      description: 'Backup your data to Google Drive',
      icon: <Database size={18} color={COLORS.coral} />,
      action: () => setActiveSection('backup')
    },
    {
      id: 'gemini',
      title: 'Gemini AI Keys',
      description: 'Manage your Gemini API keys',
      icon: <Key size={18} color={COLORS.coral} />,
      action: () => setActiveSection('gemini')
    },
    {
      id: 'security',
      title: 'Security',
      description: 'App lock, PIN, and privacy',
      icon: <Shield size={18} color={COLORS.coral} />,
      action: () => setActiveSection('security')
    },
    {
      id: 'logs',
      title: 'Audit Logs',
      description: 'View all activity logs',
      icon: <FileText size={18} color={COLORS.coral} />,
      action: onOpenLogs
    },
    {
      id: 'presets',
      title: 'Preferences',
      description: 'Units, date format, reminders',
      icon: <Sliders size={18} color={COLORS.coral} />,
      action: () => setActiveSection('presets')
    },
    {
      id: 'about',
      title: 'About GheeLedger',
      description: 'Version 1.0.0',
      icon: <Info size={18} color={COLORS.coral} />,
      action: () => setActiveSection('about')
    }
  ];

  // RENDER DEDICATED INLINE PAGES (UNBOUNDED DESIGN)
  if (activeSection === 'backup') {
    return (
      <View style={styles.container}>
        {/* Navigation Header - borderless & transparent */}
        <View style={styles.subPageHeader}>
          <TouchableOpacity onPress={() => setActiveSection(null)} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={24} color="#1C2B24" />
            <Text style={styles.screenTitleBack}>Backup & Restore</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Cloud Badge and Info - unbounded */}
          <View style={styles.cloudBadgeCard}>
            <View style={styles.cloudBadgeCircle}>
              <CloudLightning size={24} color="#255246" />
            </View>
            <Text style={styles.lastBackupLabel}>Last Backup</Text>
            <Text style={styles.lastBackupTime}>{lastBackupTime}</Text>
            <Text style={styles.backupDestination}>KVdb Cloud</Text>

            {/* Sizes Stats Grid - borderless */}
            <View style={styles.backupStatsGrid}>
              <View style={styles.backupStatCell}>
                <Text style={styles.backupStatLabel}>Backup Size</Text>
                <Text style={styles.backupStatVal}>{backupSizeFormatted}</Text>
              </View>
              <View style={styles.backupStatDivider} />
              <View style={styles.backupStatCell}>
                <Text style={styles.backupStatLabel}>Records</Text>
                <Text style={styles.backupStatVal}>{backupRecords.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>

          {/* Backup Now Action Button */}
          <TouchableOpacity 
            onPress={() => backupToCloud(syncCode)}
            disabled={isSyncing}
            style={styles.backupNowBtn}
            activeOpacity={0.9}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.backupNowBtnText}>Backup Now</Text>
            )}
          </TouchableOpacity>

          {/* Auto Backup Configuration Section - unbounded row items */}
          <View style={styles.unboundedSection}>
            <View style={styles.cardItemRow}>
              <View>
                <Text style={styles.cardItemTitle}>Enable Auto Backup</Text>
                <Text style={styles.cardItemSub}>Backup automatically in the background</Text>
              </View>
              {/* Premium iOS style switch track toggle */}
              <TouchableOpacity 
                onPress={() => setAutoBackupEnabled(!autoBackupEnabled)} 
                style={[styles.switchTrack, autoBackupEnabled ? styles.switchTrackActive : styles.switchTrackInactive]}
                activeOpacity={0.8}
              >
                <View style={[styles.switchThumb, autoBackupEnabled ? styles.switchThumbActive : styles.switchThumbInactive]} />
              </TouchableOpacity>
            </View>

            <View style={[styles.cardItemRow, { borderBottomWidth: 0, paddingTop: 14 }]}>
              <View>
                <Text style={styles.cardItemTitle}>Backup Frequency</Text>
                <Text style={styles.cardItemSub}>Choose how often to save backups</Text>
              </View>
              <View style={styles.dropdownSelector}>
                <Text style={styles.dropdownSelectorText}>Daily</Text>
                <Svg viewBox="0 0 24 24" fill="none" style={{ width: 14, height: 14, marginLeft: 4 }}>
                  <Path d="M6 9L12 15L18 9" stroke="#5A6761" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
            </View>
          </View>

          {/* Restore Data Section - unbounded */}
          <View style={styles.unboundedSection}>
            <TouchableOpacity 
              onPress={() => {
                Alert.alert(
                  "Confirm Cloud Restore",
                  "Restoring from the cloud will merge backup records with your current local ledger. Are you sure?",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Restore & Merge", style: "default", onPress: () => restoreFromCloud(syncCode) }
                  ]
                );
              }}
              style={[styles.cardItemRow, { borderBottomWidth: 0 }]}
              activeOpacity={0.7}
            >
              <View>
                <Text style={styles.cardItemTitle}>Restore from Backup</Text>
                <Text style={styles.cardItemSub}>Replace current data with backup</Text>
              </View>
              <ChevronRight size={16} color="#8A9690" />
            </TouchableOpacity>
          </View>

          {/* Sync Key Configuration - unbounded */}
          <View style={styles.unboundedSection}>
            <View style={{ paddingBottom: 10 }}>
              <Text style={styles.cardItemTitle}>KVdb Backup Configuration</Text>
              <Text style={styles.cardItemSub}>Passcode details for plain-text storage</Text>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>KVdb Bucket ID</Text>
              <TextInput
                value={bucketId}
                onChangeText={setBucketId}
                placeholder="e.g. YHrwq92PpeQAtgKYSUV1q7"
                placeholderTextColor="#8A9690"
                style={styles.textInput}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Private Sync Code</Text>
              <View style={styles.syncInputContainer}>
                <TextInput
                  secureTextEntry={false}
                  value={syncCode}
                  onChangeText={setSyncCode}
                  placeholder="Enter private passcode..."
                  placeholderTextColor="#8A9690"
                  style={[styles.textInput, { flex: 1 }]}
                />
                <TouchableOpacity
                  onPress={() => {
                    const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase();
                    setSyncCode(randomCode);
                  }}
                  style={styles.generateCodeBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.generateCodeBtnText}>Random</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => setActiveSection('import')}
              style={styles.importInlineBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.importInlineBtnText}>Import Payload JSON</Text>
            </TouchableOpacity>
          </View>

          {/* Shield Security Alert Footer */}
          <View style={styles.securityShieldCard}>
            <Shield size={16} color="#3F7A5E" style={{ marginRight: 8 }} />
            <Text style={styles.securityShieldText}>
              Your data is safe and secure with local SQLite encryption.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (activeSection === 'upi') {
    return (
      <View style={styles.container}>
        <View style={styles.subPageHeader}>
          <TouchableOpacity onPress={() => setActiveSection(null)} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={24} color="#1C2B24" />
            <Text style={styles.screenTitleBack}>UPI & Payments</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.unboundedSection}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Farm / Business Name</Text>
              <TextInput
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="e.g. Vedic Ghee Farm"
                placeholderTextColor="#8A9690"
                style={styles.textInput}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>UPI ID (For Receipt Footers)</Text>
              <TextInput
                value={upiId}
                onChangeText={setUpiId}
                placeholder="e.g. merchant@upi"
                placeholderTextColor="#8A9690"
                style={styles.textInput}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Standard Default Rate per kg (₹)</Text>
              <TextInput
                keyboardType="number-pad"
                value={defaultRate.toString()}
                onChangeText={(text) => setDefaultRate(Math.max(1, parseFloat(text) || 0))}
                style={styles.textInput}
              />
            </View>
          </View>

          <TouchableOpacity onPress={() => setActiveSection(null)} style={styles.primaryActionBtn} activeOpacity={0.9}>
            <Text style={styles.primaryActionBtnText}>Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (activeSection === 'gemini') {
    return (
      <View style={styles.container}>
        <View style={styles.subPageHeader}>
          <TouchableOpacity onPress={() => setActiveSection(null)} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={24} color="#1C2B24" />
            <Text style={styles.screenTitleBack}>Gemini AI Keys</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.unboundedSection}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Gemini AI API Key (Saved Locally)</Text>
              <TextInput
                secureTextEntry={true}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="Paste your Gemini AI API key..."
                placeholderTextColor="#8A9690"
                style={styles.textInput}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Gemini Model</Text>
              <TextInput
                value={geminiModel}
                onChangeText={setGeminiModel}
                placeholder="e.g. gemini-1.5-flash or gemini-2.0-flash"
                placeholderTextColor="#8A9690"
                style={styles.textInput}
              />
            </View>
          </View>

          <TouchableOpacity onPress={() => setActiveSection(null)} style={styles.primaryActionBtn} activeOpacity={0.9}>
            <Text style={styles.primaryActionBtnText}>Save API Keys</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (activeSection === 'security') {
    return (
      <View style={styles.container}>
        <View style={styles.subPageHeader}>
          <TouchableOpacity onPress={() => setActiveSection(null)} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={24} color="#1C2B24" />
            <Text style={styles.screenTitleBack}>Security & Wipes</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.unboundedSection}>
            <Text style={styles.sectionDesc}>
              All client profiles, ledger accounts, weight history, and transactions are stored entirely offline on your phone inside a secure local database. 
            </Text>
            <Text style={styles.sectionDesc}>
              Wiping database cache deletes all client portfolios, ledger transactions, and resets configurations. Make sure to back up before completing this action.
            </Text>
          </View>

          <TouchableOpacity onPress={handleClearDatabasePress} style={styles.wipeAlertBtn} activeOpacity={0.9}>
            <Trash2 size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.wipeAlertBtnText}>Wipe database cache</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (activeSection === 'presets') {
    return (
      <View style={styles.container}>
        <View style={styles.subPageHeader}>
          <TouchableOpacity onPress={() => setActiveSection(null)} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={24} color="#1C2B24" />
            <Text style={styles.screenTitleBack}>Preferences & Shortcuts</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.unboundedSection}>
            <Text style={styles.sectionDesc}>
              Customize quick-tap preset buttons in the manual entry form tab. Separate weights or rates with commas.
            </Text>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Weight Quick Shortcuts (kg/Litres)</Text>
              <TextInput
                value={weightPresetsInput}
                onChangeText={setWeightPresetsInput}
                placeholder="e.g. 0.5, 1, 2, 5"
                placeholderTextColor="#8A9690"
                style={styles.textInput}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Rate Quick Shortcuts (₹)</Text>
              <TextInput
                value={ratePresetsInput}
                onChangeText={setRatePresetsInput}
                placeholder="e.g. 1200, 1300, 1450"
                placeholderTextColor="#8A9690"
                style={styles.textInput}
              />
            </View>
          </View>

          <TouchableOpacity onPress={handleSavePresetsPress} style={styles.primaryActionBtn} activeOpacity={0.9}>
            <Text style={styles.primaryActionBtnText}>Save Preferences</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (activeSection === 'about') {
    return (
      <View style={styles.container}>
        <View style={styles.subPageHeader}>
          <TouchableOpacity onPress={() => setActiveSection(null)} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={24} color="#1C2B24" />
            <Text style={styles.screenTitleBack}>About GheeLedger</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.unboundedSection, { alignItems: 'center', paddingVertical: 30 }]}>
            <Text style={styles.aboutHeadline}>GheeLedger Smart Book</Text>
            <Text style={styles.aboutVersion}>Version 1.0.0 (Expo SDK 54)</Text>
            <Text style={styles.aboutDesc}>
              Offline secure ledger book engineered for local dairy farms, ghee distributors, and bulk merchants to track sales weight, cash collections, and balances.
            </Text>
            <Text style={styles.copyright}>© 2026 GheeLedger Farm Systems. All rights reserved.</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (activeSection === 'import') {
    return (
      <View style={styles.container}>
        <View style={styles.subPageHeader}>
          <TouchableOpacity onPress={() => setActiveSection('backup')} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={24} color="#1C2B24" />
            <Text style={styles.screenTitleBack}>Import JSON Payload</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.unboundedSection}>
            <Text style={styles.sectionDesc}>
              Paste a previously exported GheeLedger JSON backup string to restore all transaction logs and client accounts.
            </Text>
            <TextInput
              multiline
              numberOfLines={8}
              value={importText}
              onChangeText={setImportText}
              placeholder='{"customers": [], "transactions": []}'
              placeholderTextColor="#8A9690"
              style={styles.modalTextarea}
            />
          </View>

          <TouchableOpacity onPress={triggerImport} style={styles.primaryActionBtn} activeOpacity={0.9}>
            <Text style={styles.primaryActionBtnText}>Import Payload</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // MAIN CATEGORIES LIST LANDING PAGE (Screen 12 - Unbounded/Borderless Style)
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContentMain} showsVerticalScrollIndicator={false}>
        <View style={styles.listContainer}>
          {categories.map((cat, idx) => (
            <TouchableOpacity 
              key={cat.id} 
              onPress={cat.action}
              style={[
                styles.listItem,
                idx === categories.length - 1 && { borderBottomWidth: 0 }
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.listItemLeft}>
                <View style={styles.iconCircle}>
                  {cat.icon}
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.itemTitle}>{cat.title}</Text>
                  <Text style={styles.itemDesc}>{cat.description}</Text>
                </View>
              </View>
              <ChevronRight size={18} color="#8A9690" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Brand Copyright footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>GheeLedger Version 1.0.0</Text>
          <Text style={styles.footerSubText}>Secure Local Storage Engine</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgSand, // Elegant sand background
  },
  subPageHeader: {
    paddingHorizontal: 0,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.bgSand,
  },
  screenTitleBack: {
    fontFamily: FONTS.serif,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginLeft: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingBottom: 40,
  },
  scrollContentMain: {
    paddingHorizontal: 0,
    paddingTop: 24, // Direct starting padding without upper navbar
    paddingBottom: 40,
  },
  listContainer: {
    backgroundColor: 'transparent', // Unbounded list container background
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16, // spacious padding
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border, // elegant divider line
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgWarm, // Soft beige backing for icons
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  itemDesc: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textLightMuted,
  },
  footerSubText: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: COLORS.textLightMuted,
    marginTop: 3,
  },
  // Unbounded Page Section
  unboundedSection: {
    backgroundColor: 'transparent', // borderless transparent backgrounds
    paddingVertical: 8,
    marginBottom: 16,
    marginTop: 4,
  },
  cardItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 14,
  },
  cardItemTitle: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  cardItemSub: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  // Cloud Badge and Info (Screen 13 style - unbounded)
  cloudBadgeCard: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  cloudBadgeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.bgMintLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  lastBackupLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  lastBackupTime: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginTop: 4,
  },
  backupDestination: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  backupStatsGrid: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  backupStatCell: {
    flex: 1,
    alignItems: 'center',
  },
  backupStatLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: COLORS.textLightMuted,
  },
  backupStatVal: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginTop: 2,
  },
  backupStatDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  backupNowBtn: {
    width: '100%',
    backgroundColor: COLORS.coral, // Solid Forest Green
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backupNowBtnText: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  // Switch styling
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: COLORS.coral,
  },
  switchTrackInactive: {
    backgroundColor: COLORS.border,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  switchThumbInactive: {
    alignSelf: 'flex-start',
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSand,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dropdownSelectorText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  securityShieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  securityShieldText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: COLORS.bgSand,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textDark,
  },
  syncInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  generateCodeBtn: {
    backgroundColor: COLORS.textDark,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateCodeBtnText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  syncActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  syncButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    height: 44,
  },
  syncBackupButton: {
    backgroundColor: COLORS.coral,
  },
  syncRestoreButton: {
    backgroundColor: COLORS.bgSand,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  syncButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  importInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgSand,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    height: 44,
    marginTop: 12,
  },
  importInlineBtnText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.coral,
  },
  primaryActionBtn: {
    backgroundColor: COLORS.coral,
    borderRadius: 24,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  primaryActionBtnText: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  wipeAlertBtn: {
    backgroundColor: COLORS.red,
    borderRadius: 24,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  wipeAlertBtnText: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  sectionDesc: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  aboutHeadline: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 4,
  },
  aboutVersion: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  aboutDesc: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  copyright: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: COLORS.textLightMuted,
    textAlign: 'center',
  },
  modalTextarea: {
    backgroundColor: COLORS.bgSand,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.textDark,
    textAlignVertical: 'top',
    height: 150,
  },
});
