import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { Briefcase, Grid, Activity, SlidersHorizontal, Upload, RefreshCw, Trash2, FileText, X } from 'lucide-react-native';
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
}: SettingsTabProps) {

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');

  const triggerImport = () => {
    if (!importText.trim()) {
      return;
    }
    onImportBackupJSON(importText);
    setImportText('');
    setIsImportModalOpen(false);
  };

  const handleClearDatabasePress = () => {
    Alert.alert(
      "Confirm Wipe",
      "Are you sure you want to completely clear GheeLedger? This wipes all customer history.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Wipe Database", style: "destructive", onPress: clearDatabase }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      


      {/* 1. Business Profile Settings */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Briefcase size={20} color={COLORS.coral} style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Business Profile Settings</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Farm / Business Name</Text>
            <TextInput
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="e.g. Vedic Ghee Farm"
              placeholderTextColor={COLORS.textLightMuted}
              style={styles.textInput}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>UPI ID (For Receipt Footers)</Text>
            <TextInput
              value={upiId}
              onChangeText={setUpiId}
              placeholder="e.g. merchant@upi"
              placeholderTextColor={COLORS.textLightMuted}
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

          <View style={styles.formGroup}>
            <Text style={styles.label}>Gemini AI API Key (Saved Locally)</Text>
            <TextInput
              secureTextEntry={true}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="Paste your Gemini AI API key..."
              placeholderTextColor={COLORS.textLightMuted}
              style={styles.textInput}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Gemini Model</Text>
            <TextInput
              value={geminiModel}
              onChangeText={setGeminiModel}
              placeholder="e.g. gemini-1.5-flash or gemini-2.0-flash"
              placeholderTextColor={COLORS.textLightMuted}
              style={styles.textInput}
            />
          </View>
        </View>
      </View>

      {/* 2. Presets Manager */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Grid size={20} color={COLORS.coral} style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Manage Quick-Tap Presets</Text>
        </View>
        <Text style={styles.cardDesc}>
          Customize shortcut buttons in the record tab. Separate weights or rates with commas.
        </Text>

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Weight Quick Shortcuts (kg/Litres)</Text>
            <TextInput
              value={weightPresetsInput}
              onChangeText={setWeightPresetsInput}
              placeholder="e.g. 0.5, 1, 2, 5"
              placeholderTextColor={COLORS.textLightMuted}
              style={styles.textInput}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Rate Quick Shortcuts (₹)</Text>
            <TextInput
              value={ratePresetsInput}
              onChangeText={setRatePresetsInput}
              placeholder="e.g. 1200, 1300, 1450"
              placeholderTextColor={COLORS.textLightMuted}
              style={styles.textInput}
            />
          </View>

          <TouchableOpacity
            onPress={savePresetConfigurations}
            style={styles.presetSaveButton}
            activeOpacity={0.8}
          >
            <Text style={styles.presetSaveButtonText}>Save Settings & Shortcuts</Text>
          </TouchableOpacity>
        </View>
      </View>



      {/* 3. System Logs Trail */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Activity size={20} color={COLORS.coral} style={styles.cardIcon} />
          <Text style={styles.cardTitle}>System logs trail</Text>
        </View>
        <Text style={styles.cardDesc}>
          Examine comprehensive, secure timeline tracking logs for deliveries, cash intakes, and balance revisions.
        </Text>
        
        <TouchableOpacity
          onPress={onOpenLogs}
          style={styles.logsButton}
          activeOpacity={0.8}
        >
          <FileText size={16} color={COLORS.bgSand} style={{ marginRight: 6 }} />
          <Text style={styles.logsButtonText}>Open System Logs Ledger</Text>
        </TouchableOpacity>
      </View>

      {/* Cloud Backup & Sync */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <RefreshCw size={20} color={COLORS.coral} style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Cloud Backup & Synchronization</Text>
        </View>
        <Text style={styles.cardDesc}>
          Sync your ledger data across multiple devices. Use a unique passcode (Sync Code) to backup and restore. Keep this code secret.
        </Text>
        <View style={{ backgroundColor: 'rgba(198, 69, 69, 0.08)', borderWidth: 1, borderColor: 'rgba(198, 69, 69, 0.15)', borderRadius: 6, padding: 10, marginBottom: 10 }}>
          <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.red, fontWeight: 'bold', marginBottom: 2 }}>⚠ SECURITY NOTICE</Text>
          <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textMuted, lineHeight: 14 }}>
            Data is transmitted as plain-text JSON to kvdb.io without encryption or authentication. Anyone with your Sync Code can read or overwrite your data. Do not use for sensitive financial records. Use strong, unique sync codes.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>KVdb Bucket ID</Text>
            <TextInput
              value={bucketId}
              onChangeText={setBucketId}
              placeholder="e.g. YHrwq92PpeQAtgKYSUV1q7"
              placeholderTextColor={COLORS.textLightMuted}
              style={styles.textInput}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Private Sync Code</Text>
            <View style={styles.syncInputContainer}>
              <TextInput
                secureTextEntry={true}
                value={syncCode}
                onChangeText={setSyncCode}
                placeholder="Enter private passcode..."
                placeholderTextColor={COLORS.textLightMuted}
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

          <View style={styles.syncActionsRow}>
            <TouchableOpacity
              onPress={() => backupToCloud(syncCode)}
              disabled={isSyncing}
              style={[styles.syncButton, styles.syncBackupButton]}
              activeOpacity={0.8}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Upload size={14} color={COLORS.white} style={{ marginRight: 6 }} />
                  <Text style={styles.syncButtonText}>Cloud Backup</Text>
                </>
              )}
            </TouchableOpacity>

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
              disabled={isSyncing}
              style={[styles.syncButton, styles.syncRestoreButton]}
              activeOpacity={0.8}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color={COLORS.textDark} />
              ) : (
                <>
                  <RefreshCw size={14} color={COLORS.textDark} style={{ marginRight: 6 }} />
                  <Text style={[styles.syncButtonText, { color: COLORS.textDark }]}>Cloud Restore</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 4. Storage Administration */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <SlidersHorizontal size={18} color={COLORS.textMuted} style={styles.cardIcon} />
          <Text style={[styles.cardTitle, { color: COLORS.textMuted }]}>Storage Administration</Text>
        </View>

        <View style={[styles.form, { marginTop: 8 }]}>
          <TouchableOpacity
            onPress={() => setIsImportModalOpen(true)}
            style={styles.adminRowButton}
            activeOpacity={0.7}
          >
            <Upload size={16} color={COLORS.coral} style={{ marginRight: 8 }} />
            <Text style={styles.adminRowText}>Import Ledger Backup Payload</Text>
          </TouchableOpacity>



          <TouchableOpacity
            onPress={handleClearDatabasePress}
            style={[styles.adminRowButton, styles.adminRowButtonAlert]}
            activeOpacity={0.7}
          >
            <Trash2 size={16} color={COLORS.red} style={{ marginRight: 8 }} />
            <Text style={[styles.adminRowText, { color: COLORS.red }]}>Clear Cache & Wipe Database</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MODAL: PASTEBOARD BACKUP IMPORT */}
      <Modal
        visible={isImportModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsImportModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Paste Backup JSON</Text>
              <TouchableOpacity onPress={() => setIsImportModalOpen(false)}>
                <X size={20} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalInstructions}>
                Paste the shared JSON backup string below:
              </Text>
              <TextInput
                multiline
                numberOfLines={8}
                value={importText}
                onChangeText={setImportText}
                placeholder='{"customers": [], "transactions": []}'
                placeholderTextColor={COLORS.textLightMuted}
                style={styles.modalTextarea}
              />
              <TouchableOpacity
                onPress={triggerImport}
                style={styles.importConfirmButton}
                activeOpacity={0.8}
              >
                <Text style={styles.importConfirmButtonText}>Import Payload</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  card: {
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIcon: {
    marginRight: 8,
  },
  cardTitle: {
    fontFamily: FONTS.serif,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  cardDesc: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginBottom: 10,
  },
  form: {
    marginTop: 4,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 40,
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textDark,
  },

  presetSaveButton: {
    backgroundColor: COLORS.coral,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  presetSaveButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logsButton: {
    backgroundColor: COLORS.bgDark,
    borderRadius: 6,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logsButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.bgSand,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  adminRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingVertical: 10,
    marginBottom: 8,
  },
  adminRowButtonAlert: {
    backgroundColor: 'rgba(198, 69, 69, 0.08)',
    borderColor: 'rgba(198, 69, 69, 0.15)',
  },
  adminRowText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 19, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.bgSand,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontFamily: FONTS.serif,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  modalBody: {
    padding: 16,
  },
  modalInstructions: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  modalTextarea: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 10,
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.textDark,
    textAlignVertical: 'top',
    height: 150,
  },
  importConfirmButton: {
    backgroundColor: COLORS.coral,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  importConfirmButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  syncInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  generateCodeBtn: {
    backgroundColor: COLORS.bgDark,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 40,
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
    borderRadius: 6,
    paddingVertical: 10,
    height: 40,
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
});
