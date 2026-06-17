/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LeadSubmission } from '../types';
import {
  Database,
  TrendingUp,
  Sparkles,
  UserCheck,
  Trash2,
  Download,
  RefreshCw,
  X,
  FileSpreadsheet,
  ExternalLink,
  ShieldCheck,
  Check,
  AlertTriangle
} from 'lucide-react';
import { googleSignIn, auth } from '../lib/firebase';
import {
  getSheetsConfig,
  saveSheetsConfig,
  createNewSpreadsheet,
  appendRowToSheets,
  saveFullSheetsConfig,
  appendRowViaAppsScript
} from '../lib/sheets';
import { collection, getDocs, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface LeadDashboardProps {
  leads: LeadSubmission[];
  onClearLeads: () => void;
  onClose: () => void;
  onRefreshLeads: () => void;
}

export default function LeadDashboard({ leads, onClearLeads, onClose, onRefreshLeads }: LeadDashboardProps) {
  const [sheetsConfig, setSheetsConfig] = useState<{ spreadsheetId: string; accessToken: string; updatedAt: string; webAppUrl?: string } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });

  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState('');
  const [webAppUrlInput, setWebAppUrlInput] = useState('');
  const [showScriptHowTo, setShowScriptHowTo] = useState(false);
  const [isSavingCustom, setIsSavingCustom] = useState(false);

  // Load sheets configuration from Firestore on mount
  useEffect(() => {
    const loadConfig = async () => {
      const config = await getSheetsConfig();
      if (config) {
        setSheetsConfig(config);
        setSpreadsheetIdInput(config.spreadsheetId || '1-QfPQtzN-y-aHy6TwfGAfTR4HxHOXy_gF6Bn934B3ko');
        setWebAppUrlInput(config.webAppUrl || '');
      }
    };
    loadConfig();
  }, []);

  // Aggregate stats
  const totalLeads = leads.length;
  const puneLeads = leads.filter((l) => l.city === 'Pune').length;

  const totalDiscountReserved = leads.reduce((acc, current) => acc + current.discountAmount, 0);
  const avgPlanPrice = totalLeads
    ? Math.round(leads.reduce((acc, current) => acc + parseInt(current.interestedPlan), 0) / totalLeads)
    : 0;

  const handleSaveCustomConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCustom(true);
    setSyncStatus({ type: '', message: '' });
    try {
      await saveFullSheetsConfig({
        spreadsheetId: spreadsheetIdInput.trim() || '1-QfPQtzN-y-aHy6TwfGAfTR4HxHOXy_gF6Bn934B3ko',
        webAppUrl: webAppUrlInput.trim() || ''
      });
      const updated = await getSheetsConfig();
      if (updated) {
        setSheetsConfig(updated);
      }
      setSyncStatus({
        type: 'success',
        message: 'Saved configuration successfully!'
      });
    } catch (saveError: any) {
      console.error(saveError);
      setSyncStatus({
        type: 'error',
        message: saveError?.message || 'Failed to save custom configuration.'
      });
    } finally {
      setIsSavingCustom(false);
    }
  };

  // Handle Google OAuth and Sheets connection setup
  const handleConnectSheets = async () => {
    setIsConnecting(true);
    setSyncStatus({ type: '', message: '' });
    try {
      // 1. Sign in with Google (this requests sheets scope)
      const loginResult = await googleSignIn();
      if (!loginResult) {
        throw new Error('Authorized authentication profile failed.');
      }

      const { accessToken } = loginResult;
      
      // 2. Check if a config already exists in Firestore database
      const existingConfig = await getSheetsConfig();
      let spreadsheetId = existingConfig?.spreadsheetId || '';

      // 3. If no spreadsheet ID exists, let's auto-create a brand new one!
      if (!spreadsheetId) {
        setSyncStatus({ type: 'success', message: 'Signed in. Initializing brand new Google Spreadsheet...' });
        spreadsheetId = await createNewSpreadsheet(accessToken);
      }

      // 4. Save spreadsheet mapping context to Firestore
      await saveSheetsConfig(spreadsheetId, accessToken);
      setSheetsConfig({
        spreadsheetId,
        accessToken,
        updatedAt: new Date().toISOString()
      });

      setSyncStatus({
        type: 'success',
        message: 'Successfully connected Google Sheets! Syncing active rows...'
      });

      // 5. Trigger an initial sync of all current registrations!
      await performSync(spreadsheetId, accessToken);
    } catch (error: any) {
      console.error('Sheets connection failed:', error);
      setSyncStatus({
        type: 'error',
        message: error.message || 'Google Auth login cancelled or setup failed.'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Perform a duplicate-checked registration sync from Firestore into the spreadsheet
  const performSync = async (spreadsheetId: string, accessToken: string) => {
    setIsSyncing(true);
    try {
      // Fetch all leads from Firestore to ensure we sync everything in the cloud
      const leadsCol = collection(db, 'leads');
      const leadsSnap = await getDocs(leadsCol);
      const fsLeads: LeadSubmission[] = [];
      leadsSnap.forEach((doc) => {
        fsLeads.push(doc.data() as LeadSubmission);
      });

      // Sort Firestore leads chronologically (oldest first so we append in correct order)
      fsLeads.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // Read existing row IDs from column A in the spreadsheet using active authorized token
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Registrations!A2:A1000`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      const existingIds = new Set<string>();
      if (response.ok) {
        const data = await response.json();
        if (data.values && Array.isArray(data.values)) {
          data.values.forEach((row: any) => {
            if (row && row[0]) {
              existingIds.add(String(row[0]).trim());
            }
          });
        }
      }

      let syncedCount = 0;
      // Append only leads that don't already exist in the spreadsheet
      for (const lead of fsLeads) {
        if (!existingIds.has(lead.id)) {
          const rowValues = [
            lead.id,
            lead.name,
            lead.mobile,
            lead.email,
            lead.city,
            lead.societyName,
            lead.societySize,
            lead.vehicleType,
            `₹${lead.interestedPlan}`,
            lead.discountAmount,
            lead.finalPrice,
            lead.referralCode,
            lead.createdAt,
            lead.queueNumber
          ];
          await appendRowToSheets(spreadsheetId, accessToken, rowValues);
          syncedCount++;
        }
      }

      setSyncStatus({
        type: 'success',
        message: `Sync completed! Added ${syncedCount} new records to Google Sheets.`
      });
      onRefreshLeads(); // refresh visual leads list in outer component
    } catch (error: any) {
      console.error('Google Sheet sync operation failed:', error);
      setSyncStatus({
        type: 'error',
        message: `Sync failed: ${error.message || 'Token might be expired, please re-authenticate.'}`
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncClick = () => {
    if (sheetsConfig) {
      performSync(sheetsConfig.spreadsheetId, sheetsConfig.accessToken);
    }
  };

  // Simulate CSV download as fallback
  const handleExportCSV = () => {
    if (leads.length === 0) {
      alert('No leads available to export! Submit some pre-registrations first.');
      return;
    }
    const headers = 'ID,Name,Mobile,Email,City,Society,VehicleType,IntentionPlan,DiscountReserved,ReferralCode,Date\n';
    const rows = leads
      .map(
        (l) =>
          `"${l.id}","${l.name}","${l.mobile}","${l.email}","${l.city}","${l.societyName}","${l.vehicleType}","₹${l.interestedPlan}",${l.discountAmount},"${l.referralCode}","${l.createdAt}"`
      )
      .join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `chakachak_launch_leads_${new Date().toISOString().slice(0,10)}.csv`);
    a.click();
  };

  // Batch delete leads in Firestore and clear locale
  const handleClearDatabase = async () => {
    const isConfirmed = window.confirm(
      'Are you sure you want to permanently clear all registration leads from Firestore? This action is destructive and irreversible.'
    );
    if (!isConfirmed) return;

    try {
      setIsSyncing(true);
      const leadsCol = collection(db, 'leads');
      const snap = await getDocs(leadsCol);
      const batch = writeBatch(db);
      snap.forEach((docSnap) => {
        batch.delete(doc(db, 'leads', docSnap.id));
      });
      await batch.commit();
      onClearLeads();
      setSyncStatus({ type: 'success', message: 'Firestore database leads cleared successfully.' });
    } catch (e: any) {
      console.error('Failed to clear firestore leads database:', e);
      setSyncStatus({ type: 'error', message: 'Failed to clear Leads collection.' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div id="leads-admin-overlay" className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-scaleUp">
        
        {/* Dashboard Header */}
        <div className="bg-slate-950 text-white p-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">ChakaChak Launch Lead Registry</h2>
              <p className="text-xs text-slate-400">Manage real-time cloud registrations saved in Firestore & Google Sheets</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dashboard Analytics grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-slate-50 border-b border-slate-200/60 shrink-0">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/50 shadow-xs">
            <span className="text-3xs font-bold text-slate-400 uppercase tracking-widest block">Total Pre-Registrations</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{totalLeads}</span>
              <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md">Live Count</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/50 shadow-xs">
            <span className="text-3xs font-bold text-slate-400 uppercase tracking-widest block">City Rollout</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-blue-600 tracking-tight">Pune ({puneLeads})</span>
              <span className="text-3xs text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md uppercase tracking-wider">Active</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/50 shadow-xs">
            <span className="text-3xs font-bold text-slate-400 uppercase tracking-widest block">Total Discounts Locked</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-600 tracking-tight">₹{totalDiscountReserved}</span>
              <span className="text-3xs text-slate-400 font-medium">50% Locked value</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/50 shadow-xs">
            <span className="text-3xs font-bold text-slate-400 uppercase tracking-widest block">Average Option Price</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight">₹{avgPlanPrice}</span>
              <span className="text-3xs text-slate-400 font-medium font-sans">Monthly choice</span>
            </div>
          </div>
        </div>

        {/* GOOGLE SHEETS SYNC CONTROL CENTER */}
        <div className="px-6 py-6 bg-slate-900 text-white shrink-0 border-b border-slate-800 space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-1">
              <span className="text-3xs font-black text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                Google Sheets Synchronization Engine
              </span>
              <p className="text-xs text-slate-300 font-medium">Auto-save data to your dedicated spreadsheet instantly upon registration submission.</p>
              <div className="text-3xs text-slate-400 font-mono flex flex-wrap gap-x-3 gap-y-1">
                <span>Spreadsheet Target ID: <span className="text-slate-200 font-bold">{sheetsConfig?.spreadsheetId || '1-QfPQtzN-y-aHy6TwfGAfTR4HxHOXy_gF6Bn934B3ko'}</span></span>
                {sheetsConfig?.updatedAt && (
                  <>
                    <span>|</span>
                    <span>Config Updated: {new Date(sheetsConfig.updatedAt).toLocaleTimeString()}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto lg:justify-end">
              <a
                href={`https://docs.google.com/spreadsheets/d/${sheetsConfig?.spreadsheetId || '1-QfPQtzN-y-aHy6TwfGAfTR4HxHOXy_gF6Bn934B3ko'}`}
                target="_blank"
                referrerPolicy="no-referrer"
                className="py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm text-center"
              >
                <ExternalLink className="w-4 h-4 text-orange-400" />
                Open Spreadsheet
              </a>

              {sheetsConfig?.accessToken && (
                <button
                  type="button"
                  onClick={handleSyncClick}
                  disabled={isSyncing}
                  className="py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-orange-600/40 text-black font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <RefreshCw className={`w-4 h-4 text-black ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Force Sheets Sync'}
                </button>
              )}
            </div>
          </div>

          {/* Config Forms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950 p-4 rounded-xl border border-slate-800">
            {/* Left Column: Direct Hook Setup (Simplest & Recommended) */}
            <form onSubmit={handleSaveCustomConfig} className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wider">Option A: Web App Direct Hook (Highly Recommended)</h4>
                <button
                  type="button"
                  onClick={() => setShowScriptHowTo(!showScriptHowTo)}
                  className="text-3xs text-orange-400 hover:underline font-bold"
                >
                  {showScriptHowTo ? 'Hide Setup Guide' : 'Show Setup Guide'}
                </button>
              </div>
              <p className="text-3xs text-slate-450 leading-relaxed">
                Connects directly to your spreadsheet via a free Google Web App. <strong>Never expires</strong> and requires absolutely no user sign-ins!
              </p>

              {showScriptHowTo && (
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-3xs text-slate-300 space-y-2 font-sans select-text">
                  <p className="font-bold text-orange-400">⚡ 30-Second Setup Guide:</p>
                  <ol className="list-decimal pl-4 space-y-1 text-slate-400">
                    <li>Open your Google Sheet: <code className="text-slate-200">1-QfPQtzN-y-aHy6TwfGAfTR4HxHOXy_gF6Bn934B3ko</code></li>
                    <li>Click <strong>Extensions</strong> → <strong>Apps Script</strong>.</li>
                    <li>Delete any existing script code and paste this script:</li>
                  </ol>
                  <pre className="bg-slate-950 p-2 rounded text-slate-200 overflow-x-auto select-all max-h-36 whitespace-pre font-mono text-[9px]">
{`function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Registrations") || SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    sheet.appendRow(data.values);
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`}
                  </pre>
                  <ol className="list-decimal pl-4 space-y-1 text-slate-400" start={4}>
                    <li>Click <strong>Deploy</strong> (top right) → <strong>New deployment</strong>.</li>
                    <li>Select type: <strong>Web app</strong>.</li>
                    <li>Set "Who has access" to: <strong>Anyone</strong>.</li>
                    <li>Click <strong>Deploy</strong>, copy the generated Web app URL, and paste it below!</li>
                  </ol>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-3xs font-bold text-slate-400 uppercase tracking-wider mb-1">Target Spreadsheet ID</label>
                  <input
                    type="text"
                    value={spreadsheetIdInput}
                    onChange={(e) => setSpreadsheetIdInput(e.target.value)}
                    placeholder="1-QfPQtzN-y-aHy6TwfGAfTR4HxHOXy_gF6Bn934B3ko"
                    className="w-full bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-bold text-slate-400 uppercase tracking-wider mb-1">Apps Script Web App URL</label>
                  <input
                    type="url"
                    value={webAppUrlInput}
                    onChange={(e) => setWebAppUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-slate-200 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSavingCustom}
                  className="w-full py-2 bg-orange-500 hover:bg-orange-600 font-bold text-xs text-black rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  {isSavingCustom ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Apps Script Hook Setting
                </button>
              </div>
            </form>

            {/* Right Column: Google OAuth Sign In (Alternative) */}
            <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Option B: Standard Google Authentication</h4>
                <p className="text-3xs text-slate-450 leading-relaxed mb-4">
                  Quickly connect and test your Google account instantly. <em>Note: Google access tokens automatically expire after 1 hour, so Setup A is recommended for live long-term web traffic.</em>
                </p>

                {sheetsConfig?.accessToken ? (
                  <div className="bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-lg text-3xs text-emerald-300 flex items-start gap-2">
                    <Check className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="font-bold">OAuth Connection Active</p>
                      <p className="text-slate-400 mt-0.5">Your browser holds a synchronized access session with active Google API permissions.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-3xs text-slate-400">
                    No active OAuth session exists. Click sign-in below to grant manual writing permissions.
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConnectSheets}
                  disabled={isConnecting}
                  className="gsi-material-button w-full text-xs py-2.5 px-4 bg-white text-slate-900 hover:bg-slate-50 flex items-center justify-center gap-2 font-bold cursor-pointer hover:shadow-md transition-all active:scale-95 rounded-xl border border-slate-200"
                >
                  {isConnecting ? (
                    <RefreshCw className="w-4 h-4 text-slate-500 animate-spin" />
                  ) : (
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4.5 h-4.5 block">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  )}
                  <span>{isConnecting ? 'Authenticating...' : sheetsConfig?.accessToken ? 'Reconnect Google Account' : 'Sign In with Google'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FEEDBACK FEED ALERT */}
        {syncStatus.message && (
          <div className={`px-6 py-2.5 shrink-0 text-xs font-semibold flex items-center gap-2 border-b ${
            syncStatus.type === 'error'
              ? 'bg-rose-50 border-rose-100 text-rose-700'
              : 'bg-emerald-50 border-emerald-100 text-emerald-800'
          }`}>
            {syncStatus.type === 'error' ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <ShieldCheck className="w-4 h-4 shrink-0" />}
            <span className="font-sans leading-relaxed">{syncStatus.message}</span>
          </div>
        )}

        {/* Lead Table / List */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[200px]">
          {leads.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Database className="w-8 h-8" />
              </div>
              <h4 className="text-slate-800 font-bold mb-1">No Leads Registered Yet</h4>
              <p className="text-slate-400 text-xs max-w-sm">
                Reserve your discount in the public landing form first! Your submission will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-3xs uppercase tracking-wider">
                    <th className="p-3.5 pl-4">Queue #</th>
                    <th className="p-3.5">Subscriber</th>
                    <th className="p-3.5">Contact Details</th>
                    <th className="p-3.5">Location & Society</th>
                    <th className="p-3.5">Vehicle Type</th>
                    <th className="p-3.5">Plan Selected</th>
                    <th className="p-3.5 text-right pr-4">Action Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/55 transition-colors">
                      <td className="p-3.5 pl-4 font-mono font-bold text-slate-400">
                        #{lead.queueNumber}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 font-sans">{lead.name}</div>
                        <div className="text-3xs font-mono text-slate-400 mt-0.5">{lead.id}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-mono">Mob: {lead.mobile}</div>
                        <div className="font-mono text-emerald-600 flex items-center gap-0.5 mt-0.5 text-3xs">
                          <span>Email: {lead.email}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          {lead.city}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{lead.societyName} ({lead.societySize} units)</div>
                      </td>
                      <td className="p-3.5 text-slate-800 font-semibold">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-3xs uppercase tracking-wide">
                          {lead.vehicleType}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">₹{lead.interestedPlan}</div>
                        <div className="text-3xs text-emerald-600 font-sans">Locked-In: -₹{lead.discountAmount}</div>
                      </td>
                      <td className="p-3.5 text-right pr-4 font-mono text-xs font-bold text-orange-600">
                        {lead.referralCode}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dashboard Footer CTAs */}
        <div className="bg-slate-50 border-t border-slate-200/60 p-4 shrink-0 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="text-xs text-slate-500 font-medium">
            Accumulating pre-launch metrics inside <strong>Pune</strong> townships in sync with Google Sheets.
          </div>
          
          <div className="flex gap-2.5 font-sans">
            <button
              onClick={handleClearDatabase}
              disabled={leads.length === 0}
              className="py-2.5 px-4 rounded-xl border border-red-200 bg-red-50 text-red-600 font-semibold text-xs hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Reset database
            </button>
            
            <button
              onClick={handleExportCSV}
              disabled={leads.length === 0}
              className="py-2.5 px-5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 text-orange-400" /> Export CSV Leadsheet
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
