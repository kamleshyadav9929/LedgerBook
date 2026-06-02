import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
  Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Users, TrendingUp, Plus, FileText, Settings, X, Mic, User, Phone, Wallet, PlusCircle, UserPlus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as SQLite from 'expo-sqlite';

import { COLORS, FONTS } from './theme';
import { Customer, Transaction, QuickTxState, ParsedPreviewState, InventoryEntry } from './types';

// Import subcomponents
import Header from './components/Header';
import ClientsTab from './components/ClientsTab';
import AnalyticsTab from './components/AnalyticsTab';
import QuickRecordTab from './components/QuickRecordTab';
import ReceiptsTab from './components/ReceiptsTab';
import SettingsTab from './components/SettingsTab';
import CustomerProfileSheet from './components/CustomerProfileSheet';
import ReminderModal from './components/ReminderModal';
import ReceiptVoucherModal from './components/ReceiptVoucherModal';
import AuditLogsModal from './components/AuditLogsModal';
import WelcomeScreen from './components/WelcomeScreen';

// const apiKey = ""; // MOVED TO LOCAL STATE AND STORAGE IN APPCORE

// Sample database constants removed

interface TabContainerProps {
  activeTab: string;
  children: React.ReactNode;
}

function TabContainer({ activeTab, children }: TabContainerProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(8);

    const frame = requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });

    return () => cancelAnimationFrame(frame);
  }, [activeTab]);

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {children}
    </Animated.View>
  );
}



// ─── Module-level DB singleton ────────────────────────────────────────────────
// Opened exactly once per app process. React StrictMode / fast-refresh mounts
// the component twice but must never open two connections.
let _dbSingleton: SQLite.SQLiteDatabase | null = null;
let _dbOpenPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_dbSingleton) return _dbSingleton;
  if (_dbOpenPromise) return _dbOpenPromise;
  _dbOpenPromise = SQLite.openDatabaseAsync('ghee_ledger.db').then(db => {
    _dbSingleton = db;
    return db;
  });
  return _dbOpenPromise;
}


export default function AppCore() {
  const [activeTab, setActiveTab] = useState<'customers' | 'analytics' | 'quick-add' | 'vouchers' | 'settings' | 'client-profile'>('customers');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dbRef = useRef<SQLite.SQLiteDatabase | null>(null);
  const dbQueueRef = useRef<Promise<any>>(Promise.resolve());
  const skipNextSaveRef = useRef({ customers: true, transactions: true, inventory: true, settings: true });
  const [hasStarted, setHasStarted] = useState<boolean | null>(null); // null means still loading settings from DB

  const enqueueDbOp = useCallback((op: () => Promise<void>) => {
    dbQueueRef.current = dbQueueRef.current.then(async () => {
      try {
        await op();
      } catch (err) {
        console.error("Database queue operation failed:", err);
      }
    });
  }, []);

  // Core business configurations
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [businessName, setBusinessName] = useState('Vedic Ghee Farm');
  const [upiId, setUpiId] = useState('ghee@upi');
  const [defaultRate, setDefaultRate] = useState(1300);
  const [apiKey, setApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-1.5-flash');
  const [syncCode, setSyncCode] = useState('');
  const [bucketId, setBucketId] = useState('YHrwq92PpeQAtgKYSUV1q7');
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeSettingsSection, setActiveSettingsSection] = useState<'upi' | 'backup' | 'gemini' | 'security' | 'presets' | 'about' | 'import' | null>(null);
  const [lastBackupTime, setLastBackupTime] = useState<string>('Never');

  // Preset shortcuts configurations
  const [weightPresets, setWeightPresets] = useState([0.5, 1, 2, 5]);
  const [ratePresets, setRatePresets] = useState([750, 900, 1450]);
  const [weightPresetsInput, setWeightPresetsInput] = useState('0.5, 1, 2, 5');
  const [ratePresetsInput, setRatePresetsInput] = useState('750, 900, 1450');

  // Search, Filter & Drawer Triggers
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isReminderCenterOpen, setIsReminderCenterOpen] = useState(false);
  const [activeReminderTemplate, setActiveReminderTemplate] = useState<'gentle' | 'professional' | 'urgent' | 'ai'>('gentle');
  const [isLogsSheetOpen, setIsLogsSheetOpen] = useState(false);
  const [receiptTxId, setReceiptTxId] = useState<string | null>(null);
  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState('');

  const [quickTx, setQuickTx] = useState<QuickTxState>({
    customerId: '',
    type: 'sale',
    quantityKg: 1,
    ratePerKg: 1300,
    amountPaid: 0,
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [showCustomWeight, setShowCustomWeight] = useState(false);
  const [showCustomRate, setShowCustomRate] = useState(false);
  const [showCustomAmount, setShowCustomAmount] = useState(false);

  // Register client form states
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', initialKg: '0', initialDue: '0', notes: '' });

  // Gemini & OCR helper states
  const [recordMethod, setRecordMethod] = useState<'manual' | 'voice' | 'scan'>('manual');

  const [speechResultText, setSpeechResultText] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [parsedPreviewList, setParsedPreviewList] = useState<ParsedPreviewState[] | null>(null);
  const [scanPreviewImage, setScanPreviewImage] = useState<string | null>(null);
  const [isScanningImage, setIsScanningImage] = useState(false);

  const [isAiGeneratingDraft, setIsAiGeneratingDraft] = useState(false);
  const [aiCustomDraftText, setAiCustomDraftText] = useState('');
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // Phone editing states
  const [editingPhoneCustomerId, setEditingPhoneCustomerId] = useState<string | null>(null);
  const [editingPhoneName, setEditingPhoneName] = useState('');
  const [editingPhoneValue, setEditingPhoneValue] = useState('');

  // Transaction edit/delete states
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Inventory tracking
  const [inventory, setInventory] = useState<InventoryEntry[]>([]);

  // Analytics Period filtering states
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'this_month' | 'last_month' | 'last_30_days' | 'all'>('this_month');
  const [isAnalyticsPeriodModalOpen, setIsAnalyticsPeriodModalOpen] = useState(false);

  // Flag to prevent persistence overwriting database before loading is finished
  const [isLoaded, setIsLoaded] = useState(false);

  // Load storage states with SQLite persistence & seamless AsyncStorage migration
  useEffect(() => {
    async function loadSavedData() {
      let loadedCustomers: Customer[] = [];
      let loadedTransactions: Transaction[] = [];
      let loadedInventory: InventoryEntry[] = [];

      try {
        // 1. Get/create singleton DB connection (safe against double-open)
        const db = await getDb();
        dbRef.current = db;

        // 2. Initialize all schemas in a single atomic execAsync call
        await db.execAsync(`
          PRAGMA journal_mode=WAL;
          PRAGMA foreign_keys = ON;

          CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY NOT NULL,
            value TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            totalGheeKg REAL DEFAULT 0,
            pendingAmount REAL DEFAULT 0,
            notes TEXT,
            createdAt INTEGER NOT NULL
          );

          CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY NOT NULL,
            customerId TEXT NOT NULL,
            customerName TEXT NOT NULL,
            type TEXT NOT NULL,
            quantityKg REAL DEFAULT 0,
            ratePerKg REAL DEFAULT 0,
            totalAmount REAL DEFAULT 0,
            amountPaid REAL DEFAULT 0,
            date TEXT NOT NULL,
            notes TEXT
          );

          CREATE TABLE IF NOT EXISTS inventory (
            id TEXT PRIMARY KEY NOT NULL,
            type TEXT NOT NULL,
            quantityKg REAL DEFAULT 0,
            notes TEXT,
            date TEXT NOT NULL,
            txId TEXT
          );
        `);

        // 3. Check and execute automatic migration from AsyncStorage
        const migrationRow = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['ghee_sqlite_migrated']);
        const isMigrated = migrationRow?.value === 'true';

        if (!isMigrated) {
          console.log("Starting legacy AsyncStorage to SQLite ledger migration...");
          const savedCustomers = await AsyncStorage.getItem('ghee_customers');
          const savedTx = await AsyncStorage.getItem('ghee_transactions');
          const savedInventory = await AsyncStorage.getItem('ghee_inventory');

          // Migrate Customers
          if (savedCustomers) {
            try {
              const parsedCustomers = JSON.parse(savedCustomers);
              if (Array.isArray(parsedCustomers)) {
                await db.withTransactionAsync(async () => {
                  for (const c of parsedCustomers) {
                    await db.runAsync(
                      'INSERT OR REPLACE INTO customers (id, name, phone, totalGheeKg, pendingAmount, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
                      [c.id, c.name, c.phone || '', c.totalGheeKg || 0, c.pendingAmount || 0, c.notes || '', c.createdAt || Date.now()]
                    );
                  }
                });
              }
            } catch (e) {
              console.error("Customers migration failed:", e);
            }
          }

          // Migrate Transactions
          if (savedTx) {
            try {
              const parsedTx = JSON.parse(savedTx);
              if (Array.isArray(parsedTx)) {
                await db.withTransactionAsync(async () => {
                  for (const t of parsedTx) {
                    await db.runAsync(
                      'INSERT OR REPLACE INTO transactions (id, customerId, customerName, type, quantityKg, ratePerKg, totalAmount, amountPaid, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                      [t.id, t.customerId, t.customerName, t.type, t.quantityKg || 0, t.ratePerKg || 0, t.totalAmount || 0, t.amountPaid || 0, t.date, t.notes || '']
                    );
                  }
                });
              }
            } catch (e) {
              console.error("Transactions migration failed:", e);
            }
          }

          // Migrate Inventory
          if (savedInventory) {
            try {
              const parsedInventory = JSON.parse(savedInventory);
              if (Array.isArray(parsedInventory)) {
                await db.withTransactionAsync(async () => {
                  for (const i of parsedInventory) {
                    await db.runAsync(
                      'INSERT OR REPLACE INTO inventory (id, type, quantityKg, notes, date, txId) VALUES (?, ?, ?, ?, ?, ?)',
                      [i.id, i.type, i.quantityKg || 0, i.notes || '', i.date, i.txId || '']
                    );
                  }
                });
              }
            } catch (e) {
              console.error("Inventory migration failed:", e);
            }
          }

          // Migrate all configurations and API keys
          const keysToMigrate = [
            'ghee_biz_name', 'ghee_upi_id', 'ghee_def_rate', 'ghee_api_key',
            'ghee_gemini_model', 'ghee_sync_code', 'ghee_bucket_id',
            'ghee_weight_presets', 'ghee_rate_presets'
          ];
          for (const key of keysToMigrate) {
            try {
              const val = await AsyncStorage.getItem(key);
              if (val) {
                await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, val]);
              }
            } catch (e) {
              console.error(`Setting migration failed for ${key}:`, e);
            }
          }

          // Flag as successfully migrated
          await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_sqlite_migrated', 'true']);
          console.log("AsyncStorage data successfully ported to SQLite database!");
        }

        // 4. Fetch loaded tables from SQLite
        const customersRows = await db.getAllAsync<any>('SELECT * FROM customers ORDER BY createdAt DESC');
        loadedCustomers = customersRows.map(row => ({
          id: row.id,
          name: row.name,
          phone: row.phone,
          totalGheeKg: row.totalGheeKg,
          pendingAmount: row.pendingAmount,
          notes: row.notes,
          createdAt: row.createdAt
        }));

        const transactionsRows = await db.getAllAsync<any>('SELECT * FROM transactions ORDER BY date DESC, id DESC');
        loadedTransactions = transactionsRows.map(row => ({
          id: row.id,
          customerId: row.customerId,
          customerName: row.customerName,
          type: row.type,
          quantityKg: row.quantityKg,
          ratePerKg: row.ratePerKg,
          totalAmount: row.totalAmount,
          amountPaid: row.amountPaid,
          date: row.date,
          notes: row.notes
        }));

        // Self-heal/reconstruct orphaned clients that have transactions but no client profile (e.g. Kamlesh)
        const customerIds = new Set(loadedCustomers.map(c => c.id));
        const missingCustomersMap = new Map<string, Customer>();

        for (const tx of loadedTransactions) {
          if (!customerIds.has(tx.customerId)) {
            let reconstructedCust = missingCustomersMap.get(tx.customerId);
            if (!reconstructedCust) {
              reconstructedCust = {
                id: tx.customerId,
                name: tx.customerName || "Unknown Client",
                phone: '',
                totalGheeKg: 0,
                pendingAmount: 0,
                notes: 'Auto-reconstructed after database sync recovery',
                createdAt: Date.now()
              };
            }

            const isSale = tx.type === 'sale';
            const balanceChange = isSale ? (tx.totalAmount - tx.amountPaid) : -tx.amountPaid;

            reconstructedCust.totalGheeKg += isSale ? tx.quantityKg : 0;
            reconstructedCust.pendingAmount += balanceChange;

            missingCustomersMap.set(tx.customerId, reconstructedCust);
          }
        }

        if (missingCustomersMap.size > 0) {
          const reconstructed = Array.from(missingCustomersMap.values());
          loadedCustomers = [...loadedCustomers, ...reconstructed];

          // Persist reconstructed client profiles directly (we are already inside the db queue)
          try {
            await db.withTransactionAsync(async () => {
              for (const c of reconstructed) {
                await db.runAsync(
                  'INSERT OR REPLACE INTO customers (id, name, phone, totalGheeKg, pendingAmount, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
                  [c.id, c.name, c.phone, c.totalGheeKg, c.pendingAmount, c.notes, c.createdAt]
                );
              }
            });
            console.log("Reconstructed customer profiles saved to SQLite.");
          } catch (dbErr) {
            console.error("Failed to save reconstructed customers:", dbErr);
          }
        }

        const inventoryRows = await db.getAllAsync<any>('SELECT * FROM inventory ORDER BY date DESC, id DESC');
        loadedInventory = inventoryRows.map(row => ({
          id: row.id,
          type: row.type as 'add' | 'dispatch',
          quantityKg: row.quantityKg,
          notes: row.notes,
          date: row.date,
          txId: row.txId || undefined
        }));

        // 5. Fetch settings from SQLite
        const bizNameRow = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['ghee_biz_name']);
        if (bizNameRow) setBusinessName(bizNameRow.value);

        const upiRow = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['ghee_upi_id']);
        if (upiRow) setUpiId(upiRow.value);

        const apiKeyRow = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['ghee_api_key']);
        if (apiKeyRow) setApiKey(apiKeyRow.value);

        const modelRow = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['ghee_gemini_model']);
        if (modelRow) setGeminiModel(modelRow.value);

        const syncCodeRow = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['ghee_sync_code']);
        if (syncCodeRow) setSyncCode(syncCodeRow.value);

        const bucketIdRow = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['ghee_bucket_id']);
        if (bucketIdRow) setBucketId(bucketIdRow.value);

        const rateRow = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['ghee_def_rate']);
        if (rateRow) {
          const rateVal = parseFloat(rateRow.value) || 0;
          setDefaultRate(rateVal);
          setQuickTx(prev => ({ ...prev, ratePerKg: rateVal, amountPaid: rateVal }));
        }

        const weightRow = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['ghee_weight_presets']);
        if (weightRow) {
          const w = JSON.parse(weightRow.value);
          if (Array.isArray(w)) {
            setWeightPresets(w);
            setWeightPresetsInput(w.join(', '));
          }
        }

        const ratePresRow = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['ghee_rate_presets']);
        if (ratePresRow) {
          const r = JSON.parse(ratePresRow.value);
          if (Array.isArray(r)) {
            setRatePresets(r);
            setRatePresetsInput(r.join(', '));
          }
        }

        const hasStartedRow = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['ghee_has_started']);
        if (hasStartedRow) {
          setHasStarted(hasStartedRow.value === 'true');
        } else {
          setHasStarted(false); // Default to false if not found
        }
 
        const lastBackupRow = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['ghee_last_backup']);
        if (lastBackupRow) {
          setLastBackupTime(lastBackupRow.value);
        } else {
          setLastBackupTime('Never');
        }

      } catch (err) {
        console.error("Fatal SQLite initialization/loading error:", err);
        Alert.alert("Database Error", "GheeLedger failed to open the secure local database engine.");
      } finally {
        skipNextSaveRef.current = { customers: true, transactions: true, inventory: true, settings: true };
        setCustomers(loadedCustomers);
        setTransactions(loadedTransactions);
        setInventory(loadedInventory);
        setIsLoaded(true);
      }
    }
    enqueueDbOp(async () => {
      await loadSavedData();
    });
  }, [enqueueDbOp]);

  // Save changes to SQLite (ACID transactional writes)
  useEffect(() => {
    if (isLoaded && dbRef.current) {
      if (skipNextSaveRef.current.customers) {
        skipNextSaveRef.current.customers = false;
        return;
      }
      const db = dbRef.current;
      const currentCustomers = [...customers];

      enqueueDbOp(async () => {
        try {
          await db.withTransactionAsync(async () => {
            await db.runAsync('DELETE FROM customers');
            for (const c of currentCustomers) {
              await db.runAsync(
                'INSERT INTO customers (id, name, phone, totalGheeKg, pendingAmount, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [c.id, c.name, c.phone || '', c.totalGheeKg || 0, c.pendingAmount || 0, c.notes || '', c.createdAt]
              );
            }
          });
        } catch (e) {
          console.error("Customers SQLite transaction failed:", e);
        }
      });
    }
  }, [customers, isLoaded, enqueueDbOp]);

  useEffect(() => {
    if (isLoaded && dbRef.current) {
      if (skipNextSaveRef.current.transactions) {
        skipNextSaveRef.current.transactions = false;
        return;
      }
      const db = dbRef.current;
      const currentTx = [...transactions];

      enqueueDbOp(async () => {
        try {
          await db.withTransactionAsync(async () => {
            await db.runAsync('DELETE FROM transactions');
            for (const t of currentTx) {
              await db.runAsync(
                'INSERT OR REPLACE INTO transactions (id, customerId, customerName, type, quantityKg, ratePerKg, totalAmount, amountPaid, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [t.id, t.customerId, t.customerName, t.type, t.quantityKg || 0, t.ratePerKg || 0, t.totalAmount || 0, t.amountPaid || 0, t.date, t.notes || '']
              );
            }
          });
        } catch (e) {
          console.error("Transactions SQLite transaction failed:", e);
        }
      });
    }
  }, [transactions, isLoaded, enqueueDbOp]);

  useEffect(() => {
    if (isLoaded && dbRef.current) {
      if (skipNextSaveRef.current.inventory) {
        skipNextSaveRef.current.inventory = false;
        return;
      }
      const db = dbRef.current;
      const currentInv = [...inventory];

      enqueueDbOp(async () => {
        try {
          await db.withTransactionAsync(async () => {
            await db.runAsync('DELETE FROM inventory');
            for (const i of currentInv) {
              await db.runAsync(
                'INSERT OR REPLACE INTO inventory (id, type, quantityKg, notes, date, txId) VALUES (?, ?, ?, ?, ?, ?)',
                [i.id, i.type, i.quantityKg || 0, i.notes || '', i.date, i.txId || '']
              );
            }
          });
        } catch (e) {
          console.error("Inventory SQLite transaction failed:", e);
        }
      });
    }
  }, [inventory, isLoaded, enqueueDbOp]);

  // Auto-save settings changes to SQLite setting database
  useEffect(() => {
    if (isLoaded && dbRef.current) {
      if (skipNextSaveRef.current.settings) {
        skipNextSaveRef.current.settings = false;
        return;
      }
      const db = dbRef.current;
      enqueueDbOp(async () => {
        try {
          await db.withTransactionAsync(async () => {
            await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_biz_name', businessName]);
            await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_upi_id', upiId]);
            await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_def_rate', defaultRate.toString()]);
            await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_api_key', apiKey]);
            await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_gemini_model', geminiModel]);
            await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_sync_code', syncCode]);
            await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_bucket_id', bucketId]);
            await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_weight_presets', JSON.stringify(weightPresets)]);
            await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_rate_presets', JSON.stringify(ratePresets)]);
            await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_has_started', hasStarted ? 'true' : 'false']);
          });
        } catch (e) {
          console.error("Settings SQLite transaction failed:", e);
        }
      });
    }
  }, [businessName, upiId, defaultRate, apiKey, geminiModel, syncCode, bucketId, weightPresets, ratePresets, hasStarted, isLoaded, enqueueDbOp]);

  // Reset active settings sub-section when switching tabs
  useEffect(() => {
    if (activeTab !== 'settings') {
      setActiveSettingsSection(null);
    }
  }, [activeTab]);

  // Clean up toast timer on unmount (Bug #28)
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const triggerNotification = (message: string, type?: 'success' | 'error') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    setToastType(type || 'success');
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, type === 'error' ? 5000 : 3000);
  };

  // Aggregated analytical statistics
  const metrics = useMemo(() => {
    const totalPending = customers.reduce((sum, item) => sum + item.pendingAmount, 0);
    const volumeKg = customers.reduce((sum, item) => sum + item.totalGheeKg, 0);
    const dueAccounts = customers.filter(c => c.pendingAmount > 0).length;
    // Only count amountPaid from sale transactions for collection rate calculation
    const cashCollectedFromSales = transactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + t.amountPaid, 0);
    // Total cash includes standalone payment receipts too
    const totalCashReceived = transactions.reduce((sum, t) => sum + t.amountPaid, 0);
    const totalSalesRevenue = transactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + t.totalAmount, 0);

    const topBuyers = [...customers]
      .sort((a, b) => b.totalGheeKg - a.totalGheeKg)
      .slice(0, 3);

    const collectionRate = totalSalesRevenue > 0
      ? Math.min(100, Math.round((totalCashReceived / totalSalesRevenue) * 100))
      : 100;

    return { totalPending, volumeKg, dueAccounts, cashCollected: totalCashReceived, totalSalesRevenue, topBuyers, collectionRate };
  }, [customers, transactions]);
 
  const backupRecords = useMemo(() => {
    return customers.length + transactions.length + inventory.length;
  }, [customers, transactions, inventory]);
 
  const backupSizeFormatted = useMemo(() => {
    try {
      const payload = {
        customers,
        transactions,
        inventory,
        businessName,
        upiId,
        defaultRate,
        weightPresets,
        ratePresets,
      };
      const payloadStr = JSON.stringify(payload);
      const bytes = payloadStr.length;
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } catch (e) {
      return '0 B';
    }
  }, [customers, transactions, inventory, businessName, upiId, defaultRate, weightPresets, ratePresets]);

  // Sync default rate on settings change safely
  useEffect(() => {
    setQuickTx(prev => ({
      ...prev,
      ratePerKg: defaultRate,
      amountPaid: prev.type === 'sale' ? Math.round(prev.quantityKg * defaultRate) : prev.amountPaid
    }));
  }, [defaultRate]);

  // Speech template message body
  const reminderMessage = useMemo(() => {
    if (!selectedCustomerId) return '';
    const profile = customers.find(c => c.id === selectedCustomerId);
    if (!profile) return '';
    const dues = profile.pendingAmount;
    if (activeReminderTemplate === 'gentle') {
      return `Hello ${profile.name}, this is a gentle reminder that an outstanding amount of ₹${dues} is pending for your recent Ghee deliveries from ${businessName}. You can pay directly via UPI at ${upiId}. Thank you!`;
    } else if (activeReminderTemplate === 'professional') {
      return `Dear ${profile.name}, we hope you are doing well. This is a formal statement regarding the outstanding balance of ₹${dues} on your account with ${businessName}. Please settle the dues at your earliest convenience using UPI ID: ${upiId}. Let us know if you need a detailed statement.`;
    } else if (activeReminderTemplate === 'urgent') {
      return `Urgent: Hello ${profile.name}, your account balance of ₹${dues} with ${businessName} is overdue. Please settle this immediately to continue uninterrupted deliveries. UPI ID: ${upiId}. If already paid, please ignore or send us the receipt.`;
    }
    return '';
  }, [activeReminderTemplate, selectedCustomerId, customers, businessName, upiId]);

  // Operations
  const deleteCustomer = (customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    setTransactions(prev => prev.filter(t => t.customerId !== customerId));
    setSelectedCustomerId(null);
    setDeleteConfirmationId(null);
    triggerNotification('Customer portfolio deleted.');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (activeTab === 'client-profile') {
      setActiveTab('customers');
    }
  };

  // Transaction delete: reverse the customer balance/volume effect
  const deleteTransaction = (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    // Reverse the effect on the customer
    setCustomers(prev => prev.map(c => {
      if (c.id === tx.customerId) {
        const isSale = tx.type === 'sale';
        return {
          ...c,
          totalGheeKg: c.totalGheeKg - (isSale ? tx.quantityKg : 0),
          pendingAmount: c.pendingAmount - (isSale ? (tx.totalAmount - tx.amountPaid) : -tx.amountPaid)
        };
      }
      return c;
    }));

    // Remove linked inventory dispatch entry
    setInventory(prev => prev.filter(inv => inv.txId !== txId));

    setTransactions(prev => prev.filter(t => t.id !== txId));
    triggerNotification('Transaction deleted.');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  // Transaction edit: reverse old effect, apply new effect
  const saveEditedTransaction = (updatedTx: Transaction) => {
    const oldTx = transactions.find(t => t.id === updatedTx.id);
    if (!oldTx) return;

    setCustomers(prev => prev.map(c => {
      if (c.id === oldTx.customerId) {
        const oldIsSale = oldTx.type === 'sale';
        const newIsSale = updatedTx.type === 'sale';
        // Reverse old
        let ghee = c.totalGheeKg - (oldIsSale ? oldTx.quantityKg : 0);
        let pending = c.pendingAmount - (oldIsSale ? (oldTx.totalAmount - oldTx.amountPaid) : -oldTx.amountPaid);
        // Apply new
        ghee += newIsSale ? updatedTx.quantityKg : 0;
        pending += newIsSale ? (updatedTx.totalAmount - updatedTx.amountPaid) : -updatedTx.amountPaid;
        return { ...c, totalGheeKg: ghee, pendingAmount: pending };
      }
      return c;
    }));

    // Update linked inventory entry if quantity changed
    if (oldTx.type === 'sale' && updatedTx.type === 'sale' && oldTx.quantityKg !== updatedTx.quantityKg) {
      setInventory(prev => prev.map(inv => {
        if (inv.txId === updatedTx.id) {
          return { ...inv, quantityKg: updatedTx.quantityKg, notes: `Dispatch to ${updatedTx.customerName} (edited)` };
        }
        return inv;
      }));
    }

    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
    setEditingTransaction(null);
    triggerNotification('Transaction updated.');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Inventory: add stock
  const addInventoryStock = (quantityKg: number, notes: string) => {
    const entry: InventoryEntry = {
      id: 'inv_' + Date.now(),
      type: 'add',
      quantityKg,
      date: new Date().toISOString().split('T')[0],
      notes: notes || 'Stock added'
    };
    setInventory(prev => [entry, ...prev]);
    triggerNotification(`Added ${quantityKg} kg to inventory.`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleOpenEditPhone = (customerId: string, customerName: string, currentPhone: string) => {
    setEditingPhoneCustomerId(customerId);
    setEditingPhoneName(customerName);
    setEditingPhoneValue(currentPhone === '9999999999' ? '' : currentPhone);
  };

  const updateCustomerPhone = (customerId: string, newPhone: string) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        return {
          ...c,
          phone: newPhone
        };
      }
      return c;
    }));
    triggerNotification('Phone number updated successfully!');
  };

  const registerNewCustomer = (e: any) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim() || !newCustomerForm.phone.trim()) {
      triggerNotification('Name and mobile phone are required.', 'error');
      return;
    }
    const phoneDigits = newCustomerForm.phone.replace(/[^0-9]/g, '');
    if (phoneDigits.length < 10) {
      triggerNotification('Please enter a valid 10-digit phone number.', 'error');
      return;
    }

    // Bug #16: Check for duplicate name or phone
    const trimmedName = newCustomerForm.name.trim().toLowerCase();
    const duplicate = customers.find(
      c => c.name.trim().toLowerCase() === trimmedName ||
        (phoneDigits.length >= 10 && c.phone.replace(/[^0-9]/g, '') === phoneDigits)
    );
    if (duplicate) {
      Alert.alert(
        'Possible Duplicate',
        `A customer named "${duplicate.name}" (${duplicate.phone}) already exists. Do you still want to register?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Register Anyway', onPress: () => doRegisterCustomer() }
        ]
      );
      return;
    }
    doRegisterCustomer();
  };

  const doRegisterCustomer = () => {
    const now = Date.now();
    const newCustId = 'cust_' + now;
    const initKg = parseFloat(newCustomerForm.initialKg) || 0;
    const initDue = parseFloat(newCustomerForm.initialDue) || 0;

    const newCust: Customer = {
      id: newCustId,
      name: newCustomerForm.name.trim(),
      phone: newCustomerForm.phone.trim(),
      totalGheeKg: initKg,
      pendingAmount: initDue,
      notes: newCustomerForm.notes,
      createdAt: now
    };

    setCustomers(prev => [newCust, ...prev]);

    // Record setup transaction if there is initial activity
    // Bug #5: Use unique suffix to avoid ID collision with customer ID
    if (initKg > 0 || initDue > 0) {
      const initialTx: Transaction = {
        id: 'tx_' + now + '_init',
        customerId: newCustId,
        customerName: newCust.name,
        type: initDue > 0 ? 'sale' : 'payment',
        quantityKg: initKg,
        ratePerKg: initKg > 0 ? Math.round(initDue / initKg) : 0,
        totalAmount: initDue,
        amountPaid: 0,
        date: new Date().toISOString().split('T')[0],
        notes: 'Initial account setup values'
      };
      setTransactions(prev => [initialTx, ...prev]);
    }

    setIsAddCustomerOpen(false);
    setNewCustomerForm({ name: '', phone: '', initialKg: '0', initialDue: '0', notes: '' });
    triggerNotification('Client portfolio registered!');
  };

  const commitQuickTransaction = () => {
    if (!quickTx.customerId) {
      triggerNotification('Please select a customer.');
      return;
    }
    const customer = customers.find(c => c.id === quickTx.customerId);
    if (!customer) return;

    const isSale = quickTx.type === 'sale';
    const quantity = isSale ? quickTx.quantityKg : 0;
    const rate = isSale ? quickTx.ratePerKg : 0;
    const calculatedBill = isSale ? Math.round(quantity * rate) : 0;
    const paid = quickTx.amountPaid;

    // Bug #35: Input bounds validation
    if (isSale && (quantity <= 0 || quantity > 10000)) {
      triggerNotification('Quantity must be between 0.01 and 10,000 kg.', 'error');
      return;
    }
    if (isSale && (rate <= 0 || rate > 100000)) {
      triggerNotification('Rate must be between ₹1 and ₹1,00,000/kg.', 'error');
      return;
    }
    if (paid < 0 || paid > 10000000) {
      triggerNotification('Amount paid must be between ₹0 and ₹1,00,00,000.', 'error');
      return;
    }
    if (!isSale && paid <= 0) {
      triggerNotification('Payment amount must be greater than ₹0.', 'error');
      return;
    }

    const pendingBalanceChange = isSale ? (calculatedBill - paid) : -paid;

    const finalTxId = 'tx_' + Date.now();
    const finalTx: Transaction = {
      id: finalTxId,
      customerId: quickTx.customerId,
      customerName: customer.name,
      type: quickTx.type,
      quantityKg: quantity,
      ratePerKg: rate,
      totalAmount: calculatedBill,
      amountPaid: paid,
      date: quickTx.date,
      notes: quickTx.notes || (isSale ? `Delivered ${quantity} kg Ghee` : 'Payment received')
    };

    setCustomers(prev => prev.map(c => {
      if (c.id === quickTx.customerId) {
        return {
          ...c,
          totalGheeKg: c.totalGheeKg + quantity,
          pendingAmount: c.pendingAmount + pendingBalanceChange
        };
      }
      return c;
    }));

    setTransactions(prev => [finalTx, ...prev]);
    triggerNotification('Ledger record committed!');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setReceiptTxId(finalTxId);

    // Auto-deduct from inventory on dispatch
    if (isSale && quantity > 0) {
      const dispatchEntry: InventoryEntry = {
        id: 'inv_' + Date.now() + '_d',
        type: 'dispatch',
        quantityKg: quantity,
        date: quickTx.date,
        notes: `Dispatch to ${customer.name}`,
        txId: finalTxId
      };
      setInventory(prev => [dispatchEntry, ...prev]);
    }

    setQuickTx({
      customerId: '',
      type: 'sale',
      quantityKg: 1,
      ratePerKg: defaultRate,
      amountPaid: 0,
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowCustomWeight(false);
    setShowCustomRate(false);
    setShowCustomAmount(false);
    setActiveTab('customers');
  };

  const savePresetConfigurations = () => {
    try {
      const parsedWeights = weightPresetsInput
        .split(',')
        .map(w => parseFloat(w.trim()))
        .filter(w => !isNaN(w) && w > 0);

      const parsedRates = ratePresetsInput
        .split(',')
        .map(r => parseInt(r.trim()))
        .filter(r => !isNaN(r) && r > 0);

      if (parsedWeights.length === 0 || parsedRates.length === 0) {
        triggerNotification('Invalid presets format. Use comma separated numbers.');
        return;
      }

      setWeightPresets(parsedWeights);
      setRatePresets(parsedRates);
      const trimmedKey = apiKey.trim();
      setApiKey(trimmedKey);

      triggerNotification('Settings successfully saved!');
    } catch (err) {
      triggerNotification('Error parsing presets.');
    }
  };

  // restoreSampleData removed

  // Bug #8: Clear ALL AsyncStorage keys on database wipe (including secure backups)
  const clearDatabase = async () => {
    setCustomers([]);
    setTransactions([]);
    setInventory([]);
    await AsyncStorage.multiRemove([
      'ghee_customers',
      'ghee_transactions',
      'ghee_inventory',
      'ghee_biz_name',
      'ghee_upi_id',
      'ghee_def_rate',
      'ghee_api_key',
      'ghee_gemini_model',
      'ghee_sync_code',
      'ghee_bucket_id',
      'ghee_weight_presets',
      'ghee_rate_presets',
      'ghee_customers_backup',
      'ghee_transactions_backup',
    ]);
    setBusinessName('Vedic Ghee Farm');
    setUpiId('ghee@upi');
    setDefaultRate(1300);
    setSyncCode('');
    setBucketId('YHrwq92PpeQAtgKYSUV1q7');
    setWeightPresets([0.5, 1, 2, 5]);
    setRatePresets([1200, 1300, 1450]);
    setWeightPresetsInput('0.5, 1, 2, 5');
    setRatePresetsInput('1200, 1300, 1450');
    setHasStarted(false);
    triggerNotification('Ledger database and all settings completely wiped.');
  };

  const mergeBackupData = (
    localCusts: Customer[],
    localTxs: Transaction[],
    localInv: InventoryEntry[],
    incomingCusts: Customer[],
    incomingTxs: Transaction[],
    incomingInv: InventoryEntry[]
  ) => {
    const safeIncomingCusts = incomingCusts || [];
    const safeIncomingTxs = incomingTxs || [];
    const safeIncomingInv = incomingInv || [];

    const mergedCustomersMap = new Map<string, Customer>();

    // 1. Union customers by ID
    for (const cust of safeIncomingCusts) {
      mergedCustomersMap.set(cust.id, { ...cust });
    }
    for (const cust of localCusts) {
      if (mergedCustomersMap.has(cust.id)) {
        const existing = mergedCustomersMap.get(cust.id)!;
        mergedCustomersMap.set(cust.id, {
          ...existing,
          ...cust, // Local edits/metadata take precedence
        });
      } else {
        mergedCustomersMap.set(cust.id, { ...cust });
      }
    }

    // 2. Union transactions by ID
    const mergedTransactionsMap = new Map<string, Transaction>();
    for (const tx of safeIncomingTxs) {
      mergedTransactionsMap.set(tx.id, { ...tx });
    }
    for (const tx of localTxs) {
      mergedTransactionsMap.set(tx.id, { ...tx });
    }

    const mergedTransactionsList = Array.from(mergedTransactionsMap.values());

    // 3. Union inventory by ID
    const mergedInventoryMap = new Map<string, InventoryEntry>();
    for (const inv of safeIncomingInv) {
      mergedInventoryMap.set(inv.id, { ...inv });
    }
    for (const inv of localInv) {
      mergedInventoryMap.set(inv.id, { ...inv });
    }
    const mergedInventoryList = Array.from(mergedInventoryMap.values());

    // Helper to get chronological timestamp
    const getTxTimestamp = (tx: Transaction): number => {
      if (tx.id.startsWith('tx_')) {
        const tsStr = tx.id.substring(3);
        const ts = parseInt(tsStr, 10);
        if (!isNaN(ts)) {
          return ts;
        }
      }
      return new Date(tx.date).getTime() || 0;
    };

    // Sort chronologically (oldest first) for correct balance calculation
    mergedTransactionsList.sort((a, b) => getTxTimestamp(a) - getTxTimestamp(b));

    // Reset customer running balances in the map, but remember their current values
    const initialCustomerBalances = new Map<string, { totalGheeKg: number; pendingAmount: number }>();
    for (const [id, cust] of mergedCustomersMap.entries()) {
      initialCustomerBalances.set(id, {
        totalGheeKg: cust.totalGheeKg,
        pendingAmount: cust.pendingAmount,
      });
      mergedCustomersMap.set(id, {
        ...cust,
        totalGheeKg: 0,
        pendingAmount: 0,
      });
    }

    const customerHasTransactions = new Set<string>();

    // Recalculate balances by iterating through chronologically sorted transactions
    for (const tx of mergedTransactionsList) {
      let cust = mergedCustomersMap.get(tx.customerId);
      if (!cust) {
        // Reconstruct missing customer profile
        cust = {
          id: tx.customerId,
          name: tx.customerName || "Unknown Client",
          phone: '',
          totalGheeKg: 0,
          pendingAmount: 0,
          notes: 'Auto-reconstructed after database sync recovery',
          createdAt: Date.now()
        };
        mergedCustomersMap.set(tx.customerId, cust);
      }

      customerHasTransactions.add(tx.customerId);
      const isSale = tx.type === 'sale';
      const qty = tx.quantityKg;
      const paid = tx.amountPaid;
      const bill = tx.totalAmount;
      const balanceChange = isSale ? (bill - paid) : -paid;

      const newTotalGhee = cust.totalGheeKg + qty;
      const newPendingAmount = cust.pendingAmount + balanceChange;

      mergedCustomersMap.set(tx.customerId, {
        ...cust,
        totalGheeKg: newTotalGhee,
        pendingAmount: newPendingAmount,
      });
    }

    // For any customers that had NO transactions, restore their original values
    for (const [id, cust] of mergedCustomersMap.entries()) {
      if (!customerHasTransactions.has(id)) {
        const orig = initialCustomerBalances.get(id);
        if (orig) {
          mergedCustomersMap.set(id, {
            ...cust,
            totalGheeKg: orig.totalGheeKg,
            pendingAmount: orig.pendingAmount,
          });
        }
      }
    }

    // Sort transactions in reverse chronological order (newest first)
    const finalTransactionsList = [...mergedTransactionsList].sort((a, b) => getTxTimestamp(b) - getTxTimestamp(a));
    const finalCustomersList = Array.from(mergedCustomersMap.values());
    const finalInventoryList = [...mergedInventoryList].sort((a, b) => b.date.localeCompare(a.date));

    return {
      customers: finalCustomersList,
      transactions: finalTransactionsList,
      inventory: finalInventoryList,
    };
  };

  const onImportBackupJSON = (jsonStr: string) => {
    // Bug #27: Guard against extremely large imports
    if (jsonStr.length > 5 * 1024 * 1024) {
      triggerNotification('Backup data is too large (>5MB). Please use a smaller file.', 'error');
      return;
    }
    try {
      const data = JSON.parse(jsonStr);
      if (data.customers && data.transactions) {
        // Bug #25: Confirm before overwriting settings
        const hasSettings = data.businessName || data.upiId || data.defaultRate;
        const doMerge = () => {
          const merged = mergeBackupData(
            customers,
            transactions,
            inventory,
            data.customers,
            data.transactions,
            data.inventory
          );

          // Prevent useEffect hooks from double-saving/conflicting
          skipNextSaveRef.current = { customers: true, transactions: true, inventory: true, settings: true };

          setCustomers(merged.customers);
          setTransactions(merged.transactions);
          setInventory(merged.inventory);
          if (data.businessName) setBusinessName(data.businessName);
          if (data.upiId) setUpiId(data.upiId);
          if (data.defaultRate) setDefaultRate(data.defaultRate);
          if (data.weightPresets) {
            setWeightPresets(data.weightPresets);
            setWeightPresetsInput(data.weightPresets.join(', '));
          }
          if (data.ratePresets) {
            setRatePresets(data.ratePresets);
            setRatePresetsInput(data.ratePresets.join(', '));
          }

          // Save to SQLite
          if (dbRef.current) {
            const db = dbRef.current;
            enqueueDbOp(async () => {
              try {
                await db.withTransactionAsync(async () => {
                  // 1. Wipe and rewrite customers
                  await db.runAsync('DELETE FROM customers');
                  for (const c of merged.customers) {
                    await db.runAsync(
                      'INSERT OR REPLACE INTO customers (id, name, phone, totalGheeKg, pendingAmount, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
                      [c.id, c.name, c.phone || '', c.totalGheeKg || 0, c.pendingAmount || 0, c.notes || '', c.createdAt || Date.now()]
                    );
                  }

                  // 2. Wipe and rewrite transactions
                  await db.runAsync('DELETE FROM transactions');
                  for (const t of merged.transactions) {
                    await db.runAsync(
                      'INSERT OR REPLACE INTO transactions (id, customerId, customerName, type, quantityKg, ratePerKg, totalAmount, amountPaid, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                      [t.id, t.customerId, t.customerName, t.type, t.quantityKg || 0, t.ratePerKg || 0, t.totalAmount || 0, t.amountPaid || 0, t.date, t.notes || '']
                    );
                  }

                  // 3. Wipe and rewrite inventory
                  await db.runAsync('DELETE FROM inventory');
                  for (const i of merged.inventory) {
                    await db.runAsync(
                      'INSERT OR REPLACE INTO inventory (id, type, quantityKg, notes, date, txId) VALUES (?, ?, ?, ?, ?, ?)',
                      [i.id, i.type, i.quantityKg || 0, i.notes || '', i.date, i.txId || '']
                    );
                  }

                  // 4. Save settings to SQLite
                  if (data.businessName) await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_biz_name', data.businessName]);
                  if (data.upiId) await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_upi_id', data.upiId]);
                  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_def_rate', (data.defaultRate || defaultRate).toString()]);
                  if (data.weightPresets) await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_weight_presets', JSON.stringify(data.weightPresets)]);
                  if (data.ratePresets) await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_rate_presets', JSON.stringify(data.ratePresets)]);
                });
              } catch (dbErr) {
                console.error("SQLite write failed during JSON import:", dbErr);
              }
            });
          }

          triggerNotification('Backup payload merged successfully!');
        };

        if (hasSettings) {
          Alert.alert(
            'Import Settings?',
            'This backup contains business settings (name, UPI, rate). Importing will overwrite your current settings. Continue?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Merge Data Only', onPress: () => {
                  // Merge only customer/transaction data, skip settings
                  const merged = mergeBackupData(customers, transactions, inventory, data.customers, data.transactions, data.inventory);
                  
                  // Prevent useEffect hooks from double-saving/conflicting
                  skipNextSaveRef.current = { customers: true, transactions: true, inventory: true, settings: true };
                  
                  setCustomers(merged.customers);
                  setTransactions(merged.transactions);
                  setInventory(merged.inventory);

                  // Save to SQLite
                  if (dbRef.current) {
                    const db = dbRef.current;
                    enqueueDbOp(async () => {
                      try {
                        await db.withTransactionAsync(async () => {
                          await db.runAsync('DELETE FROM customers');
                          for (const c of merged.customers) {
                            await db.runAsync(
                              'INSERT OR REPLACE INTO customers (id, name, phone, totalGheeKg, pendingAmount, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
                              [c.id, c.name, c.phone || '', c.totalGheeKg || 0, c.pendingAmount || 0, c.notes || '', c.createdAt || Date.now()]
                            );
                          }
                          await db.runAsync('DELETE FROM transactions');
                          for (const t of merged.transactions) {
                            await db.runAsync(
                              'INSERT OR REPLACE INTO transactions (id, customerId, customerName, type, quantityKg, ratePerKg, totalAmount, amountPaid, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                              [t.id, t.customerId, t.customerName, t.type, t.quantityKg || 0, t.ratePerKg || 0, t.totalAmount || 0, t.amountPaid || 0, t.date, t.notes || '']
                            );
                          }
                          await db.runAsync('DELETE FROM inventory');
                          for (const i of merged.inventory) {
                            await db.runAsync(
                              'INSERT OR REPLACE INTO inventory (id, type, quantityKg, notes, date, txId) VALUES (?, ?, ?, ?, ?, ?)',
                              [i.id, i.type, i.quantityKg || 0, i.notes || '', i.date, i.txId || '']
                            );
                          }
                        });
                      } catch (dbErr) {
                        console.error("SQLite write failed during JSON data-only import:", dbErr);
                      }
                    });
                  }
                  triggerNotification('Data merged (settings kept unchanged).');
                }
              },
              { text: 'Import All', onPress: doMerge }
            ]
          );
        } else {
          doMerge();
        }
      } else {
        triggerNotification('Invalid backup format.', 'error');
      }
    } catch (e) {
      triggerNotification('Error parsing backup text.', 'error');
    }
  };

  const getBackupPayload = () => {
    return {
      customers,
      transactions,
      inventory,
      businessName,
      upiId,
      defaultRate,
      weightPresets,
      ratePresets,
    };
  };

  const backupToCloud = async (code: string) => {
    if (!code || code.trim() === '') {
      triggerNotification('Please enter a valid Sync Code.', 'error');
      return;
    }
    const trimmedCode = code.trim();
    setIsSyncing(true);
    try {
      const payload = getBackupPayload();
      const response = await fetch(`https://kvdb.io/${bucketId}/${trimmedCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        // Create formatted timestamp
        const nowStr = new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }).replace(/,/g, ' •'); // Formats like "15 May 2024 • 10:30 AM"

        setSyncCode(trimmedCode);
        setLastBackupTime(nowStr);

        if (dbRef.current) {
          const db = dbRef.current;
          enqueueDbOp(async () => {
            try {
              await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_sync_code', trimmedCode]);
              await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_bucket_id', bucketId]);
              await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_last_backup', nowStr]);
            } catch (err) {
              console.error("Failed to write sync settings after backup:", err);
            }
          });
        }
        triggerNotification('Database successfully backed up to cloud!');
      } else {
        triggerNotification('Cloud backup failed: ' + response.statusText, 'error');
      }
    } catch (err: any) {
      triggerNotification('Cloud backup error: ' + (err.message || err), 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const restoreFromCloud = async (code: string) => {
    if (!code || code.trim() === '') {
      triggerNotification('Please enter a valid Sync Code.', 'error');
      return;
    }
    const trimmedCode = code.trim();
    setIsSyncing(true);
    try {
      const response = await fetch(`https://kvdb.io/${bucketId}/${trimmedCode}`);
      if (response.status === 404) {
        triggerNotification('Sync Code not found on cloud server.', 'error');
        return;
      }
      if (!response.ok) {
        triggerNotification('Cloud restore failed: ' + response.status, 'error');
        return;
      }
      const dataStr = await response.text();
      const data = JSON.parse(dataStr);
      if (data.customers && data.transactions) {
        const merged = mergeBackupData(
          customers,
          transactions,
          inventory,
          data.customers,
          data.transactions,
          data.inventory
        );

        // Prevent useEffect hooks from double-saving/conflicting
        skipNextSaveRef.current = { customers: true, transactions: true, inventory: true, settings: true };

        setCustomers(merged.customers);
        setTransactions(merged.transactions);
        setInventory(merged.inventory);
        if (data.businessName) setBusinessName(data.businessName);
        if (data.upiId) setUpiId(data.upiId);
        if (data.defaultRate) setDefaultRate(data.defaultRate);
        if (data.weightPresets) {
          setWeightPresets(data.weightPresets);
          setWeightPresetsInput(data.weightPresets.join(', '));
        }
        if (data.ratePresets) {
          setRatePresets(data.ratePresets);
          setRatePresetsInput(data.ratePresets.join(', '));
        }
        setSyncCode(trimmedCode);

        // Save to SQLite
        if (dbRef.current) {
          const db = dbRef.current;
          enqueueDbOp(async () => {
            try {
              await db.withTransactionAsync(async () => {
                // 1. Wipe and rewrite customers
                await db.runAsync('DELETE FROM customers');
                for (const c of merged.customers) {
                  await db.runAsync(
                    'INSERT OR REPLACE INTO customers (id, name, phone, totalGheeKg, pendingAmount, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [c.id, c.name, c.phone || '', c.totalGheeKg || 0, c.pendingAmount || 0, c.notes || '', c.createdAt || Date.now()]
                  );
                }

                // 2. Wipe and rewrite transactions
                await db.runAsync('DELETE FROM transactions');
                for (const t of merged.transactions) {
                  await db.runAsync(
                    'INSERT OR REPLACE INTO transactions (id, customerId, customerName, type, quantityKg, ratePerKg, totalAmount, amountPaid, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [t.id, t.customerId, t.customerName, t.type, t.quantityKg || 0, t.ratePerKg || 0, t.totalAmount || 0, t.amountPaid || 0, t.date, t.notes || '']
                  );
                }

                // 3. Wipe and rewrite inventory
                await db.runAsync('DELETE FROM inventory');
                for (const i of merged.inventory) {
                  await db.runAsync(
                    'INSERT OR REPLACE INTO inventory (id, type, quantityKg, notes, date, txId) VALUES (?, ?, ?, ?, ?, ?)',
                    [i.id, i.type, i.quantityKg || 0, i.notes || '', i.date, i.txId || '']
                  );
                }

                // 4. Save settings to SQLite
                if (data.businessName) await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_biz_name', data.businessName]);
                if (data.upiId) await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_upi_id', data.upiId]);
                await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_def_rate', (data.defaultRate || defaultRate).toString()]);
                if (data.weightPresets) await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_weight_presets', JSON.stringify(data.weightPresets)]);
                if (data.ratePresets) await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_rate_presets', JSON.stringify(data.ratePresets)]);
                await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_sync_code', trimmedCode]);
                await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_bucket_id', bucketId]);
              });
              console.log("Cloud restore SQLite transaction succeeded.");
            } catch (dbErr) {
              console.error("SQLite write failed during cloud restore:", dbErr);
            }
          });
        }

        triggerNotification('Database successfully merged from cloud!');
      } else {
        triggerNotification('Invalid cloud backup payload structure.', 'error');
      }
    } catch (err: any) {
      triggerNotification('Cloud restore error: ' + (err.message || err), 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // GEMINI CORE REST INTEGRATION WITH EXPONENTIAL BACKOFF
  const callGeminiWithBackoff = async (payload: any, customModel?: string) => {
    const startModel = customModel || geminiModel || "gemini-1.5-flash";
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      throw new Error("Gemini API Key is missing. Please set your Gemini AI API Key in the Settings tab.");
    }

    // Set up model fallback chain
    const modelChain = [startModel];
    if (startModel === "gemini-1.5-flash") {
      modelChain.push("gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro");
    } else if (startModel === "gemini-2.0-flash") {
      modelChain.push("gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro");
    }

    let modelIndex = 0;
    let delay = 1000;
    let lastError: any = null;

    // Detect if payload features require v1beta (v1 stable does NOT support response_schema)
    const requiresBeta =
      payload.system_instruction ||
      payload.systemInstruction ||
      (payload.generation_config && (payload.generation_config.response_schema || payload.generation_config.response_mime_type)) ||
      (payload.generationConfig && (payload.generationConfig.responseSchema || payload.generationConfig.responseMimeType));

    let apiVersion = requiresBeta ? "v1beta" : "v1";

    for (let attempt = 0; attempt < 5; attempt++) {
      const currentModel = modelChain[modelIndex] || startModel;
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/${apiVersion}/models/${currentModel}:generateContent?key=${trimmedKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          return await response.json();
        }

        const errorText = await response.text();
        let errorMessage = errorText;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.error && parsed.error.message) {
            errorMessage = parsed.error.message;
          }
        } catch (_) { }

        lastError = new Error(`Gemini API error (Status ${response.status}): ${errorMessage}`);

        // If we got a 404 (Model not found) on v1, try falling back to v1beta for the next retry
        if (response.status === 404) {
          if (apiVersion === "v1" && !requiresBeta) {
            apiVersion = "v1beta";
            continue;
          } else if (modelIndex < modelChain.length - 1) {
            modelIndex++;
            apiVersion = "v1beta"; // Ensure we use v1beta for fallback models
            continue;
          }
        }

        // Only retry on rate limiting (429) or temporary server errors (5xx)
        if (response.status !== 429 && response.status < 500) {
          throw lastError;
        }
      } catch (err: any) {
        lastError = err;
        // If it's a non-retryable client error, throw immediately
        if (err.message && err.message.includes("Status")) {
          const statusMatch = err.message.match(/Status\s+(\d+)/);
          if (statusMatch) {
            const status = parseInt(statusMatch[1], 10);
            if (status !== 429 && status !== 404 && status < 500) {
              throw err;
            }
          }
        }
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }

    throw lastError || new Error("Unable to contact Gemini AI Services after maximum retries.");
  };

  const generateAISmartDraft = async (lang: string = 'English') => {
    if (!selectedCustomerId) return;
    const profile = customers.find(c => c.id === selectedCustomerId);
    if (!profile) return;

    setIsAiGeneratingDraft(true);
    triggerNotification(`Personalizing payment reminder draft (${lang}) for ${profile.name}...`);

    if (!apiKey) {
      setAiCustomDraftText("Gemini AI API Key is required to generate AI Smart Drafts. Please enter it in the Settings tab.");
      setIsAiGeneratingDraft(false);
      triggerNotification('API Key required in Settings', 'error');
      return;
    }

    const userPrompt = `Generate a highly personalized payment follow-up message for my customer:
    Customer Name: ${profile.name}
    Outstanding Balance: ₹${profile.pendingAmount}
    Deliveries Log notes: "${profile.notes || 'none'}"
    Business/Farm Name: ${businessName}
    My payment UPI ID: ${upiId}
    Tone Guidelines:
    - Polite but firm if dues > 2000, warm and friendly if dues < 1000. Under 80 words.
    Language Guidelines:
    - Write the output message entirely in the language: ${lang}.
    - If ${lang} is Hindi, write using Devanagari script (e.g. नमस्ते).`;

    try {
      const data = await callGeminiWithBackoff({ contents: [{ parts: [{ text: userPrompt }] }] });
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setAiCustomDraftText(text);
        triggerNotification('Smart reminder drafted successfully!');
      } else {
        triggerNotification('Smart reminder drafted no text.', 'error');
      }
    } catch (e: any) {
      console.error("generateAISmartDraft error:", e);
      triggerNotification(e.message || 'Failed to generate draft.', 'error');
    } finally {
      setIsAiGeneratingDraft(false);
    }
  };

  const handleVoiceProcessing = async (speechText: string) => {
    if (!apiKey) {
      triggerNotification('API Key is required to run Voice AI analysis. Please set it in Settings.', 'error');
      return;
    }
    setIsAiProcessing(true);
    triggerNotification('Analyzing spoken statement...');

    const systemPrompt = `You are the Voice AI Assistant and Dictation Parser for GheeLedger, a ghee ledger mobile app.
    Your goal is to analyze spoken or typed statements (which may be in English, Hindi, Hinglish, or broken/informal speech) and classify them into either:
    1. A transaction entry (e.g. "Anita 2 kg Ghee", "Rajesh paid 500 rupees", "अनीता को दो किलो घी दिया", "राजेश ने 500 रुपये दिए") -> resultType: "transaction".
    2. An app command/action (e.g. "go to analytics page", "एनालिटिक्स खोलो", "open Rajesh profile", "राजेश का खाता दिखाओ", "set rate to 1400", "भाव चौदह सौ करो", "print last receipt", "रसीद प्रिंट करो", "share receipt", "रसीद शेयर करो") -> resultType: "command".

    Existing Customers: ${JSON.stringify(customers.map(c => ({ id: c.id, name: c.name })))}
    Default Rate per kg: ₹${defaultRate}.
    Current Date: ${new Date().toISOString().split('T')[0]}.

    === TRANSACTION PARSING DETAILS (resultType = "transaction") ===
    If it is a transaction, parse one or more entries into the 'transactions' array:
    - Support Hindi/Hinglish keywords:
      * "diya", "de diya", "dispatch", "bheja", "delivery", "dediya", "gaya" -> transaction type "sale".
      * "mila", "liya", "received", "payment", "jama", "cleared", "aaye", "paise", "cash" -> transaction type "payment".
      * "kilo", "kg", "litre", "ltr", "kge", "kilo gram" -> quantityKg.
      * "rupaye", "rs", "inr", "rupess" -> amount values.
    - Match parsed customer name to existing customer ID using phonetic/substring matches (e.g. "Rajesh" matches "Rajesh Kumar"). If new, output customerName and set customerId to "".
    - Default ratePerKg to ${defaultRate} if not specified.
    - Set notes to a short, natural, concise English summary.

    === COMMAND EXECUTION DETAILS (resultType = "command") ===
    If it is a command, populate the 'command' object:
    - action: "navigate"
      * Match tabs: "customers" (Hindi: 'ग्राहक', 'खाता', 'बकाया', 'लोग', 'कस्टमर'), "analytics" (Hindi: 'एनालिटिक्स', 'रिपोर्ट', 'सेल रिपोर्ट', 'ग्राफ'), "quick-add" (Hindi: 'रिकॉर्ड', 'जोड़ें', 'एंट्री', 'नया घी', 'नया पेमेंट'), "settings" (Hindi: 'सेटिंग्स', 'रेट चेंज', 'UPI'). Set params.tab to the matched tab.
    - action: "open_customer"
      * Match customer name from speech (e.g. "show Rajesh", "अनीता का खाता दिखाओ"). Set params.customerName or params.customerId.
    - action: "update_rate"
      * Extract the rate amount (e.g. "set rate to 1450", "भाव चौदह सौ पचास करो"). Set params.rate.
    - action: "print_last_receipt"
      * Match printing requests (e.g. "print bill", "प्रिंट रसीद", "रसीद निकालो").
    - action: "share_last_receipt"
      * Match sharing requests (e.g. "share bill", "रसीद शेयर करो", "भेजो").
    `;

    const payload = {
      contents: [{
        parts: [{ text: `Process this input: "${speechText}"` }]
      }],
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      generation_config: {
        response_mime_type: "application/json",
        response_schema: {
          type: "object",
          properties: {
            resultType: { type: "string", enum: ["transaction", "command"], description: "Whether the result is a transaction list or an assistant command" },
            transactions: {
              type: "array",
              description: "List of parsed transactions (required if resultType is transaction)",
              items: {
                type: "object",
                properties: {
                  customerId: { type: "string", description: "ID of matched customer or empty string" },
                  customerName: { type: "string", description: "Parsed customer name" },
                  type: { type: "string", enum: ["sale", "payment"], description: "sale or payment transaction" },
                  quantityKg: { type: "number", description: "Weight of Ghee in kg" },
                  ratePerKg: { type: "number", description: "Rate per kg in rupees" },
                  amountPaid: { type: "number", description: "Amount paid instantly by customer" },
                  notes: { type: "string", description: "Short descriptive summary memo" }
                },
                required: ["customerName", "type", "quantityKg", "ratePerKg", "amountPaid"]
              }
            },
            command: {
              type: "object",
              description: "Parsed command details (required if resultType is command)",
              properties: {
                action: { type: "string", enum: ["navigate", "open_customer", "update_rate", "print_last_receipt", "share_last_receipt"], description: "The action to trigger in the app" },
                params: {
                  type: "object",
                  properties: {
                    tab: { type: "string", enum: ["customers", "analytics", "quick-add", "settings"], description: "Target navigation tab" },
                    customerId: { type: "string", description: "ID of matched customer" },
                    customerName: { type: "string", description: "Name of customer" },
                    rate: { type: "number", description: "New default rate amount" }
                  }
                }
              },
              required: ["action", "params"]
            }
          },
          required: ["resultType"]
        }
      }
    };

    try {
      const data = await callGeminiWithBackoff(payload);
      const parsedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (parsedText) {
        const result = JSON.parse(parsedText);

        if (result.resultType === 'command' && result.command) {
          const { action, params } = result.command;

          if (action === 'navigate') {
            if (params.tab) {
              setActiveTab(params.tab);
              triggerNotification(`Switched to ${params.tab} tab`);
            }
          } else if (action === 'open_customer') {
            let matchedCust = customers.find(c => c.id === params.customerId);
            if (!matchedCust && params.customerName) {
              const q = params.customerName.toLowerCase();
              matchedCust = customers.find(c => c.name.toLowerCase().includes(q));
            }
            if (matchedCust) {
              setSelectedCustomerId(matchedCust.id);
              setActiveTab('client-profile');
              triggerNotification(`Opened ${matchedCust.name}'s profile`);
            } else {
              triggerNotification(`Could not find client "${params.customerName || ''}"`, 'error');
            }
          } else if (action === 'update_rate') {
            if (params.rate) {
              setDefaultRate(params.rate);
              await AsyncStorage.setItem('ghee_def_rate', String(params.rate));
              triggerNotification(`Default rate updated to ₹${params.rate}/kg`);
            }
          } else if (action === 'print_last_receipt' || action === 'share_last_receipt') {
            if (transactions.length > 0) {
              setReceiptTxId(transactions[0].id);
              triggerNotification(action === 'print_last_receipt' ? 'Opening invoice print preview...' : 'Opening invoice share preview...');
            } else {
              triggerNotification('No transactions recorded yet.', 'error');
            }
          }
        } else {
          // Transaction parsed
          const txs = result.transactions || [];
          if (txs.length > 0) {
            setParsedPreviewList(txs);
            triggerNotification('Parsed spoken statement successfully!');
          } else {
            triggerNotification('No transactions or commands recognized.', 'error');
          }
        }
      } else {
        triggerNotification('Could not process input.', 'error');
      }
    } catch (err: any) {
      console.error("handleVoiceProcessing error:", err);
      triggerNotification(err.message || 'AI processing failed. Please try again.', 'error');
    } finally {
      setIsAiProcessing(false);
    }
  };

  // toggleVoiceRecording removed

  const processOCRImageThroughGemini = async (base64Image: string) => {
    setIsScanningImage(true);
    triggerNotification('Reading paper ledger records...');

    const systemPrompt = `You are an OCR and handwriting parsing engine for GheeLedger. 
    Analyze the photo of the handwritten notebook note, ledger page, or paper receipt. Extract all ghee transaction logs.
    The text may be in English, Hindi, Hinglish, or written informally, and contain multiple entries.
    
    Existing Customers: ${JSON.stringify(customers.map(c => ({ id: c.id, name: c.name })))}
    Default Rate per kg: ₹${defaultRate}.
    Current Date: ${new Date().toISOString().split('T')[0]}.

    Instructions for each entry:
    1. Recognize customer name and match it to existing profiles. If new, return customerName and leave customerId as empty "".
    2. Capture ghee dispatch weight (kg), rate, total amount, and cash paid instantly. If no rate is specified for a sale, default to ₹${defaultRate}/kg.
    3. Return structured data as "sale" or "payment".
    4. Translate any Hindi notes to a short English memo for the 'notes' field.`;

    const payload = {
      contents: [{
        parts: [
          { text: "Analyze this handwritten transaction slip and extract details into our schema format." },
          { inlineData: { mimeType: "image/jpeg", data: base64Image } }
        ]
      }],
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      generation_config: {
        response_mime_type: "application/json",
        response_schema: {
          type: "object",
          properties: {
            transactions: {
              type: "array",
              description: "List of parsed transactions",
              items: {
                type: "object",
                properties: {
                  customerId: { type: "string", description: "ID of matched customer or empty string" },
                  customerName: { type: "string", description: "Parsed customer name" },
                  type: { type: "string", enum: ["sale", "payment"], description: "sale or payment" },
                  quantityKg: { type: "number", description: "Weight of Ghee in kg" },
                  ratePerKg: { type: "number", description: "Rate per kg in rupees" },
                  amountPaid: { type: "number", description: "Amount paid instantly by customer" },
                  notes: { type: "string", description: "Handwritten memo transcription or notes" }
                },
                required: ["customerName", "type", "quantityKg", "ratePerKg", "amountPaid"]
              }
            }
          },
          required: ["transactions"]
        }
      }
    };

    try {
      const data = await callGeminiWithBackoff(payload);
      const parsedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (parsedText) {
        const result = JSON.parse(parsedText);
        if (result.transactions && Array.isArray(result.transactions)) {
          setParsedPreviewList(result.transactions);
          triggerNotification('Paper records parsed successfully!');
        } else {
          triggerNotification('Could not parse image format.', 'error');
        }
      } else {
        triggerNotification('Could not parse image content.', 'error');
      }
    } catch (err: any) {
      console.error("processOCRImageThroughGemini error:", err);
      triggerNotification(err.message || 'OCR failed. Re-capture or key in manually.', 'error');
    } finally {
      setIsScanningImage(false);
    }
  };

  const handleOCRFileSelection = async () => {
    if (!apiKey) {
      Alert.alert(
        "API Key Required",
        "Please set your Gemini AI API Key in the Settings tab to run OCR scans.",
        [{ text: "OK" }]
      );
      return;
    }
    Alert.alert(
      "Scan Paper Ledger",
      "Choose a source to scan or select your handwritten records photo:",
      [
        {
          text: "Capture Photo (Camera)",
          onPress: async () => {
            try {
              const permission = await ImagePicker.requestCameraPermissionsAsync();
              if (!permission.granted) {
                triggerNotification('Camera permission is required to capture photos.', 'error');
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                base64: true,
                quality: 0.8,
              });
              if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                setScanPreviewImage(asset.uri);
                await processOCRImageThroughGemini(asset.base64 || '');
              }
            } catch (err) {
              triggerNotification('Camera failed to open.', 'error');
            }
          }
        },
        {
          text: "Select from Gallery",
          onPress: async () => {
            try {
              const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!permission.granted) {
                triggerNotification('Gallery permission is required to select photos.', 'error');
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                base64: true,
                quality: 0.8,
              });
              if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                setScanPreviewImage(asset.uri);
                await processOCRImageThroughGemini(asset.base64 || '');
              }
            } catch (err) {
              triggerNotification('Gallery failed to open.', 'error');
            }
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const handleCommitParsedPreview = () => {
    if (!parsedPreviewList || parsedPreviewList.length === 0) return;

    let currentCustomers = [...customers];
    const newTxs: Transaction[] = [];
    let lastTxId: string | null = null;
    const newlyRegisteredNames: string[] = [];

    parsedPreviewList.forEach((item, index) => {
      let targetId = item.customerId;
      let targetName = item.customerName;

      if (!targetId) {
        const match = currentCustomers.find(c => c.name.toLowerCase() === targetName.toLowerCase());
        if (match) {
          targetId = match.id;
          targetName = match.name;
        } else {
          targetId = 'cust_' + (Date.now() + index);
          const newCust: Customer = {
            id: targetId,
            name: targetName,
            phone: '',
            totalGheeKg: 0,
            pendingAmount: 0,
            notes: 'Auto-registered via AI Assist',
            createdAt: Date.now()
          };
          currentCustomers.push(newCust);
          if (!newlyRegisteredNames.includes(targetName)) {
            newlyRegisteredNames.push(targetName);
          }
        }
      }

      const qty = item.quantityKg;
      const rate = item.ratePerKg;
      const paid = item.amountPaid;
      const isSale = item.type === 'sale';
      const bill = isSale ? qty * rate : 0;
      const balanceChange = isSale ? (bill - paid) : -paid;

      const txId = 'tx_' + (Date.now() + index);
      lastTxId = txId;
      const newTx: Transaction = {
        id: txId,
        customerId: targetId,
        customerName: targetName,
        type: item.type,
        quantityKg: isSale ? qty : 0,
        ratePerKg: isSale ? rate : 0,
        totalAmount: bill,
        amountPaid: paid,
        date: new Date().toISOString().split('T')[0],
        notes: item.notes || (isSale ? `Delivered ${qty} kg Ghee` : 'Payment received')
      };

      currentCustomers = currentCustomers.map(c => {
        if (c.id === targetId) {
          return {
            ...c,
            totalGheeKg: c.totalGheeKg + (isSale ? qty : 0),
            pendingAmount: c.pendingAmount + balanceChange
          };
        }
        return c;
      });

      newTxs.push(newTx);
    });

    setCustomers(currentCustomers);
    setTransactions(prev => [...newTxs, ...prev]);

    if (lastTxId) {
      setReceiptTxId(lastTxId);
    }
    setParsedPreviewList(null);
    setScanPreviewImage(null);
    setRecordMethod('manual');
    setActiveTab('customers');

    if (newlyRegisteredNames.length > 0) {
      triggerNotification(
        `Successfully saved! Registered ${newlyRegisteredNames.join(', ')} (please update their number if applicable).`,
        'success'
      );
    } else {
      triggerNotification(`Successfully saved ${newTxs.length} ledger records!`);
    }
  };

  // Bug #24: Reset amountPaid for sales; Bug #17: Auto-populate payment amount from customer balance
  const handleOpenQuickAdd = (cId: string, type: 'sale' | 'payment', amount = 0) => {
    setQuickTx(prev => ({
      ...prev,
      customerId: cId,
      type: type,
      amountPaid: type === 'sale' ? Math.round(prev.quantityKg * prev.ratePerKg) : (amount > 0 ? amount : 0),
    }));
    setActiveTab('quick-add');
    setRecordMethod('manual');
    setSelectedCustomerId(null);
  };

  if (!isLoaded || hasStarted === null) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.coral} />
      </SafeAreaView>
    );
  }

  if (hasStarted === false) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <WelcomeScreen onGetStarted={() => {
          setHasStarted(true);
          if (dbRef.current) {
            const db = dbRef.current;
            enqueueDbOp(async () => {
              await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ghee_has_started', 'true']);
            });
          }
        }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgSand} />

      {/* 1. Premium Floating Header */}
      {activeTab !== 'client-profile' && (activeTab !== 'settings' || activeSettingsSection === null) && (
        <Header
          activeTab={activeTab as any}
          businessName={businessName}
          customers={customers}
          onAddCustomerOpen={() => setIsAddCustomerOpen(true)}
          onCalendarPress={() => setIsAnalyticsPeriodModalOpen(true)}
          onBackPress={() => setActiveTab('customers')}
          onHistoryPress={() => setActiveTab('vouchers')}
        />
      )}

      {/* 2. Main Tab Viewport */}
      <View style={styles.main}>
        <TabContainer activeTab={activeTab}>
          {activeTab === 'customers' && (
            <ClientsTab
              customers={customers}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterType={filterType}
              setFilterType={setFilterType}
              onSelectCustomer={(id) => {
                setSelectedCustomerId(id);
                setActiveTab('client-profile');
              }}
              metrics={metrics}
              onOpenEditPhone={handleOpenEditPhone}
              onAddCustomerOpen={() => setIsAddCustomerOpen(true)}
            />
          )}

          {activeTab === 'client-profile' && (
            <CustomerProfileSheet
              customerId={selectedCustomerId}
              onClose={() => {
                setSelectedCustomerId(null);
                setActiveTab('customers');
              }}
              customers={customers}
              transactions={transactions}
              businessName={businessName}
              onOpenReminderCenter={() => setIsReminderCenterOpen(true)}
              onOpenQuickAdd={handleOpenQuickAdd}
              onOpenReceipt={(txId) => setReceiptTxId(txId)}
              deleteConfirmationId={deleteConfirmationId}
              setDeleteConfirmationId={setDeleteConfirmationId}
              deleteCustomer={(id) => {
                deleteCustomer(id);
                setActiveTab('customers');
              }}
              onOpenEditPhone={handleOpenEditPhone}
              onEditTransaction={(tx) => setEditingTransaction(tx)}
              onDeleteTransaction={deleteTransaction}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab
              businessName={businessName}
              defaultRate={defaultRate}
              metrics={metrics}
              transactions={transactions}
              customers={customers}
              inventory={inventory}
              onAddStock={addInventoryStock}
              triggerNotification={triggerNotification}
              period={analyticsPeriod}
              onPeriodChange={setAnalyticsPeriod}
              isPeriodModalOpen={isAnalyticsPeriodModalOpen}
              setIsPeriodModalOpen={setIsAnalyticsPeriodModalOpen}
              onNavigateToRecordEntry={() => setActiveTab('quick-add')}
            />
          )}

          {activeTab === 'quick-add' && (
            <QuickRecordTab
              businessName={businessName}
              upiId={upiId}
              customers={customers}
              defaultRate={defaultRate}
              weightPresets={weightPresets}
              ratePresets={ratePresets}
              quickTx={quickTx}
              setQuickTx={setQuickTx}
              recordMethod={recordMethod}
              setRecordMethod={setRecordMethod}
              showCustomWeight={showCustomWeight}
              setShowCustomWeight={setShowCustomWeight}
              showCustomRate={showCustomRate}
              setShowCustomRate={setShowCustomRate}
              showCustomAmount={showCustomAmount}
              setShowCustomAmount={setShowCustomAmount}
              speechResultText={speechResultText}
              setSpeechResultText={setSpeechResultText}
              isAiProcessing={isAiProcessing}
              parsedPreviewList={parsedPreviewList}
              setParsedPreviewList={setParsedPreviewList}
              scanPreviewImage={scanPreviewImage}
              isScanningImage={isScanningImage}
              handleVoiceProcessing={handleVoiceProcessing}
              handleOCRFileSelection={handleOCRFileSelection}
              handleCommitParsedPreview={handleCommitParsedPreview}
              commitQuickTransaction={commitQuickTransaction}
              triggerNotification={triggerNotification}
            />
          )}

          {activeTab === 'vouchers' && (
            <ReceiptsTab
              transactions={transactions}
              customers={customers}
              onSelectTransaction={(id) => setReceiptTxId(id)}
              triggerNotification={triggerNotification}
              onNavigateToRecordEntry={() => setActiveTab('quick-add')}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              businessName={businessName}
              setBusinessName={setBusinessName}
              upiId={upiId}
              setUpiId={setUpiId}
              defaultRate={defaultRate}
              setDefaultRate={setDefaultRate}
              apiKey={apiKey}
              setApiKey={setApiKey}
              geminiModel={geminiModel}
              setGeminiModel={setGeminiModel}
              weightPresetsInput={weightPresetsInput}
              setWeightPresetsInput={setWeightPresetsInput}
              ratePresetsInput={ratePresetsInput}
              setRatePresetsInput={setRatePresetsInput}
              savePresetConfigurations={savePresetConfigurations}
              onOpenLogs={() => setIsLogsSheetOpen(true)}
              clearDatabase={clearDatabase}
              onImportBackupJSON={onImportBackupJSON}
              syncCode={syncCode}
              setSyncCode={setSyncCode}
              bucketId={bucketId}
              setBucketId={setBucketId}
              backupToCloud={backupToCloud}
              restoreFromCloud={restoreFromCloud}
              isSyncing={isSyncing}
              activeSection={activeSettingsSection}
              setActiveSection={setActiveSettingsSection}
              lastBackupTime={lastBackupTime}
              backupRecords={backupRecords}
              backupSizeFormatted={backupSizeFormatted}
            />
          )}
        </TabContainer>
      </View>

      {/* 3. Floating Notification Toast */}
      {toastMessage && (
        <View style={[styles.toastContainer, toastType === 'error' && styles.toastContainerError]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* 4. Bottom Tab Bar */}
      {activeTab !== 'client-profile' && (
        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={() => { setActiveTab('customers'); Haptics.selectionAsync(); }}
            style={styles.navItem}
            activeOpacity={0.7}
          >
            <View style={[
              styles.indicatorPill,
              activeTab === 'customers' && styles.indicatorPillActive
            ]}>
              <Users size={20} color={activeTab === 'customers' ? COLORS.coral : COLORS.textLightMuted} />
            </View>
            <Text style={[styles.navText, activeTab === 'customers' && styles.navTextActive]}>Clients</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setActiveTab('analytics'); Haptics.selectionAsync(); }}
            style={styles.navItem}
            activeOpacity={0.7}
          >
            <View style={[
              styles.indicatorPill,
              activeTab === 'analytics' && styles.indicatorPillActive
            ]}>
              <TrendingUp size={20} color={activeTab === 'analytics' ? COLORS.coral : COLORS.textLightMuted} />
            </View>
            <Text style={[styles.navText, activeTab === 'analytics' && styles.navTextActive]}>Analytics</Text>
          </TouchableOpacity>

          {/* Premium Floating Record button */}
          <TouchableOpacity
            onPress={() => { setActiveTab('quick-add'); setRecordMethod('manual'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
            style={styles.navItemRecord}
            activeOpacity={0.8}
          >
            <View style={[styles.recordCircle, activeTab === 'quick-add' && styles.recordCircleActive]}>
              <Plus size={24} color={COLORS.white} strokeWidth={3} />
            </View>
            <Text style={[styles.navText, activeTab === 'quick-add' && styles.navTextActive, { marginTop: 4 }]}>Record</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setActiveTab('vouchers'); Haptics.selectionAsync(); }}
            style={styles.navItem}
            activeOpacity={0.7}
          >
            <View style={[
              styles.indicatorPill,
              activeTab === 'vouchers' && styles.indicatorPillActive
            ]}>
              <FileText size={20} color={activeTab === 'vouchers' ? COLORS.coral : COLORS.textLightMuted} />
            </View>
            <Text style={[styles.navText, activeTab === 'vouchers' && styles.navTextActive]}>Receipts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setActiveTab('settings'); Haptics.selectionAsync(); }}
            style={styles.navItem}
            activeOpacity={0.7}
          >
            <View style={[
              styles.indicatorPill,
              activeTab === 'settings' && styles.indicatorPillActive
            ]}>
              <Settings size={20} color={activeTab === 'settings' ? COLORS.coral : COLORS.textLightMuted} />
            </View>
            <Text style={[styles.navText, activeTab === 'settings' && styles.navTextActive]}>Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modals & Bottom Sheets */}
      {/* CustomerProfileSheet moved to dedicated client-profile tab */}

      {/* Edit Transaction Modal */}
      <Modal
        visible={editingTransaction !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingTransaction(null)}
      >
        <View style={styles.editTxOverlay}>
          <View style={styles.editTxContent}>
            <View style={styles.editTxHeader}>
              <Text style={styles.editTxTitle}>Edit Transaction</Text>
              <TouchableOpacity onPress={() => setEditingTransaction(null)} style={styles.assistantCloseBtn}>
                <X size={18} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            {editingTransaction && (
              <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Type</Text>
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity
                      onPress={() => setEditingTransaction(prev => prev ? { ...prev, type: 'sale' } : prev)}
                      style={[styles.editTxTypeBtn, editingTransaction.type === 'sale' && styles.editTxTypeBtnActive]}
                    >
                      <Text style={[styles.editTxTypeBtnText, editingTransaction.type === 'sale' && { color: COLORS.white }]}>Sale</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setEditingTransaction(prev => prev ? { ...prev, type: 'payment' } : prev)}
                      style={[styles.editTxTypeBtn, editingTransaction.type === 'payment' && styles.editTxTypeBtnActive, { marginLeft: 8 }]}
                    >
                      <Text style={[styles.editTxTypeBtnText, editingTransaction.type === 'payment' && { color: COLORS.white }]}>Payment</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {editingTransaction.type === 'sale' && (
                  <>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Quantity (kg)</Text>
                      <TextInput
                        keyboardType="numeric"
                        value={String(editingTransaction.quantityKg)}
                        onChangeText={(text) => {
                          const qty = parseFloat(text) || 0;
                          setEditingTransaction(prev => prev ? {
                            ...prev,
                            quantityKg: qty,
                            totalAmount: Math.round(qty * prev.ratePerKg)
                          } : prev);
                        }}
                        style={styles.addInput}
                      />
                    </View>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Rate (₹/kg)</Text>
                      <TextInput
                        keyboardType="numeric"
                        value={String(editingTransaction.ratePerKg)}
                        onChangeText={(text) => {
                          const rate = parseFloat(text) || 0;
                          setEditingTransaction(prev => prev ? {
                            ...prev,
                            ratePerKg: rate,
                            totalAmount: Math.round(prev.quantityKg * rate)
                          } : prev);
                        }}
                        style={styles.addInput}
                      />
                    </View>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Total Bill: ₹{editingTransaction.totalAmount.toLocaleString('en-IN')}</Text>
                    </View>
                  </>
                )}

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Amount Paid (₹)</Text>
                  <TextInput
                    keyboardType="numeric"
                    value={String(editingTransaction.amountPaid)}
                    onChangeText={(text) => setEditingTransaction(prev => prev ? { ...prev, amountPaid: parseFloat(text) || 0 } : prev)}
                    style={styles.addInput}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Date</Text>
                  <TextInput
                    value={editingTransaction.date}
                    onChangeText={(text) => setEditingTransaction(prev => prev ? { ...prev, date: text } : prev)}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.textLightMuted}
                    style={styles.addInput}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Notes</Text>
                  <TextInput
                    value={editingTransaction.notes || ''}
                    onChangeText={(text) => setEditingTransaction(prev => prev ? { ...prev, notes: text } : prev)}
                    placeholder="Notes..."
                    placeholderTextColor={COLORS.textLightMuted}
                    multiline
                    style={[styles.addInput, { height: 60, textAlignVertical: 'top' }]}
                  />
                </View>

                <TouchableOpacity
                  onPress={() => saveEditedTransaction(editingTransaction)}
                  style={styles.saveCustButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveCustButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Global Phone Edit Modal */}
      <Modal
        visible={editingPhoneCustomerId !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditingPhoneCustomerId(null)}
      >
        <TouchableOpacity
          style={styles.phoneEditOverlay}
          activeOpacity={1}
          onPress={() => setEditingPhoneCustomerId(null)}
        >
          <TouchableOpacity
            style={styles.phoneEditCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.phoneEditTitle}>Update Phone Number</Text>
            <Text style={styles.phoneEditSub}>
              Enter mobile number for client: <Text style={{ fontWeight: 'bold' }}>{editingPhoneName}</Text>
            </Text>

            <TextInput
              keyboardType="phone-pad"
              value={editingPhoneValue}
              onChangeText={setEditingPhoneValue}
              placeholder="e.g. 9876543210"
              placeholderTextColor={COLORS.textLightMuted}
              style={styles.phoneEditInput}
              autoFocus={true}
            />

            <View style={styles.phoneEditActions}>
              <TouchableOpacity
                onPress={() => setEditingPhoneCustomerId(null)}
                style={[styles.phoneEditBtn, { backgroundColor: COLORS.bgWarm }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.phoneEditBtnText, { color: COLORS.textMuted }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (editingPhoneCustomerId) {
                    const phoneDigits = editingPhoneValue.replace(/[^0-9]/g, '');
                    if (phoneDigits.length < 10) {
                      triggerNotification('Please enter a valid 10-digit phone number.', 'error');
                      return;
                    }
                    updateCustomerPhone(editingPhoneCustomerId, editingPhoneValue);
                    setEditingPhoneCustomerId(null);
                  }
                }}
                style={[styles.phoneEditBtn, { backgroundColor: COLORS.coral }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.phoneEditBtnText, { color: COLORS.white }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ReminderModal
        isOpen={isReminderCenterOpen}
        onClose={() => setIsReminderCenterOpen(false)}
        profile={customers.find(c => c.id === selectedCustomerId) || null}
        activeTemplate={activeReminderTemplate}
        setActiveTemplate={setActiveReminderTemplate}
        reminderMessage={reminderMessage}
        isAiGeneratingDraft={isAiGeneratingDraft}
        aiCustomDraftText={aiCustomDraftText}
        generateAISmartDraft={generateAISmartDraft}
        triggerNotification={triggerNotification}
        businessName={businessName}
        upiId={upiId}
      />

      <ReceiptVoucherModal
        txId={receiptTxId}
        onClose={() => setReceiptTxId(null)}
        transactions={transactions}
        customers={customers}
        businessName={businessName}
        upiId={upiId}
        triggerNotification={triggerNotification}
      />

      <AuditLogsModal
        isOpen={isLogsSheetOpen}
        onClose={() => setIsLogsSheetOpen(false)}
        transactions={transactions}
      />

      {/* Custom modal for adding client */}
      <Modal
        visible={isAddCustomerOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddCustomerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsAddCustomerOpen(false)} style={{ padding: 4 }}>
                <Text style={{ fontSize: 22, color: COLORS.textDark, fontWeight: 'bold' }}>←</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add Client</Text>
              <View style={styles.headerIconBadge}>
                <UserPlus size={16} color={COLORS.coral} />
              </View>
            </View>

            <Text style={styles.modalSubtitle}>
              Add a new customer to start tracking their ledger.
            </Text>

            <ScrollView contentContainerStyle={styles.addFormBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Full Name *</Text>
                <View style={styles.inputWrapperRow}>
                  <User size={16} color={COLORS.textLightMuted} style={styles.inputLeftIcon} />
                  <TextInput
                    value={newCustomerForm.name}
                    onChangeText={(text) => setNewCustomerForm(prev => ({ ...prev, name: text }))}
                    placeholder="e.g. Rajesh Kumar"
                    placeholderTextColor={COLORS.textLightMuted}
                    style={styles.addInputWithIcon}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone Number *</Text>
                <View style={styles.inputWrapperRow}>
                  <Phone size={16} color={COLORS.textLightMuted} style={styles.inputLeftIcon} />
                  <TextInput
                    keyboardType="phone-pad"
                    value={newCustomerForm.phone}
                    onChangeText={(text) => setNewCustomerForm(prev => ({ ...prev, phone: text }))}
                    placeholder="e.g. 98765 43210"
                    placeholderTextColor={COLORS.textLightMuted}
                    style={styles.addInputWithIcon}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Opening Dues (₹) (Optional)</Text>
                <View style={styles.inputWrapperRow}>
                  <Wallet size={16} color={COLORS.textLightMuted} style={styles.inputLeftIcon} />
                  <TextInput
                    keyboardType="numeric"
                    value={newCustomerForm.initialDue}
                    onChangeText={(text) => setNewCustomerForm(prev => ({ ...prev, initialDue: text, initialKg: String(parseFloat(text) ? prev.initialKg : 0) }))}
                    placeholder="e.g. 0"
                    placeholderTextColor={COLORS.textLightMuted}
                    style={styles.addInputWithIcon}
                  />
                </View>
                <Text style={styles.helperText}>If they already owe you.</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes (Optional)</Text>
                <View style={styles.inputWrapperRow}>
                  <FileText size={16} color={COLORS.textLightMuted} style={styles.inputLeftIcon} />
                  <TextInput
                    value={newCustomerForm.notes}
                    onChangeText={(text) => setNewCustomerForm(prev => ({ ...prev, notes: text }))}
                    placeholder="e.g. Trusted customer, regular buyer"
                    placeholderTextColor={COLORS.textLightMuted}
                    style={styles.addInputWithIcon}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={registerNewCustomer}
                style={[styles.saveCustButton, { backgroundColor: COLORS.coral, borderRadius: 24, height: 48, justifyContent: 'center' }]}
                activeOpacity={0.8}
              >
                <Text style={styles.saveCustButtonText}>Save Client</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* GLOBAL AI VOICE ASSISTANT FLOATING BUTTON */}
      <TouchableOpacity
        onPress={() => setIsAssistantModalOpen(true)}
        style={styles.assistantFab}
        activeOpacity={0.8}
      >
        <Mic size={24} color={COLORS.white} />
      </TouchableOpacity>

      {/* GLOBAL AI VOICE ASSISTANT MODAL */}
      <Modal
        visible={isAssistantModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsAssistantModalOpen(false)}
      >
        <View style={styles.assistantOverlay}>
          <View style={styles.assistantContent}>
            <View style={styles.assistantHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Mic size={18} color={COLORS.coral} style={{ marginRight: 6 }} />
                <Text style={styles.assistantTitle}>Voice AI Assistant</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAssistantModalOpen(false)} style={styles.assistantCloseBtn}>
                <X size={18} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.assistantSubText}>
              Say or type a command in Hindi or English (e.g. "एनालिटिक्स खोलो", "open settings", "set rate to 1400", "रमेश का खाता दिखाओ", "print bill")
            </Text>

            <TextInput
              multiline
              numberOfLines={3}
              value={assistantInput}
              onChangeText={setAssistantInput}
              placeholder="बोलें या टाइप करें (e.g., अनीता का प्रोफाइल दिखाओ)..."
              placeholderTextColor={COLORS.textLightMuted}
              style={styles.assistantInput}
            />

            <View style={styles.assistantActions}>
              <TouchableOpacity
                onPress={async () => {
                  if (assistantInput.trim() === '') {
                    triggerNotification('Please speak or type a command first.', 'error');
                    return;
                  }
                  setIsAiProcessing(true);
                  try {
                    await handleVoiceProcessing(assistantInput);
                    setAssistantInput('');
                    setIsAssistantModalOpen(false);
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setIsAiProcessing(false);
                  }
                }}
                style={styles.assistantRunBtn}
                activeOpacity={0.8}
                disabled={isAiProcessing}
              >
                {isAiProcessing ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.assistantRunText}>Run Command</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgSand,
  },
  main: {
    flex: 1,
    paddingHorizontal: 12,
  },
  navBar: {
    height: 64,
    borderTopWidth: 1,
    borderTopColor: '#ede8df',
    backgroundColor: COLORS.bgSand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 4,
    paddingBottom: 4,
    overflow: 'visible',
    position: 'relative',
    zIndex: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
      default: {},
    }),
  },
  navItemRecord: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
    overflow: 'visible',
    zIndex: 20,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
      default: {},
    }),
  },
  recordCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    borderWidth: 4,
    borderColor: COLORS.bgSand,
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  recordCircleActive: {
    backgroundColor: COLORS.coralPressed,
  },
  indicatorPill: {
    width: 52,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 2,
    overflow: 'hidden',
  },
  indicatorPillActive: {
    backgroundColor: '#f9e8e2',
  },
  navText: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  navTextActive: {
    color: COLORS.coral,
    fontWeight: '600',
  },

  toastContainer: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: COLORS.bgDark,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 100,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  toastContainerError: {
    backgroundColor: COLORS.red,
  },
  toastText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.bgSand,
    fontWeight: '600',
  },
  // Customer Add Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 19, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.bgSand,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  modalCloseButton: {
    padding: 4,
    backgroundColor: COLORS.bgWarm,
    borderRadius: 16,
  },
  addFormBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 14,
  },
  formLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  addInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 44,
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textDark,
  },
  metaGrid: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  saveCustButton: {
    backgroundColor: COLORS.coral,
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  saveCustButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  assistantFab: {
    position: 'absolute',
    bottom: 84,
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.coral,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    zIndex: 99,
  },
  assistantOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 19, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  assistantContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: COLORS.bgSand,
    borderRadius: 8,
    padding: 16,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
  },
  assistantTitle: {
    fontFamily: FONTS.serif,
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  assistantCloseBtn: {
    padding: 4,
  },
  assistantSubText: {
    fontFamily: FONTS.sans,
    fontSize: 10.5,
    color: COLORS.textMuted,
    lineHeight: 15,
    marginBottom: 12,
  },
  assistantInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    height: 70,
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textDark,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  assistantActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  assistantRunBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistantRunText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  phoneEditOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  phoneEditCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: COLORS.bgSand,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  phoneEditTitle: {
    fontFamily: FONTS.serif,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  phoneEditSub: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  phoneEditInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 40,
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textDark,
    marginBottom: 20,
  },
  phoneEditActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  phoneEditBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  phoneEditBtnText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: 'bold',
  },
  editTxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 19, 0.7)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  editTxContent: {
    backgroundColor: COLORS.bgSand,
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  editTxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
  },
  editTxTitle: {
    fontFamily: FONTS.serif,
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  editTxTypeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.bgWarm,
  },
  editTxTypeBtnActive: {
    backgroundColor: COLORS.coral,
    borderColor: COLORS.coral,
  },
  editTxTypeBtnText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  inputWrapperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputLeftIcon: {
    marginRight: 10,
  },
  addInputWithIcon: {
    flex: 1,
    fontFamily: FONTS.sans,
    fontSize: 13.5,
    color: COLORS.textDark,
    height: '100%',
  },
  helperText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textLightMuted,
    marginTop: 4,
    marginLeft: 2,
  },
  modalSubtitle: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textMuted,
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
  },
  headerIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgMintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
