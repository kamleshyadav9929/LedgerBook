import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Share } from 'react-native';
import { UserPlus, Download } from 'lucide-react-native';
import { COLORS, FONTS } from '../theme';
import { Customer, Transaction } from '../types';
import Svg, { Path } from 'react-native-svg';

interface HeaderProps {
  businessName: string;
  customers: Customer[];
  transactions: Transaction[];
  upiId: string;
  defaultRate: number;
  weightPresets: number[];
  ratePresets: number[];
  onAddCustomerOpen: () => void;
  triggerNotification: (msg: string, type?: 'success' | 'error') => void;
}

export default function Header({
  businessName,
  customers,
  transactions,
  upiId,
  defaultRate,
  weightPresets,
  ratePresets,
  onAddCustomerOpen,
  triggerNotification,
}: HeaderProps) {
  
  const handleExportBackup = async () => {
    try {
      const backupData = {
        customers,
        transactions,
        businessName,
        upiId,
        defaultRate,
        weightPresets,
        ratePresets,
        exportDate: new Date().toISOString(),
      };
      
      const jsonStr = JSON.stringify(backupData, null, 2);
      
      await Share.share({
        message: jsonStr,
        title: `${businessName.replace(/\s+/g, '_')}_Backup`,
      });
      
      triggerNotification('Backup payload shared!');
    } catch (error) {
      triggerNotification('Failed to export backup.', 'error');
    }
  };

  // Smart text formatter that prevents duplicate "Ledger" and highlights the last word/segment
  const renderFormattedLogoText = () => {
    const name = businessName.trim();
    if (!name) return <Text>Ghee<Text style={styles.logoHighlight}>Ledger</Text></Text>;

    const parts = name.split(/\s+/);
    
    // Case 1: Single word business name (e.g. "Sri" or "GheeLedger")
    if (parts.length === 1) {
      const word = parts[0];
      const lower = word.toLowerCase();
      if (lower.endsWith('ledger') && lower !== 'ledger') {
        const base = word.substring(0, lower.lastIndexOf('ledger'));
        return (
          <Text style={styles.logoText}>
            {base}
            <Text style={styles.logoHighlight}>Ledger</Text>
          </Text>
        );
      }
      return (
        <Text style={styles.logoText}>
          {word}
          <Text style={styles.logoHighlight}> Ledger</Text>
        </Text>
      );
    }

    // Case 2: Multi-word business name (e.g. "Sri Ghee Ledger")
    const lastWord = parts[parts.length - 1];
    if (lastWord.toLowerCase() === 'ledger') {
      const remaining = parts.slice(0, -1).join(' ');
      const secondLast = parts[parts.length - 2] || '';
      const basePart = parts.slice(0, -2).join(' ');
      return (
        <Text style={styles.logoText}>
          {basePart ? basePart + ' ' : ''}
          {secondLast}
          <Text style={styles.logoHighlight}>Ledger</Text>
        </Text>
      );
    }

    // Case 3: General business name (e.g. "Anand Dairy Products")
    const mainBody = parts.slice(0, -1).join(' ');
    const finalWord = parts[parts.length - 1];
    return (
      <Text style={styles.logoText}>
        {mainBody ? mainBody + ' ' : ''}
        <Text style={styles.logoHighlight}>{finalWord}</Text>
      </Text>
    );
  };

  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <View style={styles.logoBadge}>
          {/* Stylized premium golden Ghee droplet icon with gradient white reflection sheen */}
          <Svg viewBox="0 0 24 24" fill="none" style={styles.logoSvg}>
            <Path 
              d="M12 3C12 3 7 11 7 15C7 17.7614 9.23858 20 12 20C14.7614 20 17 17.7614 17 15C17 11 12 3 12 3Z" 
              fill="#df9a57" 
            />
            <Path 
              d="M12 6C12 6 9.5 11.5 9.5 14.5C9.5 15.88 10.62 17 12 17" 
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </Svg>
        </View>
        {renderFormattedLogoText()}
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity 
          onPress={onAddCustomerOpen}
          style={styles.actionButton}
          activeOpacity={0.7}
        >
          <UserPlus size={16} color={COLORS.coral} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleExportBackup}
          style={styles.actionButton}
          activeOpacity={0.7}
        >
          <Download size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    backgroundColor: COLORS.bgSand,
    borderBottomWidth: 1,
    borderBottomColor: '#ede8df', // elegant thin separator matching the bottom navbar
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 32, // slightly larger for visual balance
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  logoSvg: {
    width: 18,
    height: 18,
  },
  logoText: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    fontWeight: '700', // bolder serif weight is extremely modern and editorial
    color: COLORS.textDark,
    letterSpacing: -0.3,
  },
  logoHighlight: {
    color: COLORS.coral,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18, // Circular icons!
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    backgroundColor: '#efe9de', // Soft neutral tint matching bgWarm
  },
});
