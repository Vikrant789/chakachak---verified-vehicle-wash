/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, FormEvent } from 'react';
import {
  ShieldCheck,
  Smartphone,
  CheckCircle,
  Clock,
  Sparkles,
  Zap,
  Users,
  ArrowRight,
  Award,
  Building,
  Check,
  Settings,
  ChevronRight,
  Droplets,
  AlertOctagon,
  Camera,
  Share2
} from 'lucide-react';

import { LeadSubmission, SubscriptionPlan } from './types';
import WaterSplashCanvas from './components/WaterSplashCanvas';
import BeforeAfterSlider from './components/BeforeAfterSlider';
import DiagnosticQuiz from './components/DiagnosticQuiz';
import AppMockup from './components/AppMockup';
import LeadDashboard from './components/LeadDashboard';
import ChakaChakLogo from './components/ChakaChakLogo';

// Cloud Firebase and Google Sheets integrations
import { db } from './lib/firebase';
import { collection, doc, setDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { getSheetsConfig, getUniqueSocietiesFromSheets, appendRowToSheets, appendRowViaAppsScript } from './lib/sheets';

// Mock pre-seeded leads to display in administrative dashboard for initial fidelity
const INITIAL_MOCK_LEADS: LeadSubmission[] = [
  {
    id: 'lead_0921a',
    name: 'Anirudh Deshmukh',
    mobile: '9881024354',
    email: 'anirudh.deshmukh@gmail.com',
    city: 'Pune',
    societyName: 'Blue Ridge Town Hinjawadi',
    vehicleType: 'Car',
    interestedPlan: '1099',
    societySize: '100-200',
    discountAmount: 550,
    finalPrice: 549,
    referralCode: 'CHAK-PUNE-8924',
    createdAt: '2026-06-10T11:45:00Z',
    queueNumber: 124,
  },
  {
    id: 'lead_0812b',
    name: 'Megha Nair',
    mobile: '9123048592',
    email: 'megha.nair@yahoo.com',
    city: 'Pune',
    societyName: 'Pristine Privilege Wakad',
    vehicleType: 'Scooter',
    interestedPlan: '799',
    societySize: '200+',
    discountAmount: 400,
    finalPrice: 399,
    referralCode: 'CHAK-PUNE-0715',
    createdAt: '2026-06-10T14:20:00Z',
    queueNumber: 125,
  },
  {
    id: 'lead_0124c',
    name: 'Rajveer Singh',
    mobile: '9920158432',
    email: 'rajveer.singh@outlook.com',
    city: 'Pune',
    societyName: 'Gera Trinity Kharadi',
    vehicleType: 'Car',
    interestedPlan: '1299',
    societySize: '50-100',
    discountAmount: 650,
    finalPrice: 649,
    referralCode: 'CHAK-PUNE-1102',
    createdAt: '2026-06-10T16:10:00Z',
    queueNumber: 126,
  }
];

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: '799',
    name: 'Basic care plan',
    price: 399,
    originalPrice: 799,
    intendedFor: 'Applied 50% discount',
    features: [
      '6 car clean every week',
      'Missed car wash tracking and refund.',
      'Daily service status on app',
      '24/7 support.'
    ],
    frequency: '6 cleans/week'
  },
  {
    id: '1099',
    name: 'Smart care plan',
    price: 549,
    originalPrice: 1099,
    intendedFor: 'Applied 50% discount',
    features: [
      '6 car clean every week',
      'One foam wash every week',
      'Daily photo and timestamp on app',
      'Daily service status on app',
      'Missed car wash tracking and refund.',
      'Daily service status on app',
      '24/7 support.'
    ],
    isPopular: true,
    frequency: '6 cleans/week + Foam'
  },
  {
    id: '1299',
    name: 'Premium car care plan',
    price: 649,
    originalPrice: 1299,
    intendedFor: 'Advanced detailing standard',
    features: [
      'Smart car care plan + 1 car polish every month',
      'One vacuum cleaning every week',
      'Micro scratch prevention guarantee'
    ],
    frequency: 'Smart + Vacuum + Polish'
  },
  {
    id: 'exclusive',
    name: 'Exclusive car care plan',
    price: 0,
    originalPrice: 0,
    intendedFor: 'For luxury vehicles',
    features: [
      'Customise your car care plan'
    ],
    frequency: 'Tailored'
  }
];

export default function App() {
  // Leads Database state
  const [leads, setLeads] = useState<LeadSubmission[]>([]);

  // Lead capture form state
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    city: 'Pune' as 'Pune',
    societyName: '',
    vehicleType: 'Car' as 'Car' | 'Bike' | 'Scooter',
    interestedPlan: '1099' as string,
    societySize: '50-100' as '10-50' | '50-100' | '100-200' | '200+',
  });

  // Society dropdown selection state
  const [selectedSocietyOption, setSelectedSocietyOption] = useState('Shub Nirwana - Viman Nagar');
  const [customSocietyName, setCustomSocietyName] = useState('');
  const [dynamicSocieties, setDynamicSocieties] = useState<string[]>([]);

  // UI state
  const [formSuccessPass, setFormSuccessPass] = useState<LeadSubmission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Countdown State for Launch: 1 August 2026
  const [countdown, setCountdown] = useState({ days: 51, hours: 6, minutes: 25, seconds: 12 });

  // Live Firestore Synchronization
  const refreshLeadsFromDb = async () => {
    try {
      const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const loaded: LeadSubmission[] = [];
      snap.forEach((docSnap) => {
        loaded.push(docSnap.data() as LeadSubmission);
      });
      setLeads(loaded);
      localStorage.setItem('chakachak_leads', JSON.stringify(loaded));
    } catch (e) {
      console.warn("Failed to load leads from Firestore, fallback to local cache:", e);
      const saved = localStorage.getItem('chakachak_leads');
      if (saved) {
        try {
          setLeads(JSON.parse(saved));
        } catch (_) {}
      }
    }
  };

  useEffect(() => {
    refreshLeadsFromDb();
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setShowAdmin(true);
    }
  }, []);

  // Fetch unique societies from Google Sheets or Firestore leads on page load
  useEffect(() => {
    const loadDynamicSocieties = async () => {
      try {
        const config = await getSheetsConfig();
        if (config && config.spreadsheetId) {
          const societies = await getUniqueSocietiesFromSheets(config.spreadsheetId, config.accessToken);
          if (societies && societies.length > 0) {
            setDynamicSocieties(societies);
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to load dynamic societies from sheets, using DB fallback:", err);
      }

      // If sheets fallback failed or not connected, parse from Firestore leads database
      try {
        const q = query(collection(db, 'leads'));
        const snap = await getDocs(q);
        const societiesFromDb = new Set<string>();
        snap.forEach(docSnap => {
          const data = docSnap.data();
          if (data.societyName) {
            societiesFromDb.add(String(data.societyName).trim());
          }
        });
        const initialList = ["Shub Nirwana - Viman Nagar", "VTP - Manjari Khurd", "Zen Elite - Kharadi"];
        const uniqueList = Array.from(societiesFromDb).filter(name => !initialList.includes(name));
        if (uniqueList.length > 0) {
          setDynamicSocieties(uniqueList);
        }
      } catch (err) {
        console.error("Firestore unique societies dropdown load issue:", err);
      }
    };
    loadDynamicSocieties();
  }, []);

  // Live Countdown Ticker logic
  useEffect(() => {
    const targetDate = new Date('2026-08-01T00:00:00Z').getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Form submit validation & handler
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Please enter your name';
    if (!/^\d{10}$/.test(formData.mobile)) errors.mobile = 'Please enter a valid 10-digit mobile number';
    if (!formData.email.trim()) {
      errors.email = 'Please enter your email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    
    const targetSociety = selectedSocietyOption === 'Other' ? customSocietyName.trim() : selectedSocietyOption;
    if (!targetSociety) errors.societyName = 'Please enter your society name';
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === formData.interestedPlan);
    const originalPrice = selectedPlan ? selectedPlan.originalPrice : 0;
    const finalVal = selectedPlan ? selectedPlan.price : 0;
    const discount = originalPrice - finalVal;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `CHAK-PUNE-${randomSuffix}`;
    const queueNum = leads.length + 127;

    const targetSociety = selectedSocietyOption === 'Other' ? customSocietyName.trim() : selectedSocietyOption;

    const newLead: LeadSubmission = {
      id: `lead_${Date.now()}`,
      name: formData.name,
      mobile: formData.mobile,
      email: formData.email,
      city: formData.city,
      societyName: targetSociety,
      vehicleType: formData.vehicleType,
      interestedPlan: formData.interestedPlan,
      societySize: formData.societySize,
      discountAmount: discount,
      finalPrice: finalVal,
      referralCode: code,
      createdAt: new Date().toISOString(),
      queueNumber: queueNum
    };

    // Update UI state instantaneously to provide a premium, smooth pre-launch reservation flow
    setLeads((prev) => [newLead, ...prev]);
    localStorage.setItem('chakachak_leads', JSON.stringify([newLead, ...leads]));
    setFormSuccessPass(newLead);
    setIsSubmitting(false);

    // Asynchronously synchronize lead information in the background so slow Firestore connection/rules don't block the customer
    Promise.resolve().then(async () => {
      try {
        // 1. Write registration into Firestore leads database
        try {
          await setDoc(doc(db, 'leads', newLead.id), newLead);
        } catch (dbErr) {
          console.warn("Firestore registration save skipped / failed (safe):", dbErr);
        }

        // 2. Synchronize to connected Google Sheets immediately if sheets config is active
        const config = await getSheetsConfig();
        if (config) {
          const rowValues = [
            newLead.id,
            newLead.name,
            newLead.mobile,
            newLead.email,
            newLead.city,
            newLead.societyName,
            newLead.societySize,
            newLead.vehicleType,
            newLead.interestedPlan === 'exclusive' ? 'Custom Quote' : `₹${newLead.finalPrice}`,
            newLead.discountAmount,
            newLead.finalPrice,
            newLead.referralCode,
            newLead.createdAt,
            newLead.queueNumber
          ];

          if (config.webAppUrl) {
            // Prefer custom Google Apps Script Web App (Robust, direct, no OAuth token expiration)
            await appendRowViaAppsScript(config.webAppUrl, rowValues);
          } else if (config.spreadsheetId && config.accessToken) {
            // Fallback to traditional OAuth append
            await appendRowToSheets(config.spreadsheetId, config.accessToken, rowValues);
          }

          // Add to local dynamically supported dropdown if it's external in real-time
          const defaultSocietiesSet = new Set(["Shub Nirwana - Viman Nagar", "VTP - Manjari Khurd", "Zen Elite - Kharadi"]);
          if (!defaultSocietiesSet.has(newLead.societyName)) {
            setDynamicSocieties(prev => Array.from(new Set([...prev, newLead.societyName])));
          }
        }
      } catch (saveError) {
        console.error("Failed to sync pre-registration lead submission in background:", saveError);
      }
    });
  };

  const handleSelectPlan = (planId: string) => {
    setFormData((prev) => {
      const isCarOnlyPlan = planId !== '799';
      const newVehicleType = isCarOnlyPlan ? 'Car' : prev.vehicleType;
      return {
        ...prev,
        interestedPlan: planId,
        vehicleType: newVehicleType
      };
    });
    // scroll smooth to selection form
    const elem = document.getElementById('reserve-discount-form');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleClearAllLeads = () => {
    setLeads([]);
    localStorage.removeItem('chakachak_leads');
    setShowAdmin(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      
      {/* HEADER NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 py-2.5 md:py-3.5 px-3 md:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-row justify-between items-center w-full gap-2">
          
          {/* Logo on Left */}
          <div className="flex items-center shrink-0">
            <ChakaChakLogo size="sm" showTagline={false} />
          </div>

          {/* "1st in India" in Center */}
          <div className="flex justify-center items-center flex-1 text-center py-1">
            <div className="relative inline-flex items-center justify-center select-none">
              {/* Left Tail Background */}
              <div 
                className="absolute right-[98%] top-[4px] h-4 w-4 md:w-6 bg-orange-600 shadow-xs"
                style={{ clipPath: 'polygon(100% 0, 25% 0, 0 50%, 25% 100%, 100% 100%)' }}
              />
              {/* Left Fold Shading Triangle */}
              <div 
                className="absolute right-[98%] top-[20px] border-t-[4px] border-t-orange-850 border-l-[4px] border-l-transparent z-0"
              />

              {/* Main Ribbon Center */}
              <div className="relative z-10 h-6 px-3 md:px-4 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 text-white font-black text-[8px] md:text-[10px] uppercase tracking-wider md:tracking-widest shadow-md flex items-center justify-center rounded-xs border-b border-orange-600 whitespace-nowrap">
                1st in India
              </div>

              {/* Right Fold Shading Triangle */}
              <div 
                className="absolute left-[98%] top-[20px] border-t-[4px] border-t-orange-850 border-r-[4px] border-r-transparent z-0"
              />
              {/* Right Tail Background */}
              <div 
                className="absolute left-[98%] top-[4px] h-4 w-4 md:w-6 bg-orange-600 shadow-xs"
                style={{ clipPath: 'polygon(0 0, 75% 0, 100% 50%, 75% 100%, 0 100%)' }}
              />
            </div>
          </div>

          {/* "Reserve My Discount" on Right */}
          <div className="flex items-center shrink-0">
            <a
              href="#reserve-discount-form"
              className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs md:text-sm px-4 py-2.5 md:px-6 md:py-3 rounded-lg md:rounded-xl shadow-md hover:shadow-lg hover:scale-102 transition-all active:scale-95 text-center leading-none whitespace-nowrap"
            >
              Reserve My Discount
            </a>
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1">

        {/* HERO BANNER SECTION */}
        <section className="relative bg-gradient-to-b from-blue-50/50 via-white to-slate-50 border-b border-slate-100 py-12 md:py-20 lg:py-24 px-4 md:px-8 overflow-hidden">
          <WaterSplashCanvas />
          
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 md:space-y-8">
              
              {/* Ticking Time Countdown Banner (Mobile & Tablet) */}
              <div className="block lg:hidden bg-white border border-slate-200/80 rounded-2xl p-4 md:p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3 mb-3 text-xs">
                  <div>
                    <span className="text-orange-600 font-extrabold tracking-wide uppercase flex items-center gap-1 font-sans">
                      <Award className="w-4 h-4 text-orange-500" /> Launching 1 August 2026
                    </span>
                    <span className="text-slate-400 mt-0.5 block text-xs">Pune rollout pre-registration live</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-2xl md:text-3xl font-black text-slate-900 font-display tracking-tight block">{countdown.days}</span>
                    <span className="text-3xs uppercase font-semibold text-slate-400 tracking-wider">Days</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-2xl md:text-3xl font-black text-slate-900 font-display tracking-tight block">{countdown.hours}</span>
                    <span className="text-3xs uppercase font-semibold text-slate-400 tracking-wider">Hours</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-2xl md:text-3xl font-black text-slate-900 font-display tracking-tight block">{countdown.minutes}</span>
                    <span className="text-3xs uppercase font-semibold text-slate-400 tracking-wider">Mins</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-2xl md:text-3xl font-black text-orange-600 font-display tracking-tight block">{countdown.seconds}</span>
                    <span className="text-3xs uppercase font-semibold text-orange-400 tracking-wider">Secs</span>
                  </div>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>India's First Verified Doorstep Vehicle Wash</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-950 font-display tracking-tight leading-tighter">
                Your Vehicle Deserves More Than a <span className="text-blue-600 font-extrabold">Dirty Wet Cloth</span>
              </h1>

              <div className="space-y-4">
                <p className="text-slate-700 text-sm md:text-base leading-relaxed font-sans font-medium">
                  At ChakaChak we are responsible for the quality of car wash done at your parking area just like its done today. This is same way as do today but with new people with new process and advanced method.
                </p>

                {/* THE 6 CORE LAUNCH STANDARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  <div className="bg-white/80 p-3 rounded-xl border border-slate-200/50 flex gap-2.5 items-start">
                    <span className="text-lg bg-orange-50 p-1.5 rounded-lg">✨</span>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">400-500 GSM Microfiber</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">High standard 80/20 polyester-polyamide blend for extreme scratch avoidance.</p>
                    </div>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-slate-200/50 flex gap-2.5 items-start">
                    <span className="text-lg bg-blue-50 p-1.5 rounded-lg">💧</span>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">Spot-Free Hard Water Solution</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Advanced water solution that leaves absolutely zero hard water scale post-wash.</p>
                    </div>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-slate-200/50 flex gap-2.5 items-start">
                    <span className="text-lg bg-orange-50 p-1.5 rounded-lg">🧼</span>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">Weekly Foam Wash & Polish</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Regular foaming washes and paint gloss polish keep cars looking showroom-new.</p>
                    </div>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-slate-200/50 flex gap-2.5 items-start">
                    <span className="text-lg bg-blue-50 p-1.5 rounded-lg">🛡️</span>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">Anti-Swirl Trained Washers</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Professionally trained cleaners who wash in patterns designed to block swirl-marks.</p>
                    </div>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-slate-200/50 flex gap-2.5 items-start">
                    <span className="text-lg bg-orange-50 p-1.5 rounded-lg">🌀</span>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">Internal Plan Vacuuming</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Automated vacuum schedules keep your cabin perfectly dust-free & family-fresh.</p>
                    </div>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-slate-200/50 flex gap-2.5 items-start">
                    <span className="text-lg bg-blue-50 p-1.5 rounded-lg">💎</span>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">PPF & Ceramic Safe Coating Care</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Specially certified protocols to protect expensive wraps & coating gloss.</p>
                    </div>
                  </div>
                </div>
              </div>



            </div>

            {/* Right Launch Card Column */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Ticking Time Countdown Banner (Desktop Only) */}
              <div className="hidden lg:block bg-white border border-slate-200/80 rounded-2xl p-4 md:p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3 mb-3 text-xs">
                  <div>
                    <span className="text-orange-600 font-extrabold tracking-wide uppercase flex items-center gap-1 font-sans">
                      <Award className="w-4 h-4 text-orange-500" /> Launching 1 August 2026
                    </span>
                    <span className="text-slate-400 mt-0.5 block text-xs">Pune rollout pre-registration live</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-2xl md:text-3xl font-black text-slate-900 font-display tracking-tight block">{countdown.days}</span>
                    <span className="text-3xs uppercase font-semibold text-slate-400 tracking-wider">Days</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-2xl md:text-3xl font-black text-slate-900 font-display tracking-tight block">{countdown.hours}</span>
                    <span className="text-3xs uppercase font-semibold text-slate-400 tracking-wider">Hours</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-2xl md:text-3xl font-black text-slate-900 font-display tracking-tight block">{countdown.minutes}</span>
                    <span className="text-3xs uppercase font-semibold text-slate-400 tracking-wider">Mins</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-2xl md:text-3xl font-black text-orange-600 font-display tracking-tight block">{countdown.seconds}</span>
                    <span className="text-3xs uppercase font-semibold text-orange-400 tracking-wider">Secs</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>


        {/* SECTION: INTRODUCING CHAKACHAK */}
        <section id="features-section" className="py-16 md:py-24 bg-slate-50 px-4 md:px-8 border-b border-slate-100">
          <div className="max-w-7xl mx-auto space-y-12 md:space-y-16">
            
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-2xs font-bold text-orange-600 tracking-wider uppercase font-mono bg-orange-50 px-2.5 py-1 rounded-full">
                Introducing ChakaChak
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-display">
                Doorstep verified vehicle wash
              </h2>
              <p className="text-slate-500 text-sm">
                Bringing the absolute strictness of digital technology, photos, and professional training directly to your parking.
              </p>
            </div>

            {/* Core Value points Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/60 shadow-xs space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Photo Proof After Cleaning</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Every completed daily session includes multi-angle car photos.
                </p>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/60 shadow-xs space-y-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Timestamp Verification</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Real-time automated logging. You know exactly what minute our trained staff finished cleaning your vehicle.
                </p>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/60 shadow-xs space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Trained Washing Professionals</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  No random daily labourer, Our trained professionals ensure a scratch-free, spotless wash experience without you leaving your home and complete peace of mind.
                </p>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/60 shadow-xs space-y-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Droplets className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Vehicle-Specific Cleaning</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Whether solid paint, ceramic coatings, or premium PPF shields, we utilize specialized neutral cleaners and premium micro-fibers.
                </p>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/60 shadow-xs space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">App-Based Service Tracking</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Submit temporary holds when traveling, track skip-day refunds automatically, and rate your care professional daily.
                </p>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/60 shadow-xs space-y-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Continuous Quality Monitoring</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Mobile society audits conducted weekly by regional area supervisor to guarantee quality delivered.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* SECTION: PRE-LAUNCH SPECIAL OFFER */}
        <section className="bg-gradient-to-r from-blue-700 to-blue-950 py-16 px-4 md:px-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.15),transparent_60%)] pointer-events-none" />
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="bg-white rounded-3xl border border-slate-100 p-8 md:p-10 shadow-2xl text-slate-800 space-y-6 md:space-y-8">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="bg-orange-50 border border-orange-100 p-3 rounded-2xl flex items-center gap-3 self-start">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xs font-bold text-orange-600 uppercase tracking-wider block">Pre-launch Special Offer</span>
                    <strong className="text-sm text-slate-800">50% OFF your entire first month</strong>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight font-display">
                    Exclusive Reserve Slots Benefit
                  </h3>
                  <p className="text-slate-500 text-xs mt-1">Pre-register today to secure early access benefits</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex gap-3 items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">50% FLAT off</h4>
                    <p className="text-xs text-slate-500 mt-1">Applicable to your entire first month subscription</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex gap-3 items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Priority onboarding</h4>
                    <p className="text-xs text-slate-500 mt-1">For your housing society block</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex gap-3 items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Early access</h4>
                    <p className="text-xs text-slate-500 mt-1">To Android / iOS status tracker app</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION: BEFORE/AFTER SLIDER */}
        <section id="difference-section" className="py-16 md:py-24 bg-white px-4 md:px-8 border-b border-slate-100">
          <div className="max-w-7xl mx-auto">
            <BeforeAfterSlider />
          </div>
        </section>


        {/* SECTION: SUBSCRIPTION PLANS */}
        <section id="pricing-section" className="py-16 md:py-24 bg-slate-50 px-4 md:px-8 border-b border-slate-100">
          <div className="max-w-7xl mx-auto space-y-12">
            
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-2xs font-bold text-orange-600 tracking-wider uppercase font-mono bg-orange-50 px-2.5 py-1 rounded-full">
                Subscription Pricing Plans
              </span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">
                Premium Doorstep Washing Made Affordable
              </h2>
              <p className="text-slate-500 text-sm">
                Reserve your launch slot today to lock down these prices and secure an instant 50% discount on your first month billing cycle!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch max-w-7xl mx-auto">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const isSelected = formData.interestedPlan === plan.id;
                return (
                  <div
                    key={plan.id}
                    className={`bg-white rounded-3xl border p-6 md:p-8 flex flex-col justify-between transition-all duration-300 relative ${
                      plan.isPopular
                        ? 'border-blue-500 shadow-xl lg:scale-103 z-10'
                        : 'border-slate-200 hover:border-slate-300 shadow-md'
                    }`}
                  >
                    {/* Popular banner ribbon */}
                    {plan.isPopular && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-extrabold text-[10px] tracking-widest uppercase px-3 py-1 rounded-full shadow-md">
                        ★ MOST POPULAR ★
                      </span>
                    )}

                    <div className="space-y-6">
                      
                      {/* Name and targeting */}
                      <div>
                        <span className="text-xs uppercase font-extrabold text-blue-600 tracking-widest font-mono block">{plan.name}</span>
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {plan.id === '799' ? (
                            <>
                              <span className="text-[9px] font-bold bg-slate-150 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md">🚗 Car</span>
                              <span className="text-[9px] font-bold bg-slate-150 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md">🏍 Bike</span>
                              <span className="text-[9px] font-bold bg-slate-150 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md">🛵 Scooter</span>
                            </>
                          ) : (
                            <span className="text-[9px] font-black bg-blue-50 border border-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md">🚗 Cars Only</span>
                          )}
                        </div>
                        <h4 className="text-slate-900 font-bold text-xs mt-2">{plan.intendedFor}</h4>
                      </div>

                      {/* Pricing Tag */}
                      {plan.id === 'exclusive' ? (
                        <div className="flex items-baseline gap-1.5 border-t border-b border-slate-100 py-4">
                          <span className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Custom Plan</span>
                          <span className="text-slate-500 text-[10px] ml-1.5">(Luxury Veh.)</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1.5 border-t border-b border-slate-100 py-4">
                          <span className="text-slate-400 text-xs font-semibold line-through">₹{plan.price * 2}</span>
                          <span className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">₹{plan.price}</span>
                          <span className="text-slate-500 text-xs">/ mo</span>
                          <span className="bg-orange-100 text-orange-600 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ml-1 shrink-0">
                            50% Off (Launch)
                          </span>
                        </div>
                      )}

                      {/* Small stats tag */}
                      <div className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg flex items-center justify-between">
                        <span>Wash Frequency:</span>
                        <span className="text-slate-800 font-bold">{plan.frequency}</span>
                      </div>

                      {/* Features Bullet details */}
                      <ul className="space-y-3">
                        {plan.features.map((feature, idx) => (
                           <li key={`plan-${plan.id}-feat-${idx}`} className="flex gap-2 text-xs text-slate-600 leading-normal">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                    </div>

                    <div className="mt-8 pt-4">
                      <button
                        onClick={() => handleSelectPlan(plan.id)}
                        className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all active:scale-98 cursor-pointer ${
                          plan.isPopular
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/10'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        Reserve {plan.name}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* SECTION: PHONE COMPANION SCREEN APPS */}
        <section id="app-section" className="py-16 md:py-24 bg-white px-4 md:px-8 border-b border-slate-100">
          <div className="max-w-7xl mx-auto">
            <AppMockup />
          </div>
        </section>

        {/* SECTION: RESERVATION LEAD CAPTURE FORM */}
        <section id="reserve-discount-form" className="py-16 md:py-24 bg-gradient-to-b from-blue-50/20 via-white to-blue-50/50 px-4 md:px-8 relative overflow-hidden">
          
          {/* Accent dynamic droplets */}
          <div className="absolute top-1/4 -left-12 w-48 h-48 bg-blue-100 rounded-full blur-3xl opacity-30 pointer-events-none" />
          <div className="absolute bottom-1/4 -right-12 w-64 h-64 bg-orange-100 rounded-full blur-3xl opacity-30 pointer-events-none" />

          <div className="max-w-4xl mx-auto relative z-10">
            
            <div className="text-center max-w-xl mx-auto space-y-3 mb-10">
              <span className="text-2xs font-bold text-orange-600 tracking-wider uppercase font-mono bg-orange-50 px-3 py-1 rounded-full inline-block">
                Lock Your Special Price
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-display">
                Reserve Your Launch Offer Now
              </h2>
              <p className="text-slate-500 text-xs md:text-sm">
                Strictly limited slots available for Pune. Early subscribers receive exclusive priority onboarding cards and 50% flat discount vouchers.
              </p>
            </div>

            {formSuccessPass ? (
              
              /* EXQUISITE PRINTABLE GOLD PASS CONFIRMATION WINDOW */
              <div className="bg-white rounded-3xl border-2 border-orange-400 p-6 md:p-8 shadow-2xl space-y-6 md:space-y-8 animate-scaleUp max-w-2xl mx-auto">
                
                {/* Successful Alert status line */}
                <div className="text-center space-y-1 bg-emerald-50 border border-emerald-100 py-3.5 px-4 rounded-2xl">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h3 className="text-lg font-extrabold text-slate-900 mt-1">Pre-Registration Confirmed!</h3>
                  <p className="text-slate-600 text-2xs md:text-xs">
                    Your 50% discount passes have been successfully generated and queued inside our launch book.
                  </p>
                </div>

                {/* The Ticket Pass */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-md">
                  
                  {/* Top Ticket Header */}
                  <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white p-4 flex justify-between items-center select-none font-mono text-2xs uppercase tracking-wider">
                    <span>CHAKACHAK VIP GOLD PASS</span>
                    <span className="font-black text-orange-400">Queue #{formSuccessPass.queueNumber}</span>
                  </div>

                  {/* Core Pass body details */}
                  <div className="p-5 md:p-6 space-y-6 bg-slate-50 relative">
                    
                    {/* Decorative side ticket notches */}
                    <div className="absolute top-1/2 -left-3.5 -translate-y-1/2 w-7 h-7 rounded-full bg-white border-r border-slate-200" />
                    <div className="absolute top-1/2 -right-3.5 -translate-y-1/2 w-7 h-7 rounded-full bg-white border-l border-slate-200" />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-3xs uppercase font-bold text-slate-400 block tracking-widest font-mono">Subscriber Name</span>
                        <span className="text-sm md:text-base font-extrabold text-slate-800 block mt-0.5">{formSuccessPass.name}</span>
                      </div>
                      <div>
                        <span className="text-3xs uppercase font-bold text-slate-400 block tracking-widest font-mono">Location & Society</span>
                        <span className="text-xs font-bold text-slate-700 block mt-0.5 truncate">{formSuccessPass.city} - {formSuccessPass.societyName}</span>
                      </div>
                      <div>
                        <span className="text-3xs uppercase font-bold text-slate-400 block tracking-widest font-mono">Vehicle Shielded</span>
                        <span className="text-xs font-bold text-slate-700 block mt-0.5 uppercase">{formSuccessPass.vehicleType}</span>
                      </div>
                      <div>
                        <span className="text-3xs uppercase font-bold text-slate-400 block tracking-widest font-mono">Allocated Code</span>
                        <span className="text-xs font-extrabold text-orange-600 block mt-0.5 font-mono">{formSuccessPass.referralCode}</span>
                      </div>
                    </div>

                    {/* Pricing computations details */}
                    <div className="bg-white border border-slate-200/60 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-3xs font-bold text-slate-400 uppercase tracking-widest block font-mono">Reserved Subscription Plan</span>
                        <strong className="text-xs md:text-sm text-slate-800">
                          {SUBSCRIPTION_PLANS.find(p => p.id === formSuccessPass.interestedPlan)?.name || 'Custom Plan'}
                        </strong>
                      </div>
                      <div className="text-right">
                        <span className="text-3xs font-bold text-emerald-500 uppercase tracking-widest block font-mono">Locked 50% Bill</span>
                        <strong className="text-sm md:text-base font-black text-emerald-600">₹{formSuccessPass.finalPrice}/Month</strong>
                      </div>
                    </div>

                    {/* Barcode Simulator visual asset */}
                    <div className="pt-2 flex flex-col items-center">
                      <div className="w-full h-8 bg-[repeating-linear-gradient(90deg,#1e293b,#1e293b_2px,transparent_2px,#transparent_6px,#1e293b_6px,#1e293b_9px)] opacity-85" />
                      <span className="text-4xs font-mono text-slate-400 mt-1 uppercase tracking-widest">Apt Clearance Priority Onboarding</span>
                    </div>

                  </div>
                </div>

                {/* Share action triggers */}
                <div className="space-y-3 pt-2">
                  <a
                    href={`https://api.whatsapp.com/send?text=I just secured India's First Doorstep Verified Vehicle Washing Service discount pass with ChakaChak! Join Pune pre-launch to get 50% off flat: https://chakachak.net/ referral: ${formSuccessPass.referralCode}`}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Share2 className="w-4 h-4 text-white" /> Share Booking Vias WhatsApp
                  </a>

                  <button
                    onClick={() => {
                      setFormSuccessPass(null);
                      setFormData({
                        name: '',
                        mobile: '',
                        email: '',
                        city: 'Pune',
                        societyName: '',
                        vehicleType: 'Car',
                        interestedPlan: '1099',
                        societySize: '50-100',
                      });
                    }}
                    className="w-full py-3 text-slate-500 hover:text-slate-900 font-bold text-xs bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Book for Another Vehicle in Family
                  </button>
                </div>

              </div>
            ) : (
              
              /* STANDARD GLASSMORPHISM FORM */
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-2xl space-y-6 max-w-2xl mx-auto"
              >
                
                {/* Form upper rows - Name & Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block uppercase tracking-wide">Name</label>
                    <input
                      type="text"
                      className={`w-full p-3 rounded-xl border bg-slate-50 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all ${
                        formErrors.name ? 'border-red-400 ring-2 ring-red-400/10' : 'border-slate-200'
                      }`}
                      placeholder="e.g. Swaminathan Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    />
                    {formErrors.name && (
                      <span className="text-3xs font-semibold text-red-500 block">{formErrors.name}</span>
                    )}
                  </div>

                  {/* Target City Indicator */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block uppercase tracking-wide">Target City</label>
                    <div className="flex bg-slate-50 p-3.5 rounded-xl border border-slate-200 justify-between items-center">
                      <span className="text-sm font-extrabold text-slate-800 flex items-center gap-1">📍 Pune</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Active Launch
                      </span>
                    </div>
                  </div>

                  {/* Mobile field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block uppercase tracking-wide">Mobile Number</label>
                    <input
                      type="tel"
                      maxLength={10}
                      className={`w-full p-3 rounded-xl border bg-slate-50 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-mono ${
                        formErrors.mobile ? 'border-red-400 ring-2 ring-red-400/10' : 'border-slate-200'
                      }`}
                      placeholder="10-digit number"
                      value={formData.mobile}
                      onChange={(e) => setFormData((prev) => ({ ...prev, mobile: e.target.value.replace(/\D/g, '') }))}
                    />
                    {formErrors.mobile && (
                      <span className="text-3xs font-semibold text-red-500 block">{formErrors.mobile}</span>
                    )}
                  </div>

                  {/* Email field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block uppercase tracking-wide">Email Address</label>
                    <input
                      type="email"
                      className={`w-full p-3 rounded-xl border bg-slate-50 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all ${
                        formErrors.email ? 'border-red-400 ring-2 ring-red-400/10' : 'border-slate-200'
                      }`}
                      placeholder="e.g. josh@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    />
                    {formErrors.email && (
                      <span className="text-3xs font-semibold text-red-500 block">{formErrors.email}</span>
                    )}
                  </div>

                </div>

                {/* Society and size */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  
                  {/* Society name dropdown and field */}
                  <div className="md:col-span-8 space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block uppercase tracking-wide">Society Name</label>
                      <select
                        className={`w-full p-3 rounded-xl border bg-slate-50 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all cursor-pointer font-semibold ${
                          formErrors.societyName ? 'border-red-400 ring-2 ring-red-400/10' : 'border-slate-200'
                        }`}
                        value={selectedSocietyOption}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedSocietyOption(val);
                          if (val !== 'Other') {
                            setCustomSocietyName('');
                          }
                        }}
                      >
                        {Array.from(new Set([
                          'Shub Nirwana - Viman Nagar',
                          'VTP - Manjari Khurd',
                          'Zen Elite - Kharadi',
                          ...dynamicSocieties
                        ])).map((soc) => (
                          <option key={soc} value={soc}>
                            {soc}
                          </option>
                        ))}
                        <option value="Other">Other (Add Custom Society)</option>
                      </select>
                    </div>

                    {selectedSocietyOption === 'Other' && (
                      <div className="space-y-1.5 animate-slideDown">
                        <label className="text-[10px] font-bold text-orange-600 block uppercase tracking-wide">
                          Enter Custom Society Name
                        </label>
                        <input
                          type="text"
                          className={`w-full p-3 rounded-xl border bg-slate-50 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all ${
                            formErrors.societyName ? 'border-red-400 ring-2 ring-red-400/10' : 'border-slate-200'
                          }`}
                          placeholder="Please enter your society name..."
                          value={customSocietyName}
                          onChange={(e) => setCustomSocietyName(e.target.value)}
                        />
                      </div>
                    )}

                    {formErrors.societyName && (
                      <span className="text-3xs font-semibold text-red-500 block">{formErrors.societyName}</span>
                    )}
                  </div>

                  {/* Estimated Vehicles dropdown */}
                  <div className="md:col-span-4 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block uppercase tracking-wide">Apt Units Size</label>
                    <select
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                      value={formData.societySize}
                      onChange={(e) => setFormData((prev) => ({ ...prev, societySize: e.target.value as '10-50' | '50-100' | '100-200' | '200+' }))}
                    >
                      <option value="10-50">10-50 Vehicles</option>
                      <option value="50-100">50-100 Vehicles</option>
                      <option value="100-200">100-200 Vehicles</option>
                      <option value="200+">200+ Vehicles</option>
                    </select>
                  </div>

                </div>

                {/* Selectors: Vehicle Type, Interested Plan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  
                  {/* Vehicle Type radio list */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block uppercase tracking-wide">Vehicle Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Car', 'Bike', 'Scooter'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData((prev) => {
                            const isTwoWheeler = type === 'Bike' || type === 'Scooter';
                            const newPlan = isTwoWheeler ? '799' : prev.interestedPlan;
                            return { ...prev, vehicleType: type, interestedPlan: newPlan };
                          })}
                          className={`py-3.5 px-3 rounded-xl text-center border font-bold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                            formData.vehicleType === type
                              ? 'bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-300'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-xl">
                            {type === 'Car' ? '🚗' : type === 'Bike' ? '🏍' : '🛵'}
                          </span>
                          <span>{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interested Plan radio list */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block uppercase tracking-wide">
                      {formData.vehicleType === 'Car' ? 'Interested Plan Option' : 'Interested Plan Option (Bike/Scooter Exclusive)'}
                    </label>
                    <div className={`grid gap-2 ${
                      formData.vehicleType === 'Car' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1'
                    }`}>
                      {SUBSCRIPTION_PLANS.filter((plan) => {
                        const isTwoWheeler = formData.vehicleType === 'Bike' || formData.vehicleType === 'Scooter';
                        if (isTwoWheeler) {
                          // Only allow basic care plan for bike / scooter
                          return plan.id === '799';
                        }
                        return true;
                      }).map((plan) => (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, interestedPlan: plan.id }))}
                          className={`py-3 px-1.5 rounded-xl text-center border font-bold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                            formData.interestedPlan === plan.id
                              ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-300'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-sm font-black">
                            {plan.id === 'exclusive' ? 'Custom' : `₹${plan.price}`}
                          </span>
                          <span className="text-[9px] uppercase text-slate-400 font-mono truncate max-w-full">
                            {plan.name.replace(' plan', '')}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Total computation live preview summary */}
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex items-center justify-between text-xs md:text-sm font-semibold">
                  <div>
                    <span className="text-3xs uppercase text-slate-400 font-bold block mb-0.5 tracking-wider font-mono">Selected Plan Bill</span>
                    <span className="text-slate-800">
                      {formData.interestedPlan === 'exclusive' ? (
                        <span>Exclusive Custom Plan</span>
                      ) : (
                        <span>Regular Price: <span className="line-through text-slate-400">₹{SUBSCRIPTION_PLANS.find(p => p.id === formData.interestedPlan)?.originalPrice}</span> / month</span>
                      )}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-3xs uppercase text-emerald-600 font-bold block mb-0.5 tracking-wider font-mono">
                      {formData.interestedPlan === 'exclusive' ? 'Luxury Wash' : 'Special Pre-Launch Price (50% Off)'}
                    </span>
                    <span className="text-base md:text-lg font-black text-emerald-600">
                      {formData.interestedPlan === 'exclusive' ? (
                        'Custom Quote'
                      ) : (
                        `₹${SUBSCRIPTION_PLANS.find(p => p.id === formData.interestedPlan)?.price} / month`
                      )}
                    </span>
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs md:text-sm py-4 rounded-xl uppercase tracking-wider transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{isSubmitting ? 'SECURED REGISTRATION...' : 'Reserve My 50% Launch Discount'}</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                </div>

              </form>
            )}

          </div>
        </section>

        {/* SECTION: AUDIT PROBLEMS DIAGNOSTIC (OPTIONAL END SECTION) */}
        <section id="audit-section" className="py-16 md:py-24 bg-white px-4 md:px-8 border-t border-b border-slate-100">
          <div className="max-w-7xl mx-auto space-y-12">
            
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-2xs font-extrabold text-blue-600 tracking-wider uppercase font-mono bg-blue-50 px-3 py-1 rounded-full">
                 Optional Diagnostic Assessment
              </span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">
                Do You Have Paint Swirl-marks?
              </h2>
              <p className="text-slate-500 text-xs md:text-sm">
                (Optional for Customers) Calculated diagnostic risk quiz tells you exactly how much clear coat damage and monthly value leak your current wash method creates.
              </p>
            </div>

            <DiagnosticQuiz onSelectFormPlan={() => handleSelectPlan('1200')} />

          </div>
        </section>

        {/* SECTION: BRIEF TRUST REASSURANCE */}
        <section className="py-12 bg-slate-900 text-white/90 px-4 md:px-8 border-t border-slate-800">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="space-y-2">
              <h4 className="text-orange-400 font-bold text-sm uppercase tracking-widest font-mono">Verified Service</h4>
              <p className="text-xs text-slate-400 leading-relaxed">No more guesswork. Every single completed wash session uploads distinct, clean photos and timestamps matching our supervisor standards.</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-orange-400 font-bold text-sm uppercase tracking-widest font-mono">Absolute Accountability</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Skip coordination headaches. All absences are accounted for transparently and adjusted in the upcoming billing month cycles automatically.</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-orange-400 font-bold text-sm uppercase tracking-widest font-mono">Fair Pricing Technology</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Pay strictly for premium performance, microfiber towels, and eco-dry matrices. Build value with ChakaChak, the new age of doorstep vehicle care.</p>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER COYPRIGHT & STATS */}
      <footer className="bg-slate-950 text-slate-500 py-10 px-4 md:px-8 border-t border-slate-900 text-xs text-center">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-left space-y-1">
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                <ChakaChakLogo size="sm" showTagline={false} />
              </div>
              <p className="text-3xs text-slate-500 uppercase tracking-widest font-mono mt-1">Cleanliness. Accountability. Verification. Every single morning.</p>
            </div>
          </div>
          
          <hr className="border-slate-900 my-4" />

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-3xs text-slate-600">
            <p>© 2026 ChakaChak India. All rights reserved. Launching on 1 August 2026 inside Pune townships.</p>
          </div>
        </div>
      </footer>

      {/* LEAD DASHBOARD OVERLAY PANEL MODAL */}
      {showAdmin && (
        <LeadDashboard
          leads={leads}
          onClearLeads={handleClearAllLeads}
          onClose={() => setShowAdmin(false)}
          onRefreshLeads={refreshLeadsFromDb}
        />
      )}

    </div>
  );
}
