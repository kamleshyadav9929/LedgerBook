import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  FileText, 
  UserPlus, 
  Scale, 
  Phone, 
  X, 
  Calendar, 
  Activity, 
  ChevronRight, 
  Info,
  Layers,
  Sparkles,
  Download,
  Check,
  ChevronDown,
  MessageSquare,
  TrendingDown,
  Trash2,
  Copy,
  Printer,
  Share2,
  SlidersHorizontal,
  RefreshCw,
  Award,
  BookOpen,
  Upload,
  Settings,
  Briefcase,
  QrCode,
  Mic,
  Camera,
  Edit2,
  FileCheck,
  Loader2,
  Keyboard,
  Compass,
  Grid,
  Volume2,
  Sparkle,
  VolumeX,
  PlusCircle,
  Clock
} from 'lucide-react';

// GLOBAL RUNTIME API KEY CONFORMITY
const apiKey = ""; 

// Injection of elegant editorial font stacks, mobile animations, and paper textures
const MobileStylingAndAnimations = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght=0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght=400;500&display=swap');
    
    .font-serif-editorial {
      font-family: 'Cormorant Garamond', Georgia, serif;
    }
    .font-sans-humanist {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }
    .font-mono-code {
      font-family: 'JetBrains Mono', monospace;
    }
    
    /* Native App Feel Utilities */
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    
    /* Animated Slide up drawer for mobile screens */
    .slide-up-drawer {
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    /* Prevent text selection when tapping repeatedly on increment helpers */
    .no-select {
      user-select: none;
      -webkit-user-select: none;
    }
    
    /* Custom paper voucher styling for printable invoices */
    .vintage-voucher {
      background-image: radial-gradient(#cc785c 0.5px, transparent 0.5px), radial-gradient(#cc785c 0.5px, #faf9f5 0.5px);
      background-size: 20px 20px;
      background-position: 0 0, 10px 10px;
      opacity: 0.98;
    }

    /* Pulse animation for voice processing */
    @keyframes voicePulse {
      0%, 100__ { transform: scale(1); opacity: 0.4; }
      50__ { transform: scale(1.15); opacity: 0.8; }
    }
    .voice-pulse-circle {
      animation: voicePulse 1.6s infinite ease-in-out;
    }

    /* Laser scanning animation for OCR */
    @keyframes laserScan {
      0__ { top: 0__; }
      50__ { top: 100__; }
      100__ { top: 0__; }
    }
    .ocr-laser-bar {
      animation: laserScan 2.5s infinite linear;
    }
  `}</style>
);

const SAMPLE_CUSTOMERS = [
  { id: 'c1', name: 'Rajesh Kumar', phone: '9876543210', totalGheeKg: 18.5, pendingAmount: 1850, notes: 'Prefers Bilona A2 Desi Cow Ghee. Block A4, Sector 15.' },
  { id: 'c2', name: 'Dr. Anita Sharma', phone: '9412345678', totalGheeKg: 12.0, pendingAmount: 0, notes: 'Requires premium double-sealed glass jars.' },
  { id: 'c3', name: 'Meenakshi Iyer', phone: '9301294857', totalGheeKg: 24.0, pendingAmount: 4350, notes: 'Takes Spiced Ghee. Prefers evening delivery.' },
  { id: 'c4', name: 'Vikram Singh', phone: '8765432109', totalGheeKg: 5.0, pendingAmount: 650, notes: 'Always pays within a week. Regular Buffalo Ghee.' },
  { id: 'c5', name: 'Sanjay Malhotra', phone: '7012345678', totalGheeKg: 30.0, pendingAmount: 0, notes: 'Monthly bulk orders. Delivery to Sector 12.' }
];

const SAMPLE_TRANSACTIONS = [
  { id: 't1', customerId: 'c1', customerName: 'Rajesh Kumar', type: 'sale', quantityKg: 5, ratePerKg: 1300, totalAmount: 6500, amountPaid: 4650, date: '2026-05-18', notes: 'Delivered Fresh Batch #43' },
  { id: 't2', customerId: 'c2', customerName: 'Dr. Anita Sharma', type: 'sale', quantityKg: 4, ratePerKg: 1300, totalAmount: 5200, amountPaid: 5200, date: '2026-05-19', notes: 'Paid instantly via GPay' },
  { id: 't3', customerId: 'c3', customerName: 'Meenakshi Iyer', type: 'sale', quantityKg: 10, ratePerKg: 1450, totalAmount: 14500, amountPaid: 10150, date: '2026-05-20', notes: 'A2 Gir Cow Vedic Ghee' },
  { id: 't4', customerId: 'c1', customerName: 'Rajesh Kumar', type: 'payment', quantityKg: 0, ratePerKg: 0, totalAmount: 0, amountPaid: 2000, date: '2026-05-21', notes: 'UPI payment received' },
  { id: 't5', customerId: 'c4', customerName: 'Vikram Singh', type: 'sale', quantityKg: 5, ratePerKg: 1200, totalAmount: 6000, amountPaid: 5350, date: '2026-05-21', notes: 'Premium Buffalo Ghee' }
];

// Helper to convert base64 PCM16 into WAV blob for browser playback
function pcmToWav(pcmBase64, sampleRate = 24000) {
  const binaryString = window.atob(pcmBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const buffer = bytes.buffer;
  
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);
  
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + len, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono channel
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); 
  view.setUint16(32, 2, true); 
  view.setUint16(34, 16, true); 
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, len, true);
  
  const blob = new Blob([wavHeader, buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

export default function App() {
  // Mobile Navigation tab: 'customers' | 'analytics' | 'quick-add' | 'vouchers' | 'settings'
  const [activeTab, setActiveTab] = useState('customers');
  
  // Ledger and Customer States (With safe JSON parses)
  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem('ghee_customers');
      return saved ? JSON.parse(saved) : SAMPLE_CUSTOMERS;
    } catch (e) {
      return SAMPLE_CUSTOMERS;
    }
  });
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('ghee_transactions');
      return saved ? JSON.parse(saved) : SAMPLE_TRANSACTIONS;
    } catch (e) {
      return SAMPLE_TRANSACTIONS;
    }
  });

  // Business Profile Settings
  const [businessName, setBusinessName] = useState(() => localStorage.getItem('ghee_biz_name') || 'Vedic Ghee Farm');
  const [upiId, setUpiId] = useState(() => localStorage.getItem('ghee_upi_id') || 'ghee@upi');
  const [defaultRate, setDefaultRate] = useState(() => parseInt(localStorage.getItem('ghee_def_rate')) || 1300);

  // Dynamic Presets Configurations
  const [weightPresets, setWeightPresets] = useState(() => {
    try {
      const saved = localStorage.getItem('ghee_weight_presets');
      return saved ? JSON.parse(saved) : [0.5, 1, 2, 5];
    } catch (e) {
      return [0.5, 1, 2, 5];
    }
  });
  const [ratePresets, setRatePresets] = useState(() => {
    try {
      const saved = localStorage.getItem('ghee_rate_presets');
      return saved ? JSON.parse(saved) : [1200, 1300, 1450];
    } catch (e) {
      return [1200, 1300, 1450];
    }
  });

  // Local Preset Edit Inputs
  const [weightPresetsInput, setWeightPresetsInput] = useState(weightPresets.join(', '));
  const [ratePresetsInput, setRatePresetsInput] = useState(ratePresets.join(', '));

  // Search & Filter constraints
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); 
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('all'); 
  const [toasts, setToasts] = useState([]);

  // Active Profile Drawer States
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isReminderCenterOpen, setIsReminderCenterOpen] = useState(false);
  const [activeReminderTemplate, setActiveReminderTemplate] = useState('gentle');
  const [isLogsSheetOpen, setIsLogsSheetOpen] = useState(false);
  const [receiptTxId, setReceiptTxId] = useState(null);

  // Quick transaction Manual Form state
  const [quickTx, setQuickTx] = useState({
    customerId: '',
    type: 'sale',
    quantityKg: 1,
    ratePerKg: defaultRate,
    amountPaid: defaultRate,
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [showCustomWeight, setShowCustomWeight] = useState(false);
  const [showCustomRate, setShowCustomRate] = useState(false);
  const [showCustomAmount, setShowCustomAmount] = useState(false);

  // ================= VOICE ASSIST FEATURE STATES =================
  const [recordMethod, setRecordMethod] = useState('manual'); // 'manual' | 'voice' | 'scan'
  const [isRecording, setIsRecording] = useState(false);
  const [speechResultText, setSpeechResultText] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  
  // Editable Preview state parsed from speech or image analysis
  const [parsedPreview, setParsedPreview] = useState(null);

  // Web Speech recognition instance
  const recognitionRef = useRef(null);

  // ================= PAPER SCANNING FEATURE STATES =================
  const [scanPreviewImage, setScanPreviewImage] = useState(null);
  const [isScanningImage, setIsScanningImage] = useState(false);

  // Hidden references for imports/file scanning
  const fileInputRef = useRef(null);
  const ocrFileInputRef = useRef(null);

  // Register Customer Form State
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', initialKg: '0', initialDue: '0', notes: '' });

  // ================= GEMINI LLM DRIVEN BUSINESS METADATA & ADVISOR STATES =================
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  const [copilotInsightsText, setCopilotInsightsText] = useState('');
  const [isAiGeneratingDraft, setIsAiGeneratingDraft] = useState(false);
  const [aiCustomDraftText, setAiCustomDraftText] = useState('');
  const [isTtsSpeaking, setIsTtsSpeaking] = useState(false);
  const [audioPlayUrl, setAudioPlayUrl] = useState(null);

  // LocalStorage synchronizations
  useEffect(() => {
    localStorage.setItem('ghee_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('ghee_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('ghee_biz_name', businessName);
  }, [businessName]);

  useEffect(() => {
    localStorage.setItem('ghee_upi_id', upiId);
  }, [upiId]);

  useEffect(() => {
    localStorage.setItem('ghee_def_rate', defaultRate.toString());
  }, [defaultRate]);

  useEffect(() => {
    localStorage.setItem('ghee_weight_presets', JSON.stringify(weightPresets));
  }, [weightPresets]);

  useEffect(() => {
    localStorage.setItem('ghee_rate_presets', JSON.stringify(ratePresets));
  }, [ratePresets]);

  // ON-THE-FLY RENDER-TIME CALCULATIONS TO PREVENT INFINITE RENDERING LOOPS
  const computedTotalBill = useMemo(() => {
    if (quickTx.type !== 'sale') return 0;
    return Math.round(quickTx.quantityKg * quickTx.ratePerKg);
  }, [quickTx.type, quickTx.quantityKg, quickTx.ratePerKg]);

  const computedLeftoverDues = useMemo(() => {
    if (quickTx.type !== 'sale') return 0;
    return Math.max(0, computedTotalBill - quickTx.amountPaid);
  }, [quickTx.type, computedTotalBill, quickTx.amountPaid]);

  // Sync default rate on settings change safely
  useEffect(() => {
    setQuickTx(prev => ({
      ...prev,
      ratePerKg: defaultRate,
      amountPaid: prev.type === 'sale' ? Math.round(prev.quantityKg * defaultRate) : prev.amountPaid
    }));
  }, [defaultRate]);

  // Secure clipboard helper supporting iframe constraints
  const copyTextToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";  
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        triggerNotification('Text copied to clipboard!');
      } else {
        triggerNotification('Could not copy automatically.', 'error');
      }
    } catch (err) {
      triggerNotification('Copy action failed.', 'error');
    }
    document.body.removeChild(textArea);
  };

  const triggerNotification = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(item => item.id !== id));
    }, 3500);
  };

  // Aggregated analytical statistics
  const metrics = useMemo(() => {
    const totalPending = customers.reduce((sum, item) => sum + item.pendingAmount, 0);
    const volumeKg = customers.reduce((sum, item) => sum + item.totalGheeKg, 0);
    const dueAccounts = customers.filter(c => c.pendingAmount > 0).length;
    const cashCollected = transactions.reduce((sum, t) => sum + t.amountPaid, 0);
    const totalSalesRevenue = transactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + t.totalAmount, 0);
    
    const topBuyers = [...customers]
      .sort((a, b) => b.totalGheeKg - a.totalGheeKg)
      .slice(0, 3);

    const collectionRate = totalSalesRevenue > 0 
      ? Math.round((cashCollected / totalSalesRevenue) * 100) 
      : 100;

    return { totalPending, volumeKg, dueAccounts, cashCollected, totalSalesRevenue, topBuyers, collectionRate };
  }, [customers, transactions]);

  // Filters
  const listFilteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchText = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery);
      if (filterType === 'all') return matchText;
      if (filterType === 'due') return matchText && c.pendingAmount > 0;
      if (filterType === 'clear') return matchText && c.pendingAmount === 0;
      return matchText;
    });
  }, [customers, searchQuery, filterType]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.customerName.toLowerCase().includes(ledgerSearch.toLowerCase()) || (t.notes && t.notes.toLowerCase().includes(ledgerSearch.toLowerCase()));
      const matchesType = ledgerTypeFilter === 'all' || t.type === ledgerTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [transactions, ledgerSearch, ledgerTypeFilter]);

  const detailedSelectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    const profile = customers.find(c => c.id === selectedCustomerId);
    const logs = transactions.filter(t => t.customerId === selectedCustomerId).sort((a, b) => b.date.localeCompare(a.date));
    return { profile, logs };
  }, [selectedCustomerId, customers, transactions]);

  const selectedReceiptTx = useMemo(() => {
    if (!receiptTxId) return null;
    return transactions.find(t => t.id === receiptTxId);
  }, [receiptTxId, transactions]);

  // ================= DYNAMIC GEMINI LLM CORE OPERATIONS =================

  // 1. DYNAMIC EXPONENTIAL BACKOFF CALLER FOR ALL GEMINI INTEGRATIONS
  const callGeminiWithBackoff = async (payload, customModel = "gemini-2.5-flash-preview-09-2025") => {
    let delay = 1000;
    for (let i = 0; i < 5; i++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${customModel}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          return await response.json();
        }
      } catch (err) {
        // Retrying silently
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
    throw new Error("Unable to contact Gemini AI Services after maximum retries.");
  };

  // 2. GEMINI COPILOT INSIGHTS ADVISOR
  const fetchBusinessInsights = async () => {
    setIsCopilotLoading(true);
    triggerNotification("Consulting GheeLedger AI Business Copilot...");
    
    const userPrompt = `Provide strategic coaching recommendations for my ghee business.
    Business Name: ${businessName}
    Current Default Rate: ₹${defaultRate}/kg
    Total Ghee Dispatched: ${metrics.volumeKg} kg
    Gross Billings: ₹${metrics.totalSalesRevenue}
    Unpaid Outstanding Dues: ₹${metrics.totalPending} (Across ${metrics.dueAccounts} buyers)
    Cash Collected: ₹${metrics.cashCollected} (Realization Rate: ${metrics.collectionRate}%)
    
    Top Buyers: ${JSON.stringify(metrics.topBuyers.map(b => ({ name: b.name, totalKg: b.totalGheeKg, due: b.pendingAmount })))}
    
    Provide exactly three high-impact, actionable business advices focusing on pricing strategy, debt mitigation, and operational delivery routing. Speak directly and concisely like an expert, with bullet points, using Inter font layout tone. Do not introduce raw Markdown headings.`;

    const payload = {
      contents: [{ parts: [{ text: userPrompt }] }]
    };

    try {
      const data = await callGeminiWithBackoff(payload);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setCopilotInsightsText(text);
        triggerNotification("AI Business analysis ready!");
      }
    } catch (e) {
      triggerNotification("Failed to fetch business insights.", "error");
    } finally {
      setIsCopilotLoading(false);
    }
  };

  // 3. GEMINI AI SMART DRAFT FOLLOW-UP REMINDER GENERATOR
  const generateAISmartDraft = async () => {
    if (!selectedCustomerId) return;
    const profile = customers.find(c => c.id === selectedCustomerId);
    if (!profile) return;

    setIsAiGeneratingDraft(true);
    triggerNotification(`Personalizing payment reminder draft for ${profile.name}...`);

    const userPrompt = `Generate a highly personalized payment follow-up message for my customer:
    Customer Name: ${profile.name}
    Outstanding Balance: ₹${profile.pendingAmount}
    Deliveries Log notes: "${profile.notes || 'none'}"
    Business/Farm Name: ${businessName}
    My payment UPI ID: ${upiId}
    
    Tone Guidelines:
    - If outstanding balance is high (over ₹2000), make the tone polite but firm.
    - If outstanding balance is low (under ₹1000), make the tone friendly, inviting, and highly respectful.
    - Do not sound like a machine. Keep it conversational. Sound like a warm boutique butter farmer. Length: under 80 words.`;

    const payload = {
      contents: [{ parts: [{ text: userPrompt }] }]
    };

    try {
      const data = await callGeminiWithBackoff(payload);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setAiCustomDraftText(text);
        triggerNotification("Smart reminder drafted successfully!");
      }
    } catch (e) {
      triggerNotification("AI draft generator failed.", "error");
    } finally {
      setIsAiGeneratingDraft(false);
    }
  };

  // 4. GEMINI TEXT-TO-SPEECH (TTS) NARRATOR
  const speakReceiptVoucher = async () => {
    if (!selectedReceiptTx) return;
    setIsTtsSpeaking(true);
    triggerNotification("Converting receipt text to sweet audio...");

    const speakText = `Say cheerfully: Hello! This is a formal receipt from ${businessName}. ${
      selectedReceiptTx.type === 'sale' 
        ? `We successfully dispatched ${selectedReceiptTx.quantityKg} kilograms of Vedic Ghee to ${selectedReceiptTx.customerName}. The total bill is Rupees ${selectedReceiptTx.totalAmount}, with Rupees ${selectedReceiptTx.amountPaid} paid instantly.`
        : `We successfully recorded a payment of Rupees ${selectedReceiptTx.amountPaid} from ${selectedReceiptTx.customerName}. Thank you for choosing us.`
    }`;

    const payload = {
      contents: [{ parts: [{ text: speakText }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Zephyr" 
            }
          }
        }
      }
    };

    try {
      const data = await callGeminiWithBackoff(payload, "gemini-2.5-flash-preview-tts");
      const base64Audio = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (base64Audio) {
        if (audioPlayUrl) URL.revokeObjectURL(audioPlayUrl);
        const url = pcmToWav(base64Audio, 24000);
        setAudioPlayUrl(url);
        
        const audio = new Audio(url);
        audio.play();
        audio.onended = () => setIsTtsSpeaking(false);
      } else {
        triggerNotification("No audio bytes retrieved.", "error");
        setIsTtsSpeaking(false);
      }
    } catch (e) {
      console.error(e);
      triggerNotification("Audio narration unavailable.", "error");
      setIsTtsSpeaking(false);
    }
  };

  // ================= VOICE ASSIST RECOGNITION PROCESSORS =================
  const processSpeechThroughGemini = async (speechText) => {
    setIsAiProcessing(true);
    triggerNotification('Analyzing spoken statement...');

    const systemPrompt = `You are the unstructured statement parser for GheeLedger. Your job is to parse unstructured spoken records into structured JSON.
    Existing Customers: ${JSON.stringify(customers.map(c => ({ id: c.id, name: c.name })))}
    Default Rate per kg: ₹${defaultRate}.
    Current Date: ${new Date().toISOString().split('T')[0]}.

    Instructions:
    1. Match the parsed customer name to one of our existing customers if there's a strong matches (e.g., "Rajesh" matches "Rajesh Kumar"). If it is a completely new name, output that name and set customerId to "".
    2. Identify transaction type: "sale" (e.g., "took ghee", "bought", "delivered") or "payment" (e.g., "paid", "received cash", "cleared dues").
    3. Extract quantityKg and ratePerKg. If the transaction type is a "payment", set quantityKg and ratePerKg to 0.
    4. If the type is "sale", determine amountPaid. If speech says "fully paid" or "paid full", amountPaid should equal quantityKg * ratePerKg. If speech says "paid nothing" or "on credit", set amountPaid to 0.
    5. Formulate short concise notes summarizing the action.`;

    const payload = {
      contents: [{
        parts: [{ text: `Parse this dictation: "${speechText}"` }]
      }],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            customerId: { type: "STRING", description: "Matched customer ID or empty string" },
            customerName: { type: "STRING", description: "Parsed customer name" },
            type: { type: "STRING", enum: ["sale", "payment"], description: "sale or payment transaction" },
            quantityKg: { type: "NUMBER", description: "Weight of Ghee in kg" },
            ratePerKg: { type: "NUMBER", description: "Rate per kg in rupees" },
            amountPaid: { type: "NUMBER", description: "Amount paid instantly by customer" },
            notes: { type: "STRING", description: "Short descriptive summary memo" }
          },
          required: ["customerName", "type", "quantityKg", "ratePerKg", "amountPaid"]
        }
      }
    };

    try {
      const data = await callGeminiWithBackoff(payload);
      const parsedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (parsedText) {
        const result = JSON.parse(parsedText);
        setParsedPreview(result);
        triggerNotification('Parsed spoke request successfully!');
      }
    } catch (err) {
      console.error(err);
      triggerNotification('AI parsing failed. Please type/adjust manually.', 'error');
    } finally {
      setIsAiProcessing(false);
    }
  };

  // ================= PAPER SCANNING OCR PROCESSORS =================
  const handleOCRFileSelection = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result;
      setScanPreviewImage(base64Data);
      processOCRImageThroughGemini(base64Data.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const processOCRImageThroughGemini = async (base64Image) => {
    setIsScanningImage(true);
    triggerNotification('Reading paper ledger records...');

    const systemPrompt = `You are an OCR and handwriting parsing engine for GheeLedger. Analyze the photo of the handwritten notebook note, ledger page, or paper receipt. Extract ghee transaction logs.
    Existing Customers: ${JSON.stringify(customers.map(c => ({ id: c.id, name: c.name })))}
    Default Rate per kg: ₹${defaultRate}.
    Current Date: ${new Date().toISOString().split('T')[0]}.

    Instructions:
    1. Recognize customer name and match it to existing profiles. If new, return customerName and leave customerId as empty "".
    2. Capture ghee dispatch weight (kg), rate, total amount, and cash paid instantly.
    3. Return structured data as sale or payment.`;

    const payload = {
      contents: [{
        parts: [
          { text: "Analyze this handwritten transaction slip and extract details into our schema format." },
          { inlineData: { mimeType: "image/png", data: base64Image } }
        ]
      }],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            customerId: { type: "STRING", description: "ID of matched customer or empty string" },
            customerName: { type: "STRING", description: "Parsed customer name" },
            type: { type: "STRING", enum: ["sale", "payment"], description: "sale or payment" },
            quantityKg: { type: "NUMBER", description: "Weight of Ghee in kg" },
            ratePerKg: { type: "NUMBER", description: "Rate per kg in rupees" },
            amountPaid: { type: "NUMBER", description: "Amount paid instantly by customer" },
            notes: { type: "STRING", description: "Handwritten memo transcription or notes" }
          },
          required: ["customerName", "type", "quantityKg", "ratePerKg", "amountPaid"]
        }
      }
    };

    try {
      const data = await callGeminiWithBackoff(payload);
      const parsedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (parsedText) {
        const result = JSON.parse(parsedText);
        setParsedPreview(result);
        triggerNotification('Paper records parsed successfully!');
      }
    } catch (err) {
      console.error(err);
      triggerNotification('OCR failed. Re-capture or key in manually.', 'error');
    } finally {
      setIsScanningImage(false);
    }
  };

  // Commit Parsed Voice / Scan Entry
  const handleCommitParsedPreview = () => {
    if (!parsedPreview) return;

    let targetCustomerId = parsedPreview.customerId;
    let targetCustomerName = parsedPreview.customerName;

    if (!targetCustomerId) {
      const matched = customers.find(c => c.name.toLowerCase() === targetCustomerName.toLowerCase());
      if (matched) {
        targetCustomerId = matched.id;
        targetCustomerName = matched.name;
      } else {
        targetCustomerId = 'cust_' + Date.now();
        const newCust = {
          id: targetCustomerId,
          name: targetCustomerName,
          phone: '9999999999', 
          totalGheeKg: 0,
          pendingAmount: 0,
          notes: 'Auto-registered via AI Assist'
        };
        setCustomers(prev => [...prev, newCust]);
      }
    }

    const quantity = parseFloat(parsedPreview.quantityKg) || 0;
    const rate = parseFloat(parsedPreview.ratePerKg) || 0;
    const received = parseFloat(parsedPreview.amountPaid) || 0;
    const isDispatch = parsedPreview.type === 'sale';

    const calculatedBill = isDispatch ? (quantity * rate) : 0;
    const pendingBalanceChange = isDispatch ? (calculatedBill - received) : -received;

    const finalTxId = 'tx_' + Date.now();
    const finalTx = {
      id: finalTxId,
      customerId: targetCustomerId,
      customerName: targetCustomerName,
      type: parsedPreview.type,
      quantityKg: isDispatch ? quantity : 0,
      ratePerKg: isDispatch ? rate : 0,
      totalAmount: calculatedBill,
      amountPaid: received,
      date: new Date().toISOString().split('T')[0],
      notes: parsedPreview.notes || (isDispatch ? `Delivered ${quantity} kg Ghee` : 'Payment received')
    };

    setCustomers(prev => prev.map(c => {
      if (c.id === targetCustomerId) {
        return {
          ...c,
          totalGheeKg: c.totalGheeKg + (isDispatch ? quantity : 0),
          pendingAmount: Math.max(0, c.pendingAmount + pendingBalanceChange)
        };
      }
      return c;
    }));

    setTransactions(prev => [finalTx, ...prev]);
    triggerNotification(`AI entry saved successfully!`);
    setReceiptTxId(finalTxId);

    setParsedPreview(null);
    setSpeechResultText('');
    setScanPreviewImage(null);
    setRecordMethod('manual');
    setActiveTab('customers');
  };

  // Config presets
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
        triggerNotification("Invalid presets. Numbers separated by commas only.", "error");
        return;
      }

      setWeightPresets(parsedWeights);
      setRatePresets(parsedRates);
      triggerNotification("Presets successfully updated!");
    } catch (err) {
      triggerNotification("Error parsing presets.", "error");
    }
  };

  // Register Customers
  const registerNewCustomerForm = (e) => {
    registerNewCustomer(e);
  };

  // Quick helper to select entry method via speed dial button
  const selectEntryMethod = (method) => {
    setRecordMethod(method);
    setParsedPreview(null);
    setIsSpeedDialOpen(false);
    setActiveTab('quick-add');
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] font-sans-humanist text-[#141413] flex flex-col no-select">
      <MobileStylingAndAnimations />

      {/* MOBILE CHASSIS CONTAINER (Strict viewport height to trap floating elements correctly) */}
      <div className="w-full max-w-md mx-auto bg-[#faf9f5] h-[100dvh] max-h-[100dvh] flex flex-col justify-between shadow-lg relative border-l border-r border-[#e6dfd8] overflow-hidden">
        
        {/* 1. TOP MOBILE BAR STICKY HEADER */}
        <header className="flex-shrink-0 bg-[#faf9f5]/95 backdrop-blur-md border-b border-[#e6dfd8] px-4 py-3.5 flex items-center justify-between z-20">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-[#181715] flex items-center justify-center text-[#faf9f5]">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 stroke-current" strokeWidth="2.5">
                <path d="M12 3v18M3 12h18M5.636 5.636l12.728 12.728M5.636 18.364L18.364 5.636" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <span className="font-serif-editorial text-lg font-semibold tracking-tight">{businessName.split(' ')[0]}<span className="text-[#cc785c]">Ledger</span></span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button 
              onClick={() => setIsAddCustomerOpen(true)}
              className="p-1.5 border border-[#e6dfd8] active:bg-[#efe9de] text-[#cc785c] rounded-md transition duration-150"
              title="Add New Account"
            >
              <UserPlus className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                const data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ customers, transactions, businessName, upiId, defaultRate, weightPresets, ratePresets }, null, 2));
                const a = document.createElement('a');
                a.setAttribute("href", data);
                a.setAttribute("download", `${businessName.replace(/\s+/g, '_')}_Backup_${new Date().toISOString().split('T')[0]}.json`);
                a.click();
                triggerNotification("Backup exported!");
              }}
              className="p-1.5 border border-[#e6dfd8] active:bg-[#efe9de] text-[#6c6a64] rounded-md"
              title="Backup Data"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* 2. SCROLLABLE TABBED MOBILE VIEWPORT */}
        <main className="flex-grow overflow-y-auto no-scrollbar px-4 pb-28 pt-2 z-10 relative">

          {/* TAB 1: CUSTOMERS DIRECTORY */}
          {activeTab === 'customers' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Floating Quick Stat Pills */}
              <div className="grid grid-cols-2 gap-2 bg-[#efe9de] p-1.5 rounded-lg border border-[#e6dfd8]">
                <div className="bg-[#faf9f5] rounded-md p-2.5 text-center border border-[#e6dfd8]/50">
                  <span className="text-[10px] text-[#6c6a64] uppercase tracking-wider block font-bold">Total Outstanding</span>
                  <span className="font-serif-editorial text-lg font-bold text-[#c64545] block mt-0.5">₹{metrics.totalPending.toLocaleString('en-IN')}</span>
                  <span className="text-[9px] text-[#8e8b82] block mt-0.5">Across {metrics.dueAccounts} buyers</span>
                </div>
                <div className="bg-[#faf9f5] rounded-md p-2.5 text-center border border-[#e6dfd8]/50">
                  <span className="text-[10px] text-[#6c6a64] uppercase tracking-wider block font-bold">Ghee Supplied</span>
                  <span className="font-serif-editorial text-lg font-bold text-[#141413] block mt-0.5">{metrics.volumeKg} kg</span>
                  <span className="text-[9px] text-[#8e8b82] block mt-0.5">Cumulative weight</span>
                </div>
              </div>

              {/* Search field & filter toggles */}
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-[#8e8b82]" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search client name or mobile..."
                    className="w-full pl-9 pr-8 py-2.5 bg-[#efe9de]/50 border border-[#e6dfd8] rounded-md text-sm text-[#141413] placeholder-[#8e8b82] focus:outline-none focus:ring-2 focus:ring-[#cc785c]/15 focus:border-[#cc785c]"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2.5 p-0.5 text-[#8e8b82]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filter Toggles */}
                <div className="flex space-x-1 overflow-x-auto no-scrollbar pt-1">
                  {['all', 'due', 'clear'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setFilterType(opt)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition ${
                        filterType === opt 
                          ? 'bg-[#cc785c] text-white' 
                          : 'bg-[#efe9de] text-[#6c6a64] border border-[#e6dfd8]/50'
                      }`}
                    >
                      {opt === 'all' && `All Clients (${customers.length})`}
                      {opt === 'due' && `Outstanding (${metrics.dueAccounts})`}
                      {opt === 'clear' && `Cleared (${customers.length - metrics.dueAccounts})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer cards directory list */}
              <div className="space-y-3 pt-1">
                {listFilteredCustomers.length === 0 ? (
                  <div className="text-center py-10 bg-[#efe9de]/40 border border-dashed border-[#e6dfd8] rounded-lg">
                    <Users className="w-8 h-8 text-[#8e8b82] mx-auto mb-2" />
                    <p className="text-xs text-[#6c6a64]">No clients match your selection.</p>
                  </div>
                ) : (
                  listFilteredCustomers.map(cust => {
                    const isDue = cust.pendingAmount > 0;
                    return (
                      <div 
                        key={cust.id}
                        onClick={() => setSelectedCustomerId(cust.id)}
                        className="bg-[#efe9de] border border-[#e6dfd8] active:border-[#cc785c] rounded-lg p-3.5 transition duration-100 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-[#faf9f5] border border-[#e6dfd8] flex items-center justify-center font-serif-editorial text-base font-bold text-[#cc785c]">
                            {cust.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-[#141413] leading-tight">{cust.name}</h3>
                            <p className="text-[11px] text-[#6c6a64] mt-0.5">{cust.phone}</p>
                            <span className="inline-block px-1.5 py-0.5 bg-[#faf9f5] text-[9px] font-sans-humanist text-[#8e8b82] rounded border border-[#e6dfd8]/50 mt-1 font-semibold">
                              Total Ghee: {cust.totalGheeKg} kg
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end space-y-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isDue ? 'bg-[#c64545]/10 text-[#c64545]' : 'bg-[#5db872]/10 text-[#5db872]'
                          }`}>
                            {isDue ? `₹${cust.pendingAmount}` : 'No Dues'}
                          </span>
                          <span className="text-[10px] text-[#cc785c] flex items-center font-semibold">
                            Profile <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

          {/* TAB 2: RICH ANALYTICS PAGE (WITH AI COPILOT CARD INTEGRATION) */}
          {activeTab === 'analytics' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-[#efe9de] p-3.5 rounded-lg border border-[#e6dfd8]">
                <div className="flex items-center space-x-2 text-[#cc785c]">
                  <TrendingUp className="w-5 h-5" />
                  <h3 className="font-serif-editorial text-lg font-bold text-[#141413]">Performance Metrics</h3>
                </div>
                <p className="text-xs text-[#6c6a64] mt-1">Live visual insights on sales realization, dispatches, and pending collections.</p>
              </div>

              {/* GEMINI COPILOT FLOATING PANEL */}
              <div className="bg-[#f5f0e8] border-2 border-[#cc785c]/40 rounded-xl p-4.5 space-y-3 relative shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[#cc785c]">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <h3 className="font-serif-editorial text-lg font-bold text-[#141413]">Business AI Advisor</h3>
                  </div>
                  <button 
                    type="button"
                    disabled={isCopilotLoading}
                    onClick={fetchBusinessInsights}
                    className="p-1.5 bg-[#cc785c] active:bg-[#a9583e] disabled:opacity-50 text-white rounded-md text-xs font-bold"
                    title="Run Gemini Analytics"
                  >
                    {isCopilotLoading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <RefreshCw className="w-4.5 h-4.5" />}
                  </button>
                </div>

                {copilotInsightsText ? (
                  <div className="text-xs text-[#3d3d3a] leading-relaxed font-sans-humanist bg-[#faf9f5] border border-[#e6dfd8] p-3.5 rounded-lg whitespace-pre-line text-left">
                    {copilotInsightsText}
                  </div>
                ) : (
                  <div className="text-xs text-[#6c6a64] text-center py-4 border border-dashed border-[#e6dfd8] rounded-lg">
                    <p>Tap the refresh button to let Gemini analyze your ledger cash flows and write customized strategic pricing/collection plans.</p>
                  </div>
                )}
              </div>

              {/* Progress Collection Cleared Rate Bar */}
              <div className="bg-[#efe9de] border border-[#e6dfd8] rounded-lg p-4 space-y-2.5">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-[#6c6a64] uppercase tracking-wider">Collections Realization</span>
                  <span className="text-[#5db872]">{metrics.collectionRate}% Cleared</span>
                </div>
                
                {/* Horizontal Progress Track */}
                <div className="h-2 w-full bg-[#faf9f5] rounded-full overflow-hidden border border-[#e6dfd8]/50">
                  <div 
                    className="h-full bg-[#5db872] transition-all duration-500 rounded-full"
                    style={{ width: `${metrics.collectionRate}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-[#8e8b82]">
                  <span>Total Cash: ₹{metrics.cashCollected.toLocaleString('en-IN')}</span>
                  <span>Target: ₹{metrics.totalSalesRevenue.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Leaderboard panel */}
              <div className="bg-[#efe9de] border border-[#e6dfd8] rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2 text-[#cc785c]">
                  <Award className="w-4.5 h-4.5" />
                  <h3 className="font-serif-editorial text-base font-bold text-[#141413]">Top Consumers</h3>
                </div>
                
                <div className="divide-y divide-[#e6dfd8]/70">
                  {metrics.topBuyers.length === 0 ? (
                    <p className="text-xs text-[#8e8b82] italic text-center py-2">No consumer analytics recorded yet.</p>
                  ) : (
                    metrics.topBuyers.map((buyer, index) => (
                      <div key={buyer.id} className="py-2.5 flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center space-x-2">
                          <span className="font-serif-editorial text-[#cc785c] font-bold text-sm">#{index + 1}</span>
                          <span className="text-[#141413] font-sans-humanist font-semibold">{buyer.name}</span>
                        </div>
                        <span className="text-[#6c6a64] bg-[#faf9f5] px-2 py-0.5 rounded border border-[#e6dfd8]/40 font-semibold">
                          {buyer.totalGheeKg} kg dispatched
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Total business income metrics block */}
              <div className="bg-[#181715] text-[#faf9f5] border border-[#252320] rounded-lg p-4 font-mono-code text-xs space-y-3">
                <div className="flex justify-between text-[#a09d96] border-b border-[#252320] pb-2">
                  <span>METRIC SUMMARY</span>
                  <span>VALUE IN ₹</span>
                </div>
                <div className="flex justify-between font-sans-humanist font-semibold">
                  <span>Gross Billings Recorded:</span>
                  <span className="text-white font-bold">₹{metrics.totalSalesRevenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#5db872] font-sans-humanist font-semibold">
                  <span>Collected Cash Flow:</span>
                  <span className="font-bold">₹{metrics.cashCollected.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#c64545] font-sans-humanist font-semibold">
                  <span>Pending Dues Outstanding:</span>
                  <span className="font-bold">₹{metrics.totalPending.toLocaleString('en-IN')}</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: ONE-HANDED RECORD HUB */}
          {activeTab === 'quick-add' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* ================= METHOD A: MANUAL RECORD FORM ================= */}
              {recordMethod === 'manual' && (
                <form onSubmit={commitQuickTransaction} className="space-y-4">
                  {/* Target Customer Dropdown */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#6c6a64] uppercase tracking-wider mb-1.5 font-sans-humanist">Deliver Ghee To *</label>
                    <select
                      required
                      value={quickTx.customerId}
                      onChange={(e) => setQuickTx(prev => ({ ...prev, customerId: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-[#faf9f5] border border-[#e6dfd8] rounded-md text-sm text-[#141413] focus:outline-none focus:ring-2 focus:ring-[#cc785c]/15 focus:border-[#cc785c]"
                    >
                      <option value="">-- Choose registered customer --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} (Outstanding: ₹{c.pendingAmount})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Transaction Mode Button Segment */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#6c6a64] uppercase tracking-wider mb-2">Select Operation Mode</label>
                    <div className="grid grid-cols-2 gap-2 bg-[#efe9de] p-1 rounded-md">
                      <button
                        type="button"
                        onClick={() => setQuickTx(prev => ({ ...prev, type: 'sale' }))}
                        className={`py-2 text-xs font-bold uppercase tracking-wider rounded-md transition ${
                          quickTx.type === 'sale' ? 'bg-[#cc785c] text-white shadow-sm' : 'text-[#6c6a64]'
                        }`}
                      >
                        Dispatch Ghee
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickTx(prev => ({ ...prev, type: 'payment' }))}
                        className={`py-2 text-xs font-bold uppercase tracking-wider rounded-md transition ${
                          quickTx.type === 'payment' ? 'bg-[#5db872] text-white shadow-sm' : 'text-[#6c6a64]'
                        }`}
                      >
                        Receive Cash
                      </button>
                    </div>
                  </div>

                  {quickTx.type === 'sale' ? (
                    <>
                      {/* Ghee weight preset selectors */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-[11px] font-bold text-[#6c6a64] uppercase tracking-wider">Weight (kg / Liters)</label>
                          <span className="font-sans-humanist text-sm font-bold text-[#cc785c] bg-[#cc785c]/10 px-2 py-0.5 rounded">
                            {quickTx.quantityKg} kg
                          </span>
                        </div>
                        
                        {/* Dynamic Weight presets mapping */}
                        <div className="grid grid-cols-5 gap-1.5 mb-2">
                          {weightPresets.map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setFixedQuantity(val)}
                              className={`py-2 border text-xs font-semibold rounded-md transition ${
                                quickTx.quantityKg === val && !showCustomWeight
                                  ? 'bg-[#cc785c] text-white border-[#cc785c]' 
                                  : 'bg-[#faf9f5] text-[#141413] border-[#e6dfd8]'
                              }`}
                            >
                              {val} kg
                            </button>
                          ))}
                          
                          <button
                            type="button"
                            onClick={() => setShowCustomWeight(!showCustomWeight)}
                            className={`py-2 border text-xs font-bold rounded-md transition ${
                              showCustomWeight ? 'bg-[#181715] text-[#faf9f5]' : 'bg-[#efe9de] text-[#cc785c] border-[#cc785c]/30'
                            }`}
                          >
                            Custom
                          </button>
                        </div>

                        {/* Custom Weight Numeric Input */}
                        {showCustomWeight && (
                          <div className="mb-3 p-3 bg-[#efe9de]/55 border border-[#e6dfd8] rounded-md animate-in slide-in-from-top-2 duration-150">
                            <label className="block text-[10px] font-bold text-[#6c6a64] uppercase tracking-wider mb-1">Enter Custom Ghee Weight (kg)</label>
                            <div className="relative">
                              <input
                                type="number"
                                step="any"
                                min="0.01"
                                value={quickTx.quantityKg || ''}
                                onChange={(e) => setQuickTx(prev => ({ ...prev, quantityKg: parseFloat(e.target.value) || 0 }))}
                                placeholder="e.g., 1.75"
                                className="w-full px-3 py-2 bg-[#faf9f5] border border-[#e6dfd8] rounded-md text-sm text-[#141413] focus:ring-2 focus:ring-[#cc785c]/15 focus:border-[#cc785c] focus:outline-none"
                              />
                              <span className="absolute right-3 top-2 text-xs font-semibold text-[#8e8b82]">kg</span>
                            </div>
                          </div>
                        )}

                        {/* Increment Steppers */}
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => adjustQuantity(-0.5)}
                            className="flex-1 py-2 bg-[#efe9de] border border-[#e6dfd8] rounded-md text-sm font-bold text-[#141413]"
                          >
                            - 0.5 kg
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustQuantity(0.5)}
                            className="flex-1 py-2 bg-[#efe9de] border border-[#e6dfd8] rounded-md text-sm font-bold text-[#141413]"
                          >
                            + 0.5 kg
                          </button>
                        </div>
                      </div>

                      {/* Rate selectors based on settings presets */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-[11px] font-bold text-[#6c6a64] uppercase tracking-wider">Rate per kg</label>
                          <span className="font-sans-humanist text-xs font-semibold text-[#141413]">₹{quickTx.ratePerKg} / kg</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {ratePresets.map((rate) => (
                            <button
                              key={rate}
                              type="button"
                              onClick={() => {
                                setShowCustomRate(false);
                                setQuickTx(prev => ({ ...prev, ratePerKg: rate }));
                              }}
                              className={`py-1.5 border text-xs font-semibold rounded-md transition ${
                                quickTx.ratePerKg === rate && !showCustomRate
                                  ? 'bg-[#181715] text-[#faf9f5]'
                                  : 'bg-[#faf9f5] text-[#6c6a64] border-[#e6dfd8]'
                              }`}
                            >
                              ₹{rate}
                            </button>
                          ))}

                          <button
                            type="button"
                            onClick={() => setShowCustomRate(!showCustomRate)}
                            className={`py-1.5 border text-xs font-bold rounded-md transition ${
                              showCustomRate ? 'bg-[#181715] text-[#faf9f5]' : 'bg-[#efe9de] text-[#cc785c] border-[#cc785c]/30'
                            }`}
                          >
                            Custom
                          </button>
                        </div>

                        {/* Custom Rate input */}
                        {showCustomRate && (
                          <div className="mt-2.5 p-3 bg-[#efe9de]/55 border border-[#e6dfd8] rounded-md animate-in slide-in-from-top-2 duration-150">
                            <label className="block text-[10px] font-bold text-[#6c6a64] uppercase tracking-wider mb-1">Custom Rate (₹ per kg)</label>
                            <input
                              type="number"
                              min="1"
                              value={quickTx.ratePerKg || ''}
                              onChange={(e) => setQuickTx(prev => ({ ...prev, ratePerKg: parseInt(e.target.value) || 0 }))}
                              placeholder="e.g., 1350"
                              className="w-full px-3 py-2 bg-[#faf9f5] border border-[#e6dfd8] rounded-md text-sm text-[#141413]"
                            />
                          </div>
                        )}
                      </div>

                      {/* Pure dynamic calculated summaries */}
                      <div className="bg-[#efe9de] p-3.5 rounded-lg border border-[#e6dfd8]">
                        <div className="flex justify-between text-xs font-sans-humanist font-semibold">
                          <span>Calculated Bill:</span>
                          <span className="font-bold text-[#141413]">₹{computedTotalBill}</span>
                        </div>
                        {computedLeftoverDues > 0 && (
                          <div className="flex justify-between text-xs font-sans-humanist font-semibold text-[#c64545] mt-1.5">
                            <span>Pending Addition:</span>
                            <span className="font-bold">₹{computedLeftoverDues}</span>
                          </div>
                        )}
                      </div>

                      {/* Amount Paid instantly */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-[11px] font-bold text-[#6c6a64] uppercase tracking-wider">Amount Paid Instantly (₹)</label>
                          <span className="font-sans-humanist text-sm font-bold text-[#5db872]">₹{quickTx.amountPaid}</span>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-1.5 mb-2">
                          <button
                            type="button"
                            onClick={() => { setShowCustomAmount(false); setQuickTx(prev => ({ ...prev, amountPaid: 0 })); }}
                            className={`py-1.5 border text-xs font-semibold rounded-md transition ${quickTx.amountPaid === 0 && !showCustomAmount ? 'bg-[#c64545] text-white font-semibold' : 'bg-[#faf9f5] text-[#6c6a64] border-[#e6dfd8]'}`}
                          >
                            Unpaid
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowCustomAmount(false); setQuickTx(prev => ({ ...prev, amountPaid: computedTotalBill })); }}
                            className={`py-1.5 border text-xs font-semibold rounded-md transition ${quickTx.amountPaid === computedTotalBill && !showCustomAmount ? 'bg-[#5db872] text-white font-semibold' : 'bg-[#faf9f5] text-[#6c6a64] border-[#e6dfd8]'}`}
                          >
                            Fully Paid
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowCustomAmount(false); setQuickTx(prev => ({ ...prev, amountPaid: Math.round(computedTotalBill / 2) })); }}
                            className={`py-1.5 border text-xs font-semibold rounded-md transition ${quickTx.amountPaid === Math.round(computedTotalBill / 2) && !showCustomAmount ? 'bg-[#181715] text-[#faf9f5] font-semibold' : 'bg-[#faf9f5] text-[#6c6a64] border-[#e6dfd8]'}`}
                          >
                            50% Paid
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCustomAmount(!showCustomAmount)}
                            className={`py-1.5 border text-xs font-bold rounded-md transition ${showCustomAmount ? 'bg-[#181715] text-[#faf9f5]' : 'bg-[#efe9de] text-[#cc785c]'}`}
                          >
                            Custom
                          </button>
                        </div>

                        {showCustomAmount && (
                          <div className="my-2.5 p-3 bg-[#efe9de]/55 border border-[#e6dfd8] rounded-md animate-in slide-in-from-top-2 duration-150">
                            <label className="block text-[10px] font-bold text-[#6c6a64] uppercase tracking-wider mb-1">Enter Custom Paid Cash (₹)</label>
                            <input
                              type="number"
                              min="0"
                              value={quickTx.amountPaid || ''}
                              onChange={(e) => setQuickTx(prev => ({ ...prev, amountPaid: parseInt(e.target.value) || 0 }))}
                              placeholder="e.g., 750"
                              className="w-full px-3 py-2 bg-[#faf9f5] border border-[#e6dfd8] rounded-md text-sm text-[#141413] focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    /* Cash payment received form fields */
                    <div className="space-y-4 animate-in fade-in duration-100">
                      <div>
                        <label className="block text-[11px] font-bold text-[#6c6a64] uppercase tracking-wider mb-1.5">Cash Amount Received (₹)</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={quickTx.amountPaid}
                          onChange={(e) => setQuickTx(prev => ({ ...prev, amountPaid: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2.5 bg-[#faf9f5] border border-[#e6dfd8] rounded-md text-sm text-[#141413]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Transaction metadata */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6c6a64] uppercase tracking-wider mb-1 font-semibold">Log Date</label>
                      <input
                        type="date"
                        required
                        value={quickTx.date}
                        onChange={(e) => setQuickTx(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-3 py-1.5 bg-[#faf9f5] border border-[#e6dfd8] rounded-md text-xs text-[#141413]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6c6a64] uppercase tracking-wider mb-1 font-semibold">Dispatch Memo</label>
                      <input
                        type="text"
                        placeholder="UPI, Cash, etc."
                        value={quickTx.notes}
                        onChange={(e) => setQuickTx(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-3 py-1.5 bg-[#faf9f5] border border-[#e6dfd8] rounded-md text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 text-sm font-semibold text-white rounded-md mt-4 bg-[#cc785c] active:bg-[#a9583e]"
                  >
                    Commit Ledger Record
                  </button>
                </form>
              )}

              {/* ================= METHOD B: VOICE ASSIST RECORDER ================= */}
              {recordMethod === 'voice' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="bg-[#efe9de] border border-[#e6dfd8] rounded-lg p-5 flex flex-col items-center text-center space-y-4">
                    
                    {/* Visualizer and Mic Button */}
                    <div className="relative">
                      {isRecording && (
                        <div className="absolute inset-0 rounded-full bg-[#cc785c] voice-pulse-circle" style={{ transform: 'scale(1.4)' }} />
                      )}
                      <button
                        type="button"
                        onClick={toggleVoiceRecording}
                        className={`w-16 h-16 rounded-full flex items-center justify-center relative z-10 transition-all ${
                          isRecording ? 'bg-[#c64545] text-white' : 'bg-[#cc785c] text-white active:scale-95'
                        }`}
                      >
                        <Mic className="w-7 h-7" />
                      </button>
                    </div>

                    <div className="space-y-1 text-center">
                      <h3 className="font-serif-editorial text-lg font-bold">
                        {isRecording ? 'Listening to Dispatch...' : 'Tap Mic & Dictate Statement'}
                      </h3>
                      <p className="text-xs text-[#6c6a64] max-w-xs mx-auto font-sans-humanist font-medium leading-relaxed">
                        Speak clearly: <span className="italic text-[#141413]">"Rajesh took 3 kg ghee and paid 2000 rupees"</span> or <span className="italic text-[#141413]">"Anita Sharma paid 500 rupees dues"</span>.
                      </p>
                    </div>
                  </div>

                  {speechResultText && (
                    <div className="bg-[#efe9de]/50 border border-[#e6dfd8] rounded-md p-3 space-y-1.5 font-sans-humanist font-medium">
                      <span className="text-[9px] text-[#6c6a64] uppercase font-bold block">Spoken Input Statement:</span>
                      <p className="text-xs italic text-[#141413]">"{speechResultText}"</p>
                    </div>
                  )}

                  {isAiProcessing && (
                    <div className="flex items-center justify-center space-x-2 py-4 text-xs font-semibold text-[#6c6a64]">
                      <Loader2 className="w-4 h-4 text-[#cc785c] animate-spin" />
                      <span>Parsing spoken data into GheeLedger...</span>
                    </div>
                  )}
                </div>
              )}

              {/* ================= METHOD C: PAPER DOCUMENT SCANNER ================= */}
              {recordMethod === 'scan' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="bg-[#efe9de] border border-[#e6dfd8] rounded-lg p-5 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
                    
                    {/* Laser scan line overlay */}
                    {isScanningImage && (
                      <div className="absolute left-0 right-0 h-1 bg-[#5db872] ocr-laser-bar opacity-80 z-20 shadow-[0_0_10px_#5db872]" />
                    )}

                    <button
                      type="button"
                      onClick={() => ocrFileInputRef.current?.click()}
                      className="w-16 h-16 rounded-full bg-[#5db872] text-white flex items-center justify-center active:scale-95 transition-all z-10 shadow-xs"
                    >
                      <Camera className="w-7 h-7" />
                    </button>

                    <div className="space-y-1">
                      <h3 className="font-serif-editorial text-lg font-bold">Scan handwritten ledger / note</h3>
                      <p className="text-xs text-[#6c6a64] max-w-xs font-sans-humanist font-semibold">
                        Snap a photo of your hand-written delivery book notes or receipts to digitize and save automatically.
                      </p>
                    </div>

                    <input
                      ref={ocrFileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleOCRFileSelection}
                      className="hidden"
                    />
                  </div>

                  {/* Scanned Image Preview and progress banner */}
                  {scanPreviewImage && (
                    <div className="border border-[#e6dfd8] rounded-md overflow-hidden relative max-h-48 flex justify-center bg-black/5">
                      <img src={scanPreviewImage} alt="Notebook Page Snapshot" className="h-full object-contain max-h-48" />
                      {isScanningImage && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="bg-[#181715]/95 text-[#faf9f5] px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-2 border border-[#252320]">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5db872]" />
                            <span>Reading handwritten values...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ================= EDITABLE REAL-TIME PREVIEW CONFIRMATION COMPONENT ================= */}
              {parsedPreview && (
                <div className="border-2 border-[#cc785c] bg-[#faf9f5] rounded-lg p-4 space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between border-b border-[#e6dfd8] pb-2">
                    <span className="text-xs font-bold text-[#cc785c] uppercase tracking-wider flex items-center gap-1">
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Confirm Extracted Record</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setParsedPreview(null)}
                      className="text-[#6c6a64]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 font-sans-humanist text-xs font-semibold text-[#141413]">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-[#6c6a64] uppercase font-bold block mb-1">Customer Name</label>
                        <input
                          type="text"
                          value={parsedPreview.customerName}
                          onChange={(e) => setParsedPreview(prev => ({ ...prev, customerName: e.target.value }))}
                          className="w-full p-2 bg-[#efe9de] border border-[#e6dfd8] rounded text-sm font-sans-humanist font-semibold text-[#141413]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#6c6a64] uppercase font-bold block mb-1">Type</label>
                        <select
                          value={parsedPreview.type}
                          onChange={(e) => setParsedPreview(prev => ({ ...prev, type: e.target.value }))}
                          className="w-full p-2 bg-[#efe9de] border border-[#e6dfd8] rounded text-sm text-[#141413]"
                        >
                          <option value="sale">Dispatch (Sale)</option>
                          <option value="payment">Receive Payment</option>
                        </select>
                      </div>
                    </div>

                    {parsedPreview.type === 'sale' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-[#6c6a64] uppercase font-bold block mb-1">Quantity (kg)</label>
                          <input
                            type="number"
                            step="any"
                            value={parsedPreview.quantityKg}
                            onChange={(e) => setParsedPreview(prev => ({ ...prev, quantityKg: parseFloat(e.target.value) || 0 }))}
                            className="w-full p-2 bg-[#efe9de] border border-[#e6dfd8] rounded text-sm text-[#141413]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#6c6a64] uppercase font-bold block mb-1">Rate (₹/kg)</label>
                          <input
                            type="number"
                            value={parsedPreview.ratePerKg}
                            onChange={(e) => setParsedPreview(prev => ({ ...prev, ratePerKg: parseInt(e.target.value) || 0 }))}
                            className="w-full p-2 bg-[#efe9de] border border-[#e6dfd8] rounded text-sm text-[#141413]"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-[#6c6a64] uppercase font-bold block mb-1">Amount Paid (₹)</label>
                        <input
                          type="number"
                          value={parsedPreview.amountPaid}
                          onChange={(e) => setParsedPreview(prev => ({ ...prev, amountPaid: parseInt(e.target.value) || 0 }))}
                          className="w-full p-2 bg-[#efe9de] border border-[#e6dfd8] rounded text-sm text-[#5db872] font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#6c6a64] uppercase font-bold block mb-1">Memo/Notes</label>
                        <input
                          type="text"
                          value={parsedPreview.notes || ''}
                          onChange={(e) => setParsedPreview(prev => ({ ...prev, notes: e.target.value }))}
                          className="w-full p-2 bg-[#efe9de] border border-[#e6dfd8] rounded text-sm text-[#141413]"
                        />
                      </div>
                    </div>

                    {parsedPreview.type === 'sale' && (
                      <div className="bg-[#efe9de]/50 p-2.5 rounded border border-[#e6dfd8] text-[11px] space-y-0.5 font-sans-humanist">
                        <div className="flex justify-between">
                          <span className="text-[#6c6a64]">Total Bill:</span>
                          <span className="font-bold text-[#141413]">₹{parsedPreview.quantityKg * parsedPreview.ratePerKg}</span>
                        </div>
                        <div className="flex justify-between text-[#c64545] font-semibold">
                          <span>Dues Addition:</span>
                          <span>₹{Math.max(0, (parsedPreview.quantityKg * parsedPreview.ratePerKg) - parsedPreview.amountPaid)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleCommitParsedPreview}
                    className="w-full py-2.5 bg-[#cc785c] text-white text-xs font-bold uppercase tracking-wider rounded-md flex items-center justify-center space-x-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm & Commit Ledger Entry</span>
                  </button>
                </div>
              )}

            </div>
          )}

          {/* TAB 4: RECENT RECEIPT VOUCHERS LIST */}
          {activeTab === 'vouchers' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-[#efe9de] p-3.5 rounded-lg border border-[#e6dfd8]">
                <div className="flex items-center space-x-2 text-[#cc785c]">
                  <FileText className="w-5 h-5" />
                  <h3 className="font-serif-editorial text-lg font-bold text-[#141413]">Receipt Hub</h3>
                </div>
                <p className="text-xs text-[#6c6a64] mt-1 font-semibold">Tap any transactional dispatch item below to render a beautiful printable invoice statement.</p>
              </div>

              {/* Grid of quick receipts list */}
              <div className="space-y-2.5">
                {transactions.length === 0 ? (
                  <p className="text-xs text-[#8e8b82] text-center py-8">No printable records available.</p>
                ) : (
                  transactions.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setReceiptTxId(item.id)}
                      className="w-full bg-[#efe9de]/40 border border-[#e6dfd8] active:border-[#cc785c] rounded-lg p-3 text-left flex items-center justify-between animate-in slide-in-from-bottom-2 duration-100"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] block text-[#6c6a64] font-medium">{item.date} ● {item.id}</span>
                        <span className="font-semibold text-[#141413] text-sm block">{item.customerName}</span>
                        <span className="text-[11px] text-[#8e8b82] block font-medium font-semibold">
                          {item.type === 'sale' ? `Ghee Delivered (${item.quantityKg} kg)` : 'Dues Settled'}
                        </span>
                      </div>

                      <div className="text-right space-y-1 font-sans-humanist">
                        <span className={`text-sm font-bold block ${item.type === 'sale' ? 'text-[#141413]' : 'text-[#5db872]'}`}>
                          ₹{item.type === 'sale' ? item.totalAmount : item.amountPaid}
                        </span>
                        <span className="text-[10px] text-[#cc785c] font-sans-humanist font-semibold">Generate →</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: APP SETTINGS PAGE */}
          {activeTab === 'settings' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Business settings card */}
              <div className="bg-[#efe9de] border border-[#e6dfd8] rounded-lg p-4 space-y-3.5">
                <div className="flex items-center space-x-2 text-[#cc785c]">
                  <Briefcase className="w-5 h-5" />
                  <h3 className="font-serif-editorial text-lg font-bold text-[#141413]">Business Profile Settings</h3>
                </div>
                
                <div className="space-y-3 font-sans-humanist font-semibold text-[#141413]">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6c6a64] uppercase tracking-wider mb-1">Farm / Business Name</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Vedic Ghee Farm"
                      className="w-full px-3 py-2 bg-[#faf9f5] border border-[#e6dfd8] rounded-md text-sm text-[#141413] focus:outline-none focus:ring-2 focus:ring-[#cc785c]/15"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6c6a64] uppercase tracking-wider mb-1">UPI ID (For Receipt Footers)</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. merchant@upi"
                      className="w-full px-3 py-2 bg-[#faf9f5] border border-[#e6dfd8] rounded-md text-sm text-[#141413] focus:outline-none focus:ring-2 focus:ring-[#cc785c]/15"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6c6a64] uppercase tracking-wider mb-1">Standard Default Rate per kg (₹)</label>
                    <input
                      type="number"
                      value={defaultRate}
                      onChange={(e) => setDefaultRate(parseInt(e.target.value) || 1300)}
                      className="w-full px-3 py-2 bg-[#faf9f5] border border-[#e6dfd8] rounded-md text-sm text-[#141413] focus:outline-none focus:ring-2 focus:ring-[#cc785c]/15"
                    />
                  </div>
                </div>
              </div>

              {/* DYNAMIC QUICK PRESET MANAGER */}
              <div className="bg-[#efe9de] border border-[#e6dfd8] rounded-lg p-4 space-y-3.5">
                <div className="flex items-center space-x-2 text-[#cc785c]">
                  <Grid className="w-5 h-5" />
                  <h3 className="font-serif-editorial text-lg font-bold text-[#141413]">Manage Quick-Tap Presets</h3>
                </div>
                <p className="text-xs text-[#6c6a64] leading-relaxed font-sans-humanist font-semibold">Customize shortcut buttons in the record tab. Separate weights or rates with commas.</p>
                
                <div className="space-y-3 pt-1 font-sans-humanist font-semibold">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6c6a64] uppercase tracking-wider mb-1">Weight Quick Shortcuts (kg/Litres)</label>
                    <input
                      type="text"
                      value={weightPresetsInput}
                      onChange={(e) => setWeightPresetsInput(e.target.value)}
                      placeholder="e.g. 0.5, 1, 2, 5"
                      className="w-full px-3 py-2 bg-[#faf9f5] border border-[#e6dfd8] rounded-md text-sm text-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6c6a64] uppercase tracking-wider mb-1">Rate Quick Shortcuts (₹)</label>
                    <input
                      type="text"
                      value={ratePresetsInput}
                      onChange={(e) => setRatePresetsInput(e.target.value)}
                      placeholder="e.g. 1200, 1300, 1450"
                      className="w-full px-3 py-2 bg-[#faf9f5] border border-[#e6dfd8] rounded-md text-sm text-[#141413]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={savePresetConfigurations}
                    className="w-full py-2.5 bg-[#cc785c] active:bg-[#a9583e] text-white text-xs font-bold uppercase tracking-wider rounded-md"
                  >
                    Save Shortcuts Configuration
                  </button>
                </div>
              </div>

              {/* AUDIT LOG SHEET LINK */}
              <div className="bg-[#efe9de] border border-[#e6dfd8] rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2 text-[#cc785c]">
                  <Activity className="w-5 h-5" />
                  <h3 className="font-serif-editorial text-lg font-bold text-[#141413]">System logs trail</h3>
                </div>
                <p className="text-xs text-[#6c6a64] leading-relaxed font-sans-humanist font-semibold">Examine comprehensive, secure timeline tracking logs for deliveries, cash intakes, and balance revisions.</p>
                <button
                  type="button"
                  onClick={() => setIsLogsSheetOpen(true)}
                  className="w-full py-2.5 bg-[#181715] text-[#faf9f5] text-xs font-bold uppercase tracking-widest rounded-md flex items-center justify-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Open System Logs Ledger</span>
                </button>
              </div>

              {/* Data Administration & Safety Centre */}
              <div className="bg-[#efe9de] border border-[#e6dfd8] rounded-lg p-4 space-y-4 font-sans-humanist font-semibold text-xs text-[#141413]">
                <div className="flex items-center space-x-2 text-[#6c6a64]">
                  <SlidersHorizontal className="w-4.5 h-4.5" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Storage Administration</h3>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col space-y-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 bg-[#faf9f5] hover:bg-[#efe9de] border border-[#e6dfd8] text-xs font-semibold rounded-md flex items-center justify-center space-x-2 text-[#141413]"
                    >
                      <Upload className="w-4 h-4 text-[#cc785c]" />
                      <span>Import Ledger Backup Payload</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={restoreSampleData}
                    className="w-full py-2 bg-[#faf9f5] hover:bg-[#efe9de] border border-[#e6dfd8] text-xs font-semibold rounded-md flex items-center justify-center space-x-2 text-[#cc785c]"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Load Test Sandbox Sample Data</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm ? window.confirm("Are you sure you want to completely clear GheeLedger? This wipes all customer history.") : true) {
                        clearDatabase();
                      }
                    }}
                    className="w-full py-2 bg-[#c64545]/10 text-[#c64545] border border-[#c64545]/20 hover:bg-[#c64545]/20 text-xs font-semibold rounded-md flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear Cache & Wipe Database</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </main>

        {/* 3. FIXED SPEED-DIAL ENTRY SELECTOR ASSEMBLY (Positioned exactly above bottom bar, locked relative to chassis container) */}
        <div className="absolute bottom-24 right-5 z-40 flex flex-col items-end space-y-2.5 font-sans-humanist">
          {/* Expanded Menu Options */}
          {isSpeedDialOpen && (
            <div className="flex flex-col items-stretch space-y-1 bg-[#efe9de] p-2 rounded-xl border border-[#e6dfd8] shadow-lg animate-in slide-in-from-bottom-5 duration-200 w-44 mb-1">
              <div className="px-2.5 py-1.5 border-b border-[#e6dfd8]/60 mb-1">
                <span className="text-[10px] text-[#6c6a64] uppercase font-bold tracking-wider block">Recording Modes</span>
              </div>
              
              <button
                type="button"
                onClick={() => selectEntryMethod('manual')}
                className="flex items-center space-x-2.5 text-xs font-semibold text-[#141413] bg-[#faf9f5] hover:bg-[#f5f0e8] active:bg-[#f5f0e8] px-3 py-2 rounded-md transition"
              >
                <Keyboard className="w-4 h-4 text-[#cc785c]" />
                <span>Keyboard Form</span>
              </button>

              <button
                type="button"
                onClick={() => selectEntryMethod('voice')}
                className="flex items-center space-x-2.5 text-xs font-semibold text-[#141413] bg-[#faf9f5] hover:bg-[#f5f0e8] active:bg-[#f5f0e8] px-3 py-2 rounded-md transition"
              >
                <Mic className="w-4 h-4 text-[#cc785c]" />
                <span>Voice Assist</span>
              </button>

              <button
                type="button"
                onClick={() => selectEntryMethod('scan')}
                className="flex items-center space-x-2.5 text-xs font-semibold text-[#141413] bg-[#faf9f5] hover:bg-[#f5f0e8] active:bg-[#f5f0e8] px-3 py-2 rounded-md transition"
              >
                <Camera className="w-4 h-4 text-[#5db872]" />
                <span>Paper Scan</span>
              </button>
            </div>
          )}

          {/* Trigger Floating Action Button */}
          <button
            type="button"
            onClick={() => setIsSpeedDialOpen(!isSpeedDialOpen)}
            className="w-12 h-12 rounded-full bg-[#cc785c] hover:bg-[#a9583e] active:bg-[#a9583e] text-white flex items-center justify-center shadow-lg active:scale-95 transition-all z-50 border border-white/20"
            title="Fast Entry Modes"
          >
            {isSpeedDialOpen ? <X className="w-5 h-5 stroke-[2.5px]" /> : <Plus className="w-6 h-6 text-white stroke-[2.5px]" />}
          </button>
        </div>

        {/* 4. FLOATING COMPACT BOTTOM SHEET NATIVE DRAWER */}
        {selectedCustomerId && detailedSelectedCustomer && (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#141413]/70 backdrop-blur-xs">
            <div className="w-full max-w-md bg-[#faf9f5] border-t border-[#e6dfd8] rounded-t-xl overflow-hidden shadow-2xl slide-up-drawer max-h-[85vh] flex flex-col animate-in fade-in duration-200">
              
              {/* Drawer Pull Notch Indicator */}
              <div className="w-full flex justify-center py-2.5">
                <div className="w-10 h-1 bg-[#e6dfd8] rounded-full cursor-pointer" onClick={() => setSelectedCustomerId(null)} />
              </div>

              {/* Header profile details */}
              <div className="px-5 pb-3 border-b border-[#e6dfd8] flex items-center justify-between">
                <div>
                  <h3 className="font-serif-editorial text-xl font-bold text-[#141413]">{detailedSelectedCustomer.profile.name}</h3>
                  <p className="text-xs text-[#6c6a64] flex items-center gap-1 font-sans-humanist mt-0.5 font-semibold">
                    <Phone className="w-3.5 h-3.5 text-[#cc785c]" />
                    {detailedSelectedCustomer.profile.phone}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedCustomerId(null)}
                  className="p-1 bg-[#efe9de] rounded-full text-[#6c6a64]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable details container */}
              <div className="p-5 overflow-y-auto no-scrollbar space-y-4 flex-grow font-sans-humanist font-semibold">
                
                {/* Outstanding ledger badge card */}
                <div className="grid grid-cols-2 gap-3 bg-[#efe9de] p-3 rounded-lg border border-[#e6dfd8]">
                  <div className="text-center">
                    <span className="text-[9px] text-[#6c6a64] uppercase tracking-wider block font-bold">Delivered Ghee</span>
                    <span className="font-serif-editorial text-lg font-bold text-[#141413] mt-0.5 block">
                      {detailedSelectedCustomer.profile.totalGheeKg} kg
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[9px] text-[#6c6a64] uppercase tracking-wider block font-bold">Outstanding Balance</span>
                    <span className={`font-serif-editorial text-lg font-bold mt-0.5 block ${
                      detailedSelectedCustomer.profile.pendingAmount > 0 ? 'text-[#c64545]' : 'text-[#5db872]'
                    }`}>
                      ₹{detailedSelectedCustomer.profile.pendingAmount}
                    </span>
                  </div>
                </div>

                {/* Instant Mobile Call / Reminder Action Strips */}
                <div className="grid grid-cols-2 gap-2">
                  <a 
                    href={`tel:${detailedSelectedCustomer.profile.phone}`}
                    className="flex items-center justify-center space-x-1 py-2.5 bg-[#efe9de] hover:bg-[#e6dfd8] active:bg-[#e6dfd8] text-[#141413] text-xs font-semibold rounded-md border border-[#e6dfd8]"
                  >
                    <Phone className="w-4 h-4 text-[#cc785c]" />
                    <span>Call Client</span>
                  </a>
                  <button 
                    onClick={() => {
                      setIsReminderCenterOpen(true);
                      setActiveReminderTemplate('gentle');
                      setAiCustomDraftText(''); 
                    }}
                    disabled={detailedSelectedCustomer.profile.pendingAmount === 0}
                    className="flex items-center justify-center space-x-1 py-2.5 bg-[#cc785c] active:bg-[#a9583e] text-white text-xs font-semibold rounded-md disabled:opacity-40"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp Dues</span>
                  </button>
                </div>

                {/* Quick Transaction Action trigger from inside sheet */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-[#6c6a64] uppercase tracking-wider">Fast Log Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setQuickTx(prev => ({ ...prev, customerId: detailedSelectedCustomer.profile.id, type: 'sale' }));
                        setActiveTab('quick-add');
                        setRecordMethod('manual');
                        setSelectedCustomerId(null);
                      }}
                      className="py-2 bg-[#181715] text-[#faf9f5] text-xs font-bold rounded-md"
                    >
                      + Deliver Ghee
                    </button>
                    <button
                      onClick={() => {
                        setQuickTx(prev => ({ 
                          ...prev, 
                          customerId: detailedSelectedCustomer.profile.id, 
                          type: 'payment',
                          amountPaid: detailedSelectedCustomer.profile.pendingAmount
                        }));
                        setActiveTab('quick-add');
                        setRecordMethod('manual');
                        setSelectedCustomerId(null);
                      }}
                      className="py-2 bg-[#5db872] text-white text-xs font-bold rounded-md"
                    >
                      Collect Dues
                    </button>
                  </div>
                </div>

                {/* Historical Statement Timeline */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-bold text-[#6c6a64] uppercase tracking-wider">Statement Log Feed</h4>
                  
                  {detailedSelectedCustomer.logs.length === 0 ? (
                    <p className="text-xs text-[#8e8b82] italic text-center py-4">No previous account balance entries recorded.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                      {detailedSelectedCustomer.logs.map(log => {
                        const isSale = log.type === 'sale';
                        return (
                          <div key={log.id} className="bg-[#efe9de]/55 border border-[#e6dfd8]/60 rounded p-2.5 flex items-center justify-between font-mono-code text-[11px]">
                            <div>
                              <p className="font-semibold text-[#141413]">
                                {isSale ? `Disp. ${log.quantityKg} kg` : 'Collect Payment'}
                              </p>
                              <span className="text-[9px] text-[#8e8b82]">{log.date}</span>
                            </div>
                            <div className="text-right flex items-center space-x-2 font-sans-humanist font-bold">
                              <span className={`font-bold ${isSale ? 'text-[#c64545]' : 'text-[#5db872]'}`}>
                                {isSale ? `₹${log.totalAmount}` : `- ₹${log.amountPaid}`}
                              </span>
                              <button
                                onClick={() => {
                                  setReceiptTxId(log.id);
                                  setSelectedCustomerId(null);
                                }}
                                className="p-1 hover:bg-[#efe9de] text-[#cc785c] rounded"
                                title="Receipt Voucher"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Account Removal Actions */}
                <div className="pt-2 border-t border-[#e6dfd8]/50 flex items-center justify-between font-sans-humanist font-semibold">
                  {deleteConfirmationId === detailedSelectedCustomer.profile.id ? (
                    <div className="w-full flex items-center justify-between bg-[#c64545]/10 p-2.5 rounded border border-[#c64545]/20 animate-in fade-in duration-100">
                      <span className="text-[11px] font-semibold text-[#c64545]">Are you absolutely sure?</span>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => deleteCustomer(detailedSelectedCustomer.profile.id)} 
                          className="px-2.5 py-1 bg-[#c64545] text-white text-[10px] font-bold rounded"
                        >
                          Confirm
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmationId(null)} 
                          className="px-2.5 py-1 bg-[#efe9de] text-[#6c6a64] text-[10px] font-bold rounded border border-[#e6dfd8]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmationId(detailedSelectedCustomer.profile.id)}
                      className="flex items-center space-x-1 text-[11px] text-[#c64545] font-semibold active:opacity-75 py-2 animate-in fade-in"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Customer Portfolio</span>
                    </button>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

        {/* MODAL C: QUICK REGISTER ACCOUNT BOTTOM SHEET */}
        {isAddCustomerOpen && (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#141413]/70 backdrop-blur-xs">
            <div className="w-full max-w-md bg-[#faf9f5] border-t border-[#e6dfd8] rounded-t-xl overflow-hidden shadow-2xl slide-up-drawer max-h-[85vh] flex flex-col">
              
              <div className="w-full flex justify-center py-2.5">
                <div className="w-10 h-1 bg-[#e6dfd8] rounded-full" onClick={() => setIsAddCustomerOpen(false)} />
              </div>

              <div className="px-5 pb-3 border-b border-[#e6dfd8] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-[#cc785c]" />
                  <h3 className="font-serif-editorial text-lg font-bold">Register Client Account</h3>
                </div>
                <button 
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="p-1 bg-[#efe9de] rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form viewport */}
              <form onSubmit={registerNewCustomerForm} className="p-5 overflow-y-auto no-scrollbar space-y-4 flex-grow font-sans-humanist font-semibold text-[#141413]">
                <div>
                  <label className="block text-[10px] font-bold text-[#6c6a64] uppercase tracking-wider mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={newCustomerForm.name}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Ramesh Chandra Iyer"
                    className="w-full px-3 py-2 bg-[#faf9f5] border border-[#e6dfd8] rounded-md text-sm text-[#141413]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6c6a64] uppercase tracking-wider mb-1">Mobile Phone (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    value={newCustomerForm.phone}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="e.g. 9812345678"
                    className="w-full px-3 py-2 bg-[#faf9f5] border border-[#e6dfd8] rounded-md text-sm text-[#141413]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6c6a64] uppercase tracking-wider mb-1">Initial Ghee (kg)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={newCustomerForm.initialKg}
                      onChange={(e) => setNewCustomerForm(prev => ({ ...prev, initialKg: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-[#faf9f5] border border-[#e6dfd8] rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6c6a64] uppercase tracking-wider mb-1">Initial Dues (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={newCustomerForm.initialDue}
                      onChange={(e) => setNewCustomerForm(prev => ({ ...prev, initialDue: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-[#faf9f5] border border-[#e6dfd8] rounded-md text-sm text-[#c64545]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6c6a64] uppercase tracking-wider mb-1">Delivery Instructions / Address</label>
                  <textarea
                    rows="2"
                    placeholder="Address, preferences..."
                    value={newCustomerForm.notes}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#faf9f5] border border-[#e6dfd8] rounded-md text-xs text-[#141413]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#cc785c] text-white text-xs font-bold uppercase tracking-wider rounded-md mt-4"
                >
                  Save Account Portfolio
                </button>
              </form>

            </div>
          </div>
        )}

        {/* MODAL D: REMINDER CENTER WITH AI SMART DRAFT (NO EMOJIS, PRECISE DESIGN TOKENS) */}
        {isReminderCenterOpen && detailedSelectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#141413]/70 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-[#faf9f5] border-t border-[#e6dfd8] rounded-t-xl overflow-hidden shadow-2xl slide-up-drawer max-h-[85vh] flex flex-col">
              
              <div className="w-full flex justify-center py-2.5">
                <div className="w-10 h-1 bg-[#e6dfd8] rounded-full cursor-pointer" onClick={() => setIsReminderCenterOpen(false)} />
              </div>

              <div className="px-5 pb-3 border-b border-[#e6dfd8] flex items-center justify-between font-sans-humanist">
                <div className="flex items-center space-x-2 text-[#cc785c]">
                  <MessageSquare className="w-5 h-5" />
                  <h3 className="font-serif-editorial text-lg font-bold text-[#141413]">Dues Reminder Templates</h3>
                </div>
                <button 
                  onClick={() => setIsReminderCenterOpen(false)}
                  className="p-1 bg-[#efe9de] rounded-full text-[#6c6a64]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto no-scrollbar space-y-4 font-sans-humanist">
                
                {/* Template picker pills (including AI Smart Draft!) */}
                <div className="grid grid-cols-4 gap-1 bg-[#efe9de] p-1 rounded-md text-[10px] font-bold uppercase">
                  {['gentle', 'professional', 'urgent', 'AI Smart'].map(temp => (
                    <button
                      key={temp}
                      type="button"
                      onClick={() => {
                        setActiveReminderTemplate(temp === 'AI Smart' ? 'ai' : temp);
                        if (temp === 'AI Smart' && !aiCustomDraftText) {
                          generateAISmartDraft();
                        }
                      }}
                      className={`py-1.5 rounded transition ${
                        (temp === 'AI Smart' ? activeReminderTemplate === 'ai' : activeReminderTemplate === temp)
                          ? 'bg-[#cc785c] text-white shadow-xs' 
                          : 'text-[#6c6a64]'
                      }`}
                    >
                      {temp === 'AI Smart' ? 'AI Draft' : temp}
                    </button>
                  ))}
                </div>

                {/* Message preview block */}
                <div className="bg-[#efe9de] border border-[#e6dfd8] rounded-lg p-4 space-y-2.5">
                  <span className="text-[9px] text-[#6c6a64] uppercase tracking-wider block font-bold flex items-center space-x-1">
                    {activeReminderTemplate === 'ai' && <Sparkles className="w-3 h-3 text-[#cc785c]" />}
                    <span>{activeReminderTemplate === 'ai' ? 'Gemini Generated Reminder' : 'Message Body'}</span>
                  </span>
                  
                  {activeReminderTemplate === 'ai' ? (
                    isAiGeneratingDraft ? (
                      <div className="flex items-center space-x-2 py-4 text-xs font-semibold text-[#6c6a64]">
                        <Loader2 className="w-4 h-4 text-[#cc785c] animate-spin" />
                        <span>Gemini drafting warm reminder...</span>
                      </div>
                    ) : aiCustomDraftText ? (
                      <p className="text-xs text-[#3d3d3a] font-sans-humanist italic leading-relaxed whitespace-pre-wrap">
                        "{aiCustomDraftText}"
                      </p>
                    ) : (
                      <button 
                        type="button" 
                        onClick={generateAISmartDraft}
                        className="text-xs text-[#cc785c] font-bold py-2 w-full text-center"
                      >
                        Generate AI Draft Now
                      </button>
                    )
                  ) : (
                    <p className="text-xs text-[#3d3d3a] font-sans-humanist italic leading-relaxed">
                      "{reminderMessage}"
                    </p>
                  )}
                </div>

                {/* Action controls */}
                <div className="grid grid-cols-2 gap-2 pt-2 font-sans-humanist">
                  <button
                    type="button"
                    onClick={() => copyTextToClipboard(activeReminderTemplate === 'ai' ? aiCustomDraftText : reminderMessage)}
                    className="py-2.5 bg-[#181715] text-[#faf9f5] hover:bg-[#252320] text-xs font-bold rounded-md flex items-center justify-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Text Only</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const text = activeReminderTemplate === 'ai' ? aiCustomDraftText : reminderMessage;
                      const url = `https://wa.me/91${detailedSelectedCustomer.profile.phone}?text=${encodeURIComponent(text)}`;
                      window.open(url, '_blank');
                      setIsReminderCenterOpen(false);
                      triggerNotification("Redirected to WhatsApp!");
                    }}
                    className="py-2.5 bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-bold rounded-md flex items-center justify-center space-x-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Send on WhatsApp</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* MODAL E: VINTAGE VOUCHER INVOICE RECEIPT */}
        {receiptTxId && selectedReceiptTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#141413]/85 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-[#faf9f5] border border-[#e6dfd8] rounded-lg overflow-hidden shadow-2xl flex flex-col relative animate-in zoom-in-95">
              
              {/* Serrated layout edge */}
              <div className="h-2 w-full bg-[#181715] flex space-x-1 overflow-hidden">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div key={i} className="w-3 h-3 bg-[#faf9f5] rounded-full transform -translate-y-1.5 flex-shrink-0" />
                ))}
              </div>

              {/* Close action */}
              <button 
                onClick={() => setReceiptTxId(null)}
                className="absolute top-4 right-4 p-1.5 bg-[#181715] text-white rounded-full hover:opacity-80 z-20"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Invoice body details */}
              <div className="p-6 vintage-voucher space-y-4 flex-grow text-center text-[#141413]">
                <div className="space-y-1">
                  <h4 className="font-serif-editorial text-2xl font-bold tracking-tight">{businessName}</h4>
                  <p className="text-[9px] font-sans-humanist text-[#6c6a64] uppercase tracking-widest font-bold font-semibold text-[#141413]">Premium Butter Dispatches Statement</p>
                </div>

                <div className="border-t border-b border-dashed border-[#e6dfd8] py-3 text-xs space-y-1 font-sans-humanist font-semibold text-[#141413]">
                  <div className="flex justify-between">
                    <span className="text-[#6c6a64]">VOUCHER NO:</span>
                    <span>{selectedReceiptTx.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6c6a64]">TIMESTAMP:</span>
                    <span>{selectedReceiptTx.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6c6a64]">RECEIVER:</span>
                    <span>{selectedReceiptTx.customerName}</span>
                  </div>
                </div>

                <div className="space-y-2 font-sans-humanist font-semibold text-[#141413]">
                  {selectedReceiptTx.type === 'sale' ? (
                    <>
                      <div className="flex justify-between text-xs font-semibold text-[#6c6a64]">
                        <span>ITEM DESCRIPTION</span>
                        <span>LINE TOTAL</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm border-b border-[#e6dfd8]/40 pb-2">
                        <div className="text-left">
                          <span className="font-bold block text-sm text-[#141413]">Vedic Cow Ghee</span>
                          <span className="text-[10px] text-[#6c6a64]">{selectedReceiptTx.quantityKg} kg @ ₹{selectedReceiptTx.ratePerKg}/kg</span>
                        </div>
                        <span className="font-bold">₹{selectedReceiptTx.totalAmount}</span>
                      </div>

                      <div className="space-y-1.5 text-xs text-right font-semibold">
                        <div className="flex justify-between text-[#6c6a64]">
                          <span>SUBTOTAL:</span>
                          <span className="text-[#141413]">₹{selectedReceiptTx.totalAmount}</span>
                        </div>
                        <div className="flex justify-between text-[#5db872] font-semibold">
                          <span>AMOUNT PAID:</span>
                          <span>₹{selectedReceiptTx.amountPaid}</span>
                        </div>
                        <div className="flex justify-between text-[#c64545] font-bold border-t border-dashed border-[#e6dfd8] pt-1.5 text-sm">
                          <span>UNSETTLED BALANCE:</span>
                          <span>₹{selectedReceiptTx.totalAmount - selectedReceiptTx.amountPaid}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-4 space-y-2 text-center text-[#141413]">
                      <span className="text-[10px] text-[#6c6a64] uppercase tracking-wider block font-bold font-semibold">CASH RECEIVED</span>
                      <span className="text-3xl font-serif-editorial font-bold text-[#5db872] block">₹{selectedReceiptTx.amountPaid}</span>
                      <span className="text-xs text-[#6c6a64] block font-semibold">Dues Settled. Gratitude.</span>
                    </div>
                  )}
                </div>

                {selectedReceiptTx.notes && (
                  <p className="text-[10px] text-[#8e8b82] italic text-center font-sans-humanist font-medium bg-[#efe9de]/30 p-2 rounded border border-[#e6dfd8]/40">
                    * "{selectedReceiptTx.notes}"
                  </p>
                )}

                <div className="pt-4 border-t border-dashed border-[#e6dfd8] text-center space-y-1.5 text-[9px] text-[#8e8b82] font-sans-humanist">
                  <div className="bg-[#efe9de] p-2 rounded border border-[#e6dfd8]/50 text-[#141413] flex items-center justify-center space-x-1 font-bold">
                    <QrCode className="w-3.5 h-3.5 text-[#cc785c]" />
                    <span>Pay directly to UPI: <strong className="select-all">{upiId}</strong></span>
                  </div>
                  <p className="font-bold text-[#141413]">{businessName}</p>
                </div>
              </div>

              {/* Action operations and TTS Audio readout shortcut */}
              <div className="bg-[#efe9de] border-t border-[#e6dfd8] p-3 flex gap-2 font-semibold">
                
                <button
                  type="button"
                  disabled={isTtsSpeaking}
                  onClick={speakReceiptVoucher}
                  className="p-2.5 bg-[#cc785c] active:bg-[#a9583e] disabled:opacity-50 text-white rounded-md flex items-center justify-center space-x-1 text-xs font-bold"
                  title="Audio Narrate Receipt"
                >
                  {isTtsSpeaking ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Volume2 className="w-4.5 h-4.5" />}
                  <span className="hidden sm:inline">Hear</span>
                </button>

                <button
                  onClick={() => copyTextToClipboard(`${businessName} Receipt: Received ₹${selectedReceiptTx.amountPaid} from ${selectedReceiptTx.customerName} on ${selectedReceiptTx.date}. Pay outstanding dues directly to UPI: ${upiId}`)}
                  className="flex-grow py-2.5 bg-[#181715] text-[#faf9f5] rounded-md text-xs font-bold flex items-center justify-center space-x-1.5 active:scale-95 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Statement Summary</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-[#faf9f5] border border-[#e6dfd8] text-[#141413] rounded-md text-xs font-bold active:scale-95 transition"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* SYSTEM AUDIT LOGS FULL DECK */}
        {isLogsSheetOpen && (
          <div className="fixed inset-0 z-50 bg-[#181715] text-[#faf9f5] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="bg-[#1f1e1b] px-4 py-3.5 flex items-center justify-between border-b border-[#252320]">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5db872] animate-pulse" />
                <span className="font-mono-code text-[11px] text-[#a09d96]">system-ledger-log.log</span>
              </div>
              <button
                type="button"
                onClick={() => setIsLogsSheetOpen(false)}
                className="p-1.5 bg-[#252320] text-white rounded-full hover:opacity-85"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-[#1f1e1b]/40 border-b border-[#252320] space-y-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-[#a09d96]" />
                </div>
                <input
                  type="text"
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  placeholder="Search logs by client or memo..."
                  className="w-full pl-9 pr-4 py-2 bg-[#181715] border border-[#252320] rounded-md text-xs text-[#faf9f5] placeholder-[#a09d96] focus:outline-none font-sans-humanist"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-1 bg-[#252320] p-1 rounded text-[10px] font-semibold font-mono-code text-[#faf9f5]">
                {['all', 'sale', 'payment'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setLedgerTypeFilter(type)}
                    className={`py-1 rounded capitalize ${ledgerTypeFilter === type ? 'bg-[#181715] text-[#faf9f5]' : 'text-[#a09d96]'}`}
                  >
                    {type === 'all' ? 'All' : type === 'sale' ? 'Dispatches' : 'Payments'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {filteredTransactions.length === 0 ? (
                <p className="text-xs text-[#a09d96] text-center py-10 font-mono-code">No logs recorded matching queries.</p>
              ) : (
                filteredTransactions.map(item => {
                  const isSale = item.type === 'sale';
                  return (
                    <div 
                      key={item.id} 
                      className="bg-[#1f1e1b] border border-[#252320] rounded-lg p-3.5 space-y-2 font-mono-code text-xs animate-in slide-in-from-bottom-2 duration-100"
                    >
                      <div className="flex items-center justify-between border-b border-[#252320] pb-1.5">
                        <span className="text-[#a09d96]">{item.date}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isSale ? 'bg-[#cc785c]/20 text-[#cc785c]' : 'bg-[#5db872]/20 text-[#5db872]'
                        }`}>
                          {isSale ? 'DISPATCH' : 'PAYMENT'}
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-white font-semibold font-sans-humanist text-sm block">{item.customerName}</span>
                          {isSale && (
                            <span className="text-[10px] text-[#a09d96] block mt-0.5 font-medium">
                              {item.quantityKg} kg @ ₹{item.ratePerKg}/kg
                            </span>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <span className={`font-semibold text-sm ${isSale ? 'text-[#faf9f5]' : 'text-[#5db872]'}`}>
                            {isSale ? `₹${item.totalAmount}` : `+ ₹${item.amountPaid}`}
                          </span>
                        </div>
                      </div>

                      {item.notes && (
                        <p className="text-[10px] text-[#a09d96] italic bg-[#181715] p-1.5 rounded border border-[#252320]/50">
                          * {item.notes}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 5. NATIVE APP BOTTOM NAVIGATION BAR (Symmetrical 5-column grid) */}
        <nav className="flex-shrink-0 bg-[#faf9f5] border-t border-[#e6dfd8] py-2 shadow-lg z-30">
          <div className="max-w-md mx-auto grid grid-cols-5 items-center justify-items-center">
            
            {/* Tab 1: Clients */}
            <button 
              onClick={() => setActiveTab('customers')}
              className={`flex flex-col items-center space-y-0.5 py-1.5 transition ${
                activeTab === 'customers' ? 'text-[#cc785c]' : 'text-[#6c6a64]'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Clients</span>
            </button>

            {/* Tab 2: Analytics */}
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`flex flex-col items-center space-y-0.5 py-1.5 transition ${
                activeTab === 'analytics' ? 'text-[#cc785c]' : 'text-[#6c6a64]'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Analytics</span>
            </button>

            {/* Tab 3: Symmetrical tactile coral Record Home Tab Button */}
            <button 
              onClick={() => { setActiveTab('quick-add'); setRecordMethod('manual'); }}
              className="flex flex-col items-center justify-center transform -translate-y-3 relative z-40 transition active:scale-95 duration-100"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md border-4 border-[#faf9f5] ${
                activeTab === 'quick-add' ? 'bg-[#a9583e]' : 'bg-[#cc785c]'
              }`}>
                <Plus className="w-6 h-6 text-white stroke-[3px]" />
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${
                activeTab === 'quick-add' ? 'text-[#cc785c]' : 'text-[#6c6a64]'
              }`}>Record</span>
            </button>

            {/* Tab 4: Receipts */}
            <button 
              onClick={() => setActiveTab('vouchers')}
              className={`flex flex-col items-center space-y-0.5 py-1.5 transition ${
                activeTab === 'vouchers' ? 'text-[#cc785c]' : 'text-[#6c6a64]'
              }`}
            >
              <FileText className="w-5 h-5 stroke-[1.8]" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Receipts</span>
            </button>

            {/* Tab 5: Settings */}
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex flex-col items-center space-y-0.5 py-1.5 transition ${
                activeTab === 'settings' ? 'text-[#cc785c]' : 'text-[#6c6a64]'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Settings</span>
            </button>

          </div>
        </nav>

      </div>
    </div>
  );
}