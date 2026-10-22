'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { AuthModal } from '@/components/AuthModal';
import {
  MessageSquare,
  Shield,
  Upload,
  User,
  Users,
  Copy,
  Share2,
  Check,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Lock,
  Pause,
  Play,
  Settings,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  LogOut,
  Zap,
  QrCode,
  X
} from 'lucide-react';
import QRCode from 'qrcode';

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'studio' | 'contacts' | 'import' | 'profile' | 'privacy' | 'whatsapp' | 'logs'>('studio');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // WhatsApp & Automation State
  const [whatsappReport, setWhatsappReport] = useState<any>(null);
  const [automationSettings, setAutomationSettings] = useState<any>(null);

  // QR Session State
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrSession, setQRSession] = useState<any>(null);
  const [qrDataUrl, setQRDataUrl] = useState<string | null>(null);
  const [qrLoading, setQRLoading] = useState(false);
  const [qrSecondsRemaining, setQRSecondsRemaining] = useState<number | null>(null);

  // Reply Studio State
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [incomingMessage, setIncomingMessage] = useState('');
  const [optionalContext, setOptionalContext] = useState('');
  const [currentDraft, setCurrentDraft] = useState<any>(null);
  const [editedText, setEditedText] = useState('');
  const [copied, setCopied] = useState(false);

  // Import State
  const [rawChatText, setRawChatText] = useState(`[10/14/26, 14:05:10] Alex: Bro you reaching soon?
[10/14/26, 14:06:00] Sam: Yes, 5 mins away!
[10/14/26, 14:06:25] Alex: Steady lah, I already ordered kopi...
[10/14/26, 14:07:00] Sam: Nice! 👍
[10/14/26, 14:07:30] Alex: Ok see you!`);
  const [ownerIdentifier, setOwnerIdentifier] = useState('Alex');
  const [consentConfirmed, setConsentConfirmed] = useState(true);

  // New Contact State
  const [newContactName, setNewContactName] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newRelationship, setNewRelationship] = useState('friend');
  const [newTone, setNewTone] = useState('casual');
  const [newQuietHoursEnabled, setNewQuietHoursEnabled] = useState(false);
  const [newQuietHoursStart, setNewQuietHoursStart] = useState('22:00');
  const [newQuietHoursEnd, setNewQuietHoursEnd] = useState('08:00');

  // Edit Contact State
  const [editingContact, setEditingContact] = useState<any | null>(null);

  // Load User Data upon authenticated state
  useEffect(() => {
    if (user) {
      loadInitialData();
    } else {
      setUserProfile(null);
      setContacts([]);
      setDrafts([]);
    }
  }, [user]);

  async function loadInitialData() {
    try {
      setLoading(true);
      const profile = await apiRequest('/me');
      setUserProfile(profile);

      const contactList = await apiRequest('/contacts');
      setContacts(contactList);
      if (contactList.length > 0) {
        setSelectedContactId(contactList[0].id);
      } else {
        setSelectedContactId('');
      }

      const draftList = await apiRequest('/drafts');
      setDrafts(draftList);

      const logsList = await apiRequest('/privacy/logs');
      setAuditLogs(logsList || []);

      const report = await apiRequest('/integrations/whatsapp/capabilities');
      setWhatsappReport(report);

      const autoSettings = await apiRequest('/integrations/whatsapp/settings');
      setAutomationSettings(autoSettings);

      try {
        const qrStat = await apiRequest('/integrations/whatsapp/session/status');
        setQRSession(qrStat);
      } catch (_) {}
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ text: `Failed to load data: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // WhatsApp QR Linking Handlers
  async function initiateQRConnection() {
    setQRLoading(true);
    setQRDataUrl(null);
    setQRSecondsRemaining(null);
    try {
      const res = await apiRequest('/integrations/whatsapp/session/connect', { method: 'POST' });
      setQRSession(res);
      if (res.status === 'qr_ready' && res.qrPayload) {
        const url = await QRCode.toDataURL(res.qrPayload, {
          width: 256,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' }
        });
        setQRDataUrl(url);
        if (res.expiresAt) {
          const diff = Math.max(0, Math.floor((new Date(res.expiresAt).getTime() - Date.now()) / 1000));
          setQRSecondsRemaining(diff);
        }
      }
    } catch (err: any) {
      const isNetworkError = err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError');
      const isUnconfigured = err.status === 'not_configured' || err.error === 'ProviderNotConfigured';
      setQRSession({
        status: isUnconfigured ? 'not_configured' : 'error',
        error: isNetworkError ? 'BackendOffline' : (err.error || 'ConnectionError'),
        message: isNetworkError
          ? 'Cannot connect to the Mani API server. Please verify your internet connection and backend deployment.'
          : (err.message || 'WhatsApp integration not configured.')
      });
    } finally {
      setQRLoading(false);
    }
  }

  async function handleRefreshQR() {
    setQRLoading(true);
    setQRDataUrl(null);
    setQRSecondsRemaining(null);
    try {
      const res = await apiRequest('/integrations/whatsapp/session/refresh', { method: 'POST' });
      setQRSession(res);
      if (res.status === 'qr_ready' && res.qrPayload) {
        const url = await QRCode.toDataURL(res.qrPayload, {
          width: 256,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' }
        });
        setQRDataUrl(url);
        if (res.expiresAt) {
          const diff = Math.max(0, Math.floor((new Date(res.expiresAt).getTime() - Date.now()) / 1000));
          setQRSecondsRemaining(diff);
        }
      }
    } catch (err: any) {
      const isNetworkError = err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError');
      const isUnconfigured = err.status === 'not_configured' || err.error === 'ProviderNotConfigured';
      setQRSession({
        status: isUnconfigured ? 'not_configured' : 'error',
        error: isNetworkError ? 'BackendOffline' : (err.error || 'RefreshError'),
        message: isNetworkError
          ? 'Cannot connect to the Mani API server. Please verify your internet connection and backend deployment.'
          : (err.message || 'Failed to refresh QR code.')
      });
    } finally {
      setQRLoading(false);
    }
  }

  async function handleDisconnectQR() {
    setQRLoading(true);
    try {
      await apiRequest('/integrations/whatsapp/session/disconnect', { method: 'POST' });
      setQRSession({ status: 'disconnected', message: 'WhatsApp session disconnected.' });
      setQRDataUrl(null);
      const refreshed = await apiRequest('/integrations/whatsapp/settings');
      setAutomationSettings(refreshed);
      setStatusMsg({ text: 'WhatsApp session disconnected.', type: 'info' });
    } catch (err: any) {
      setStatusMsg({ text: `Disconnect failed: ${err.message}`, type: 'error' });
    } finally {
      setQRLoading(false);
    }
  }

  // Poll status while QR modal is active
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let timer: NodeJS.Timeout | null = null;

    if (showQRModal && (qrSession?.status === 'qr_ready' || qrSession?.status === 'connecting')) {
      interval = setInterval(async () => {
        try {
          const res = await apiRequest('/integrations/whatsapp/session/status');
          setQRSession(res);
          if (res.status === 'connected') {
            const refreshed = await apiRequest('/integrations/whatsapp/settings');
            setAutomationSettings(refreshed);
          } else if (res.status === 'expired') {
            setQRDataUrl(null);
          }
        } catch (_) {}
      }, 3000);
    }

    if (showQRModal && qrSecondsRemaining && qrSecondsRemaining > 0) {
      timer = setInterval(() => {
        setQRSecondsRemaining(prev => (prev && prev > 1 ? prev - 1 : 0));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (timer) clearInterval(timer);
    };
  }, [showQRModal, qrSession?.status, qrSecondsRemaining]);

  // Generate Reply Handler
  async function handleGenerateReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedContactId || !incomingMessage.trim()) return;

    try {
      setLoading(true);
      setStatusMsg(null);
      const draft = await apiRequest('/replies/generate', {
        method: 'POST',
        body: {
          contactId: selectedContactId,
          incomingMessage,
          optionalContext: optionalContext.trim() || undefined
        }
      });
      setCurrentDraft(draft);
      setEditedText(draft.generatedReply);
      setDrafts(prev => [draft, ...prev]);
    } catch (err: any) {
      setStatusMsg({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // Update Draft Status / Edit
  async function handleUpdateDraft(status: string) {
    if (!currentDraft) return;
    try {
      setLoading(true);
      const updated = await apiRequest(`/drafts/${currentDraft.id}`, {
        method: 'PATCH',
        body: {
          reviewStatus: status,
          editedReply: editedText !== currentDraft.generatedReply ? editedText : undefined
        }
      });
      setCurrentDraft(updated);
      setDrafts(prev => prev.map(d => d.id === updated.id ? updated : d));
      setStatusMsg({ text: `Draft marked as ${status}.`, type: 'success' });
    } catch (err: any) {
      setStatusMsg({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // Feedback Submission
  async function handleFeedback(rating: 'helpful' | 'needs_improvement') {
    if (!currentDraft) return;
    try {
      await apiRequest(`/drafts/${currentDraft.id}/feedback`, {
        method: 'POST',
        body: {
          draftId: currentDraft.id,
          rating,
          ownerCorrection: editedText !== currentDraft.generatedReply ? editedText : undefined
        }
      });
      setStatusMsg({ text: 'Feedback & correction saved to style memory.', type: 'success' });
    } catch (err: any) {
      setStatusMsg({ text: err.message, type: 'error' });
    }
  }

  // Copy to Clipboard
  function handleCopy() {
    const textToCopy = editedText || currentDraft?.generatedReply;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    handleUpdateDraft('copied');
  }

  // Share via Web Share API
  async function handleShare() {
    const textToShare = editedText || currentDraft?.generatedReply;
    if (!textToShare) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Reply Draft',
          text: textToShare
        });
        handleUpdateDraft('shared');
      } catch (e) {
        // user cancelled
      }
    } else {
      handleCopy();
      setStatusMsg({ text: 'Web Share not supported in this browser. Copied to clipboard instead.', type: 'info' });
    }
  }

  // Import Chat Handler
  async function handleImportChat(e: React.FormEvent) {
    e.preventDefault();
    if (!rawChatText || !ownerIdentifier || !consentConfirmed) return;

    try {
      setLoading(true);
      const result = await apiRequest('/imports', {
        method: 'POST',
        body: {
          rawText: rawChatText,
          ownerIdentifier,
          consentConfirmed: true
        }
      });
      setStatusMsg({ text: result.summary, type: 'success' });
      const user = await apiRequest('/me');
      setUserProfile(user);
    } catch (err: any) {
      setStatusMsg({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // Create Contact Handler
  async function handleCreateContact(e: React.FormEvent) {
    e.preventDefault();
    if (!newContactName.trim()) return;

    try {
      setLoading(true);
      const created = await apiRequest('/contacts', {
        method: 'POST',
        body: {
          name: newContactName.trim(),
          phoneNumber: newPhoneNumber.trim() || undefined,
          relationship: newRelationship,
          preferredTone: newTone,
          autoSendEnabled: false,
          sensitiveTopicsRequireReview: true,
          isPaused: false,
          quietHours: {
            enabled: newQuietHoursEnabled,
            start: newQuietHoursStart,
            end: newQuietHoursEnd,
            timezone: 'UTC'
          }
        }
      });
      setContacts(prev => [created, ...prev]);
      setSelectedContactId(created.id);
      setNewContactName('');
      setNewPhoneNumber('');
      setNewQuietHoursEnabled(false);
      setStatusMsg({ text: `Contact ${created.name} added.`, type: 'success' });
    } catch (err: any) {
      setStatusMsg({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // Update Contact Handler
  async function handleSaveEditedContact(e: React.FormEvent) {
    e.preventDefault();
    if (!editingContact || !editingContact.name?.trim()) return;

    try {
      setLoading(true);
      const updated = await apiRequest(`/contacts/${editingContact.id}`, {
        method: 'PATCH',
        body: {
          name: editingContact.name.trim(),
          phoneNumber: editingContact.phoneNumber?.trim() || undefined,
          relationship: editingContact.relationship,
          preferredTone: editingContact.preferredTone,
          quietHours: editingContact.quietHours
        }
      });
      setContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
      setEditingContact(null);
      setStatusMsg({ text: `Contact ${updated.name} updated.`, type: 'success' });
    } catch (err: any) {
      setStatusMsg({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // Toggle Contact Pause State
  async function toggleContactPause(contact: any) {
    try {
      const updated = await apiRequest(`/contacts/${contact.id}`, {
        method: 'PATCH',
        body: { isPaused: !contact.isPaused }
      });
      setContacts(prev => prev.map(c => c.id === contact.id ? updated : c));
    } catch (err: any) {
      setStatusMsg({ text: err.message, type: 'error' });
    }
  }

  // Delete Contact Handler
  async function handleDeleteContact(contactId: string, contactName: string) {
    if (!confirm(`Are you sure you want to delete ${contactName}?`)) return;
    try {
      await apiRequest(`/contacts/${contactId}`, { method: 'DELETE' });
      setContacts(prev => prev.filter(c => c.id !== contactId));
      if (selectedContactId === contactId) {
        setSelectedContactId('');
      }
      setStatusMsg({ text: `Contact ${contactName} deleted.`, type: 'info' });
    } catch (err: any) {
      setStatusMsg({ text: err.message, type: 'error' });
    }
  }

  // Full Data Erase
  async function handleDataPurge() {
    if (!confirm('Are you sure you want to permanently delete all personal data, style profiles, and chat imports? This cannot be undone.')) {
      return;
    }
    try {
      setLoading(true);
      await apiRequest('/me/data', { method: 'DELETE' });
      setUserProfile(null);
      setContacts([]);
      setDrafts([]);
      setCurrentDraft(null);
      setStatusMsg({ text: 'All personal data has been permanently erased.', type: 'info' });
    } catch (err: any) {
      setStatusMsg({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const selectedContact = contacts.find(c => c.id === selectedContactId);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-neutral-100 font-sans">
      {!user && !authLoading && <AuthModal />}

      {/* Top Navigation — only shown when authenticated */}
      {user && <header className="border-b border-neutral-800 bg-neutral-950 sticky top-0 z-50">
        {/* Row 1: Branding + User */}
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-900 border border-emerald-700/50 flex items-center justify-center text-emerald-400 font-bold text-sm select-none shadow-sm">
            <img
            src="/logo.png"
            alt="Mani-Annan Logo"
            className="w-10 h-10 rounded-full object-cover object-top border border-neutral-700 shadow-md bg-emerald-950"/>
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
                Mani-Annan
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500 font-mono tracking-wide">MVP</span>
              </h1>
              <p className="text-[11px] text-neutral-500 mt-0.5">Authentic Personal AI Messaging Assistant</p>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowQRModal(true);
                  initiateQRConnection();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  qrSession?.status === 'connected'
                    ? 'border-emerald-800 bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/60'
                    : 'border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-white'
                }`}
                title="Connect personal WhatsApp via Linked Devices QR"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{qrSession?.status === 'connected' ? 'WhatsApp Connected' : 'Connect WhatsApp'}</span>
                {qrSession?.status === 'connected' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs">
                <User className="w-3.5 h-3.5 text-neutral-500" />
                <span className="text-neutral-300 font-mono text-[11px] truncate max-w-[180px]">{user.email}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-500 hover:text-white transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Row 2: Navigation tabs */}
        {user && (
          <nav className="px-4 flex items-end gap-0 border-t border-neutral-800/60">
            {([
              { id: 'studio',   label: 'Reply Studio',         icon: <MessageSquare className="w-3.5 h-3.5" /> },
              { id: 'contacts', label: 'Contacts',              icon: <Users className="w-3.5 h-3.5" /> },
              { id: 'import',   label: 'Chat Import',           icon: <Upload className="w-3.5 h-3.5" /> },
              { id: 'profile',  label: 'Style Profile',         icon: <Sparkles className="w-3.5 h-3.5" /> },
              { id: 'privacy',  label: 'Privacy and Governance',icon: <Shield className="w-3.5 h-3.5" /> },
              { id: 'whatsapp', label: 'WhatsApp and Automation',icon: <Zap className="w-3.5 h-3.5" /> },
              { id: 'logs',     label: 'Activity Logs',         icon: <RefreshCw className="w-3.5 h-3.5" /> },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={async () => {
                  setActiveTab(tab.id);
                  if (tab.id === 'logs') {
                    try { setAuditLogs((await apiRequest('/privacy/logs')) || []); } catch {}
                  }
                }}
                className={`relative flex items-center gap-1.5 px-3.5 py-3 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-emerald-400'
                    : 'text-neutral-500 hover:text-neutral-200'
                }`}
              >
                {activeTab === tab.id && tab.id === 'whatsapp' && (
                  <span className="text-emerald-400">{tab.icon}</span>
                )}
                {!(activeTab === tab.id && tab.id === 'whatsapp') && tab.icon}
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-500 rounded-t-full" />
                )}
              </button>
            ))}
          </nav>
        )}
      </header>}

      {/* Global Status Banner */}
      {statusMsg && (
        <div className={`px-6 py-2.5 text-xs font-mono flex items-center justify-between border-b ${
          statusMsg.type === 'error'
            ? 'bg-rose-950/50 border-rose-800 text-rose-300'
            : statusMsg.type === 'success'
            ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
            : 'bg-neutral-900 border-neutral-800 text-neutral-300'
        }`}>
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="text-neutral-500 hover:text-neutral-200">✕</button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6">

        {/* 1. REPLY STUDIO TAB */}
        {activeTab === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Form Column */}
            <div className="lg:col-span-6 space-y-4">
              <div className="border border-neutral-800 rounded-xl p-5 bg-neutral-900/40">
                <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-neutral-400" />
                  Generate Contextual Reply
                </h2>

                <form onSubmit={handleGenerateReply} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Select Contact & Relationship</label>
                    <select
                      value={selectedContactId}
                      onChange={(e) => setSelectedContactId(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600"
                    >
                      {contacts.length === 0 && <option value="">No contacts configured yet</option>}
                      {contacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.relationship.replace('_', ' ')}) — Tone: {c.preferredTone}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedContact && (
                    <div className="text-xs p-3 rounded-lg bg-neutral-950 border border-neutral-800/80 flex items-center justify-between text-neutral-400">
                      <div>
                        <span className="font-medium text-neutral-200">Relationship:</span> {selectedContact.relationship} •{' '}
                        <span className="font-medium text-neutral-200">Tone:</span> {selectedContact.preferredTone}
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedContact.isPaused ? (
                          <span className="text-amber-400 text-[11px] font-mono flex items-center gap-1">
                            <Pause className="w-3 h-3" /> Paused
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-[11px] font-mono flex items-center gap-1">
                            <Play className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Incoming Message (Authorized Input)</label>
                    <textarea
                      rows={3}
                      value={incomingMessage}
                      onChange={(e) => setIncomingMessage(e.target.value)}
                      placeholder="e.g. Bro, are we still having lunch at 1pm?"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Optional Context for AI <span className="text-neutral-500">(Private guidance)</span>
                    </label>
                    <input
                      type="text"
                      value={optionalContext}
                      onChange={(e) => setOptionalContext(e.target.value)}
                      placeholder="e.g. Free after 1:30pm due to traffic, suggest nearby mamak"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !selectedContactId || !incomingMessage.trim()}
                    className="w-full py-2.5 px-4 rounded-lg bg-white text-black font-semibold text-xs tracking-wide hover:bg-neutral-200 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    Generate Authentic Reply
                  </button>
                </form>
              </div>

              {/* Informational Disclaimer */}
              <div className="text-[11px] text-neutral-500 bg-neutral-900/20 border border-neutral-900 rounded-lg p-3 leading-relaxed">
                <span className="font-semibold text-neutral-400">Strict Safety Notice:</span> Mani-Annan never impersonates unofficial WhatsApp sessions or automates personal client sockets. All drafts require owner review and use OS-native copy & share controls.
              </div>
            </div>

            {/* Draft Review Column */}
            <div className="lg:col-span-6 space-y-4">
              <div className="border border-neutral-800 rounded-xl p-5 bg-neutral-900/40">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-neutral-400" />
                    Reply Studio & Human Review
                  </h2>
                  {currentDraft && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                      Status: {currentDraft.reviewStatus}
                    </span>
                  )}
                </div>

                {currentDraft ? (
                  <div className="space-y-4">
                    {/* Deterministic Safety Assessment */}
                    <div className={`p-3 rounded-lg border text-xs ${
                      currentDraft.safetyCheck.isSafe
                        ? 'bg-neutral-950 border-neutral-800 text-neutral-300'
                        : 'bg-rose-950/30 border-rose-800/80 text-rose-300'
                    }`}>
                      <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                        <span className="font-semibold flex items-center gap-1.5">
                          {currentDraft.safetyCheck.isSafe ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          )}
                          Safety Check: {currentDraft.safetyCheck.isSafe ? 'Passed' : 'Risk Flagged'}
                        </span>
                        <span>Review Required: {currentDraft.safetyCheck.requiresManualReview ? 'YES' : 'NO'}</span>
                      </div>
                      <p className="text-[11px] text-neutral-400">{currentDraft.safetyCheck.reason}</p>
                    </div>

                    {/* Editable Reply Output */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                        <label className="font-medium">Reply Draft (Owner Editable)</label>
                        <span className="text-[10px] font-mono text-neutral-500">
                          {editedText.length} chars
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-neutral-100 focus:outline-none focus:border-neutral-600 font-sans"
                      />
                    </div>

                    {/* Actions: Copy, Share, Approve, Reject */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={handleCopy}
                        className="py-2 px-3 rounded-lg border border-neutral-800 hover:border-neutral-600 bg-neutral-950 text-xs text-neutral-200 font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                      </button>

                      <button
                        onClick={handleShare}
                        className="py-2 px-3 rounded-lg border border-neutral-800 hover:border-neutral-600 bg-neutral-950 text-xs text-neutral-200 font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        OS Share
                      </button>

                      <button
                        onClick={() => handleUpdateDraft('approved')}
                        className="py-2 px-3 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve Draft
                      </button>

                      <button
                        onClick={() => handleUpdateDraft('rejected')}
                        className="py-2 px-3 rounded-lg bg-rose-950/50 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Reject Draft
                      </button>
                    </div>

                    {/* Feedback Learning Section */}
                    <div className="border-t border-neutral-800/80 pt-3 flex items-center justify-between text-xs text-neutral-400">
                      <span>Rate this tone:</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFeedback('helpful')}
                          className="px-2.5 py-1 rounded bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 text-xs flex items-center gap-1"
                        >
                          <ThumbsUp className="w-3 h-3" /> Accurate
                        </button>
                        <button
                          onClick={() => handleFeedback('needs_improvement')}
                          className="px-2.5 py-1 rounded bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 text-xs flex items-center gap-1"
                        >
                          <ThumbsDown className="w-3 h-3" /> Needs Correction
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-neutral-600 text-xs">
                    No active draft. Generate a reply to inspect tone and safety rules.
                  </div>
                )}
              </div>

              {/* Recent Drafts List */}
              <div className="border border-neutral-800 rounded-xl p-4 bg-neutral-900/20">
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                  Recent Drafts ({drafts.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {drafts.length === 0 && (
                    <div className="text-xs text-neutral-600">No drafts recorded yet.</div>
                  )}
                  {drafts.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => {
                        setCurrentDraft(d);
                        setEditedText(d.editedReply || d.generatedReply);
                      }}
                      className="p-2.5 rounded-lg border border-neutral-800/80 hover:border-neutral-700 bg-neutral-950 cursor-pointer text-xs transition-colors flex items-center justify-between"
                    >
                      <div className="truncate mr-2">
                        <span className="font-semibold text-neutral-300 mr-2">{d.contactName}:</span>
                        <span className="text-neutral-500 truncate">{d.generatedReply}</span>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-500 whitespace-nowrap">
                        {d.reviewStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. CONTACTS TAB */}
        {activeTab === 'contacts' && (
          <div className="space-y-6">
            <div className="border border-neutral-800 rounded-xl p-5 bg-neutral-900/40">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-neutral-400" />
                Add New Contact Profile
              </h2>
              <form onSubmit={handleCreateContact} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      placeholder="e.g. Sarah"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Phone Number (Optional)</label>
                    <input
                      type="text"
                      value={newPhoneNumber}
                      onChange={(e) => setNewPhoneNumber(e.target.value)}
                      placeholder="e.g. +60123456789"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Relationship</label>
                    <select
                      value={newRelationship}
                      onChange={(e) => setNewRelationship(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600"
                    >
                      <option value="romantic_partner">Romantic Partner</option>
                      <option value="boss_or_manager">Boss or Manager</option>
                      <option value="friend">Friend</option>
                      <option value="family_member">Family Member</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Preferred Tone</label>
                    <select
                      value={newTone}
                      onChange={(e) => setNewTone(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600"
                    >
                      <option value="casual">Casual</option>
                      <option value="professional">Professional</option>
                      <option value="warm_and_affectionate">Warm & Affectionate</option>
                      <option value="respectful">Respectful</option>
                      <option value="humorous_playful">Humorous & Playful</option>
                      <option value="neutral_direct">Neutral & Direct</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-neutral-800/60">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newQuietHoursEnabled}
                        onChange={(e) => setNewQuietHoursEnabled(e.target.checked)}
                        className="rounded border-neutral-700 bg-neutral-950"
                      />
                      <span>Enable Quiet Hours</span>
                    </label>

                    {newQuietHoursEnabled && (
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <span>From:</span>
                        <input
                          type="time"
                          value={newQuietHoursStart}
                          onChange={(e) => setNewQuietHoursStart(e.target.value)}
                          className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white"
                        />
                        <span>To:</span>
                        <input
                          type="time"
                          value={newQuietHoursEnd}
                          onChange={(e) => setNewQuietHoursEnd(e.target.value)}
                          className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!newContactName.trim() || loading}
                    className="py-2 px-5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors"
                  >
                    Create Contact
                  </button>
                </div>
              </form>
            </div>

            {/* Edit Contact Modal */}
            {editingContact && (
              <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Edit Contact Policy: {editingContact.name}</h3>
                    <button onClick={() => setEditingContact(null)} className="text-neutral-500 hover:text-white">✕</button>
                  </div>

                  <form onSubmit={handleSaveEditedContact} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-neutral-400 mb-1">Contact Name</label>
                      <input
                        type="text"
                        value={editingContact.name}
                        onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={editingContact.phoneNumber || ''}
                        onChange={(e) => setEditingContact({ ...editingContact, phoneNumber: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-neutral-400 mb-1">Relationship</label>
                        <select
                          value={editingContact.relationship}
                          onChange={(e) => setEditingContact({ ...editingContact, relationship: e.target.value })}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white"
                        >
                          <option value="romantic_partner">Romantic Partner</option>
                          <option value="boss_or_manager">Boss or Manager</option>
                          <option value="friend">Friend</option>
                          <option value="family_member">Family Member</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-neutral-400 mb-1">Preferred Tone</label>
                        <select
                          value={editingContact.preferredTone}
                          onChange={(e) => setEditingContact({ ...editingContact, preferredTone: e.target.value })}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white"
                        >
                          <option value="casual">Casual</option>
                          <option value="professional">Professional</option>
                          <option value="warm_and_affectionate">Warm & Affectionate</option>
                          <option value="respectful">Respectful</option>
                          <option value="humorous_playful">Humorous & Playful</option>
                          <option value="neutral_direct">Neutral & Direct</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-800 space-y-2">
                      <label className="flex items-center gap-2 text-neutral-300">
                        <input
                          type="checkbox"
                          checked={editingContact.quietHours?.enabled ?? false}
                          onChange={(e) => setEditingContact({
                            ...editingContact,
                            quietHours: {
                              ...(editingContact.quietHours || { start: '22:00', end: '08:00', timezone: 'UTC' }),
                              enabled: e.target.checked
                            }
                          })}
                        />
                        <span>Enable Quiet Hours for this Contact</span>
                      </label>
                      {editingContact.quietHours?.enabled && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <span>Start:</span>
                            <input
                              type="time"
                              value={editingContact.quietHours?.start || '22:00'}
                              onChange={(e) => setEditingContact({
                                ...editingContact,
                                quietHours: { ...editingContact.quietHours, start: e.target.value }
                              })}
                              className="bg-neutral-950 border border-neutral-800 rounded p-1 text-white"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span>End:</span>
                            <input
                              type="time"
                              value={editingContact.quietHours?.end || '08:00'}
                              onChange={(e) => setEditingContact({
                                ...editingContact,
                                quietHours: { ...editingContact.quietHours, end: e.target.value }
                              })}
                              className="bg-neutral-950 border border-neutral-800 rounded p-1 text-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingContact(null)}
                        className="py-1.5 px-3 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="py-1.5 px-4 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-500"
                      >
                        Save Policy
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Contact List */}
            <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/20">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400 font-mono">
                  <tr>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Relationship</th>
                    <th className="py-3 px-4">Tone Setting</th>
                    <th className="py-3 px-4">Quiet Hours</th>
                    <th className="py-3 px-4">Auto-Send</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80">
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-neutral-900/40">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{contact.name}</div>
                        {contact.phoneNumber && (
                          <div className="text-[11px] text-neutral-500 font-mono">{contact.phoneNumber}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 capitalize text-neutral-300">
                        {contact.relationship.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-4 capitalize text-neutral-400">{contact.preferredTone.replace(/_/g, ' ')}</td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {contact.quietHours?.enabled ? (
                          <span className="text-amber-400">
                            {contact.quietHours.start} - {contact.quietHours.end}
                          </span>
                        ) : (
                          <span className="text-neutral-500">Disabled</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
                          DISABLED (Safe)
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {contact.isPaused ? (
                          <span className="text-amber-400 text-xs font-mono">Paused</span>
                        ) : (
                          <span className="text-emerald-400 text-xs font-mono">Active</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingContact(contact)}
                            className="px-2 py-1 rounded text-xs border border-neutral-700 hover:border-neutral-500 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleContactPause(contact)}
                            className="px-2 py-1 rounded text-xs border border-neutral-700 hover:border-neutral-500 font-medium"
                          >
                            {contact.isPaused ? 'Resume' : 'Pause'}
                          </button>
                          <button
                            onClick={() => handleDeleteContact(contact.id, contact.name)}
                            className="p-1 rounded text-xs border border-rose-900/60 hover:border-rose-800 text-rose-400 hover:bg-rose-950/40"
                            title="Delete Contact"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. CHAT IMPORT TAB */}
        {activeTab === 'import' && (
          <div className="border border-neutral-800 rounded-xl p-5 bg-neutral-900/40 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-neutral-400" />
                Authorized Chat History Import
              </h2>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Paste an exported WhatsApp chat history that you are authorized to use. Mani-Annan separates your outgoing messages from contact messages. Counterparty messages are never treated as examples of your writing style.
              </p>
            </div>

            <form onSubmit={handleImportChat} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Your Sender Name (Owner Identifier in Chat)
                </label>
                <input
                  type="text"
                  value={ownerIdentifier}
                  onChange={(e) => setOwnerIdentifier(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Exported Chat Content (.txt format)
                </label>
                <textarea
                  rows={8}
                  value={rawChatText}
                  onChange={(e) => setRawChatText(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-300 font-mono focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="consentCheck"
                  checked={consentConfirmed}
                  onChange={(e) => setConsentConfirmed(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-950"
                />
                <label htmlFor="consentCheck" className="text-xs text-neutral-300">
                  I confirm that I own or am explicitly authorized to import this conversation history for personal style calibration.
                </label>
              </div>

              <button
                type="submit"
                disabled={!consentConfirmed || !ownerIdentifier.trim() || !rawChatText.trim() || loading}
                className="py-2.5 px-5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors"
              >
                {loading ? 'Analyzing & Updating Style Profile...' : 'Extract Style & Calibrate'}
              </button>
            </form>
          </div>
        )}

        {/* 4. STYLE PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="border border-neutral-800 rounded-xl p-5 bg-neutral-900/40 space-y-5">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-neutral-400" />
              Personal Writing-Style Profile
            </h2>

            {userProfile?.styleProfile ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="font-semibold text-neutral-200">Language & Slang</div>
                  <div className="text-neutral-400">
                    <span className="text-neutral-200">Languages:</span> {userProfile.styleProfile.primaryLanguages.join(', ')}
                  </div>
                  <div className="text-neutral-400">
                    <span className="text-neutral-200">Manglish Detection:</span> {userProfile.styleProfile.usesManglish ? 'Enabled' : 'Disabled'}
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {userProfile.styleProfile.commonSlang.map((slang: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono text-[11px]">
                        {slang}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="font-semibold text-neutral-200">Sentence & Punctuation Habits</div>
                  <div className="text-neutral-400">
                    <span className="text-neutral-200">Sentence Length:</span> {userProfile.styleProfile.avgSentenceLength}
                  </div>
                  <div className="text-neutral-400">
                    <span className="text-neutral-200">Omits Trailing Period:</span> {userProfile.styleProfile.punctuationHabits?.omitsEndingPeriod ? 'Yes' : 'No'}
                  </div>
                  <div className="text-neutral-400">
                    <span className="text-neutral-200">Uses Ellipsis (...):</span> {userProfile.styleProfile.punctuationHabits?.usesEllipsis ? 'Yes' : 'No'}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="font-semibold text-neutral-200">Emoji Preferences</div>
                  <div className="text-neutral-400">
                    <span className="text-neutral-200">Frequency:</span> {userProfile.styleProfile.emojiHabits?.emojiFrequency}
                  </div>
                  <div className="flex gap-2 text-lg pt-1">
                    {userProfile.styleProfile.emojiHabits?.frequentEmojis?.map((e: string, i: number) => (
                      <span key={i}>{e}</span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="font-semibold text-neutral-200">Model Configuration</div>
                  <div className="text-neutral-400">
                    <span className="text-neutral-200">Profile Version:</span> v{userProfile.styleProfile.version}
                  </div>
                  <div className="text-neutral-400">
                    <span className="text-neutral-200">Last Calibrated:</span> {userProfile.styleProfile.updatedAt || 'Recent'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-neutral-500">
                Loading style profile calibration...
              </div>
            )}
          </div>
        )}

        {/* 5. PRIVACY & GOVERNANCE TAB */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div className="border border-neutral-800 rounded-xl p-5 bg-neutral-900/40 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-neutral-400" />
                Data Sovereignty & Privacy Controls
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                You retain complete ownership of all style data, conversation examples, and contact policies. Data can be exported as a portable JSON package or wiped out permanently at any time.
              </p>

              <div className="pt-2 flex flex-wrap gap-4">
                <button
                  onClick={async () => {
                    const res = await apiRequest('/privacy/export', { method: 'POST' });
                    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `mani-annan-data-export-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                  }}
                  className="py-2 px-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium"
                >
                  Export All My Data (JSON)
                </button>

                <button
                  onClick={handleDataPurge}
                  className="py-2 px-4 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-medium"
                >
                  Permanently Purge All Data
                </button>
              </div>
            </div>

            <div className="border border-neutral-800 rounded-xl p-5 bg-neutral-900/20 text-xs text-neutral-400 space-y-2">
              <div className="font-semibold text-neutral-200">Safety & Security Architecture Highlights:</div>
              <ul className="list-disc list-inside space-y-1 text-neutral-400">
                <li>Deterministic safety filters run outside the LLM to prevent monetary hallucination and PII leakage.</li>
                <li>Firebase Admin SDK verifies user identity from tokens; user IDs in request bodies are never trusted.</li>
                <li>Firestore Security Rules strictly enforce per-user isolation under <code className="text-neutral-300 font-mono">users/&#123;uid&#125;</code>.</li>
                <li>Zero reliance on unofficial WhatsApp automation libraries or socket hooks.</li>
              </ul>
            </div>
          </div>
        )}

        {/* 6. WHATSAPP & AUTOMATION TAB */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-6">
            {/* Header & Capability Summary */}
            <div className="border border-neutral-800 rounded-xl p-5 bg-neutral-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Settings className="w-4 h-4 text-neutral-400" />
                    WhatsApp Integration & Mani Automation
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Manage persistent automation, auto-reply rules, and provider connectivity.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2.5 py-1 rounded border border-neutral-800 bg-neutral-950 text-neutral-300">
                    Account: Normal Personal WhatsApp
                  </span>
                </div>
              </div>
            </div>

            {/* Personal WhatsApp Linked Devices QR Connection Card */}
            <div className="border border-neutral-800 rounded-xl p-5 bg-neutral-900/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    Personal WhatsApp Linked Devices Connection
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Pair your personal WhatsApp account using the official Linked Devices QR scan flow.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-mono px-2.5 py-1 rounded border ${
                    qrSession?.status === 'connected'
                      ? 'bg-emerald-950 border-emerald-800 text-emerald-400'
                      : qrSession?.status === 'qr_ready'
                      ? 'bg-blue-950 border-blue-800 text-blue-400'
                      : qrSession?.status === 'not_configured'
                      ? 'bg-amber-950 border-amber-800 text-amber-400'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}>
                    {qrSession?.status ? qrSession.status.toUpperCase().replace(/_/g, ' ') : 'DISCONNECTED'}
                  </span>

                  {qrSession?.status === 'connected' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setShowQRModal(true);
                          initiateQRConnection();
                        }}
                        disabled={qrLoading}
                        className="px-3 py-1.5 rounded-md text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
                      >
                        Reconnect
                      </button>
                      <button
                        onClick={handleDisconnectQR}
                        disabled={qrLoading}
                        className="px-3 py-1.5 rounded-md text-xs font-semibold bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setShowQRModal(true);
                        initiateQRConnection();
                      }}
                      disabled={qrLoading}
                      className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-white text-black hover:bg-neutral-200 transition-colors flex items-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Connect WhatsApp</span>
                    </button>
                  )}
                </div>
              </div>

              {qrSession?.status === 'connected' && (
                <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-neutral-400">Linked Phone: </span>
                    <span className="font-mono text-emerald-400 font-semibold">{qrSession.connectedPhone || 'Personal Account'}</span>
                  </div>
                  {qrSession.connectedAt && (
                    <div className="text-[11px] text-neutral-500 font-mono">
                      Connected: {new Date(qrSession.connectedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Persistent Mani Automation Controls */}
            <div className="border border-neutral-800 rounded-xl p-5 bg-neutral-900/40 space-y-4">
              <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Automation Controls (Backend Persisted)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Global Mani Assistant</div>
                    <div className="text-[11px] text-neutral-400">Master switch for AI processing</div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!automationSettings) return;
                      const updated = {
                        ...automationSettings,
                        maniGlobalEnabled: !automationSettings.maniGlobalEnabled
                      };
                      const res = await apiRequest('/integrations/whatsapp/settings', {
                        method: 'PUT',
                        body: updated
                      });
                      setAutomationSettings(res);
                      setStatusMsg({
                        text: `Global Mani Assistant is now ${res.maniGlobalEnabled ? 'ON' : 'OFF'}.`,
                        type: 'info'
                      });
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold font-mono transition-colors ${
                      automationSettings?.maniGlobalEnabled
                        ? 'bg-emerald-500 text-black'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {automationSettings?.maniGlobalEnabled ? 'MANI ON' : 'MANI OFF'}
                  </button>
                </div>

                <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Emergency Stop</div>
                    <div className="text-[11px] text-neutral-400">Instantly halt all automatic actions</div>
                  </div>
                  <button
                    onClick={async () => {
                      await apiRequest('/integrations/whatsapp/emergency-stop', {
                        method: 'POST'
                      });
                      const refreshed = await apiRequest('/integrations/whatsapp/settings');
                      setAutomationSettings(refreshed);
                      setStatusMsg({ text: 'EMERGENCY STOP ACTIVATED: All automation killed.', type: 'error' });
                    }}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 transition-colors"
                  >
                    TRIGGER STOP
                  </button>
                </div>
              </div>
            </div>

            {/* Real Connection Health & Event Activity */}
            <div className="border border-neutral-800 rounded-xl p-5 bg-neutral-900/40 space-y-4">
              <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center justify-between">
                <span>Real Connection Health & Event Activity</span>
                <span className="text-[10px] text-neutral-500 font-mono">Live Synced</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
                  <div className="text-[11px] text-neutral-400">Last Webhook Received</div>
                  <div className="font-semibold text-white truncate font-mono text-[11px]">
                    {automationSettings?.lastWebhookTimestamp || 'None (Waiting for events)'}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
                  <div className="text-[11px] text-neutral-400">Last Event Processed</div>
                  <div className="font-semibold text-white truncate font-mono text-[11px]">
                    {automationSettings?.lastEventReceived || 'None'}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
                  <div className="text-[11px] text-neutral-400">Last Successful Send</div>
                  <div className="font-semibold text-emerald-400 truncate font-mono text-[11px]">
                    {automationSettings?.lastSuccessfulSend || 'None'}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
                  <div className="text-[11px] text-neutral-400">Last Delivery Failure</div>
                  <div className={`font-semibold truncate font-mono text-[11px] ${
                    automationSettings?.lastDeliveryFailure ? 'text-rose-400' : 'text-neutral-400'
                  }`}>
                    {automationSettings?.lastDeliveryFailure || 'None (Healthy)'}
                  </div>
                </div>
              </div>
            </div>

            {/* Provider Capability Matrix */}
            <div className="border border-neutral-800 rounded-xl p-5 bg-neutral-900/40 space-y-4">
              <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Connection Status & Supported Providers
              </h3>

              <div className="space-y-3">
                {whatsappReport?.supportedProviders?.map((prov: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{prov.displayName}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          prov.status === 'connected_active'
                            ? 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                            : prov.status === 'ready_for_onboarding'
                            ? 'bg-blue-950 border border-blue-800 text-blue-400'
                            : prov.status === 'unavailable_unsupported'
                            ? 'bg-rose-950/80 border border-rose-800 text-rose-400'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {prov.status.toUpperCase().replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400">{prov.description}</p>
                      {prov.riskAssessment && (
                        <p className="text-[11px] text-amber-400/90 font-mono bg-neutral-900/80 px-2 py-1 rounded border border-neutral-800/80">
                          {prov.riskAssessment}
                        </p>
                      )}
                      <div className="text-[11px] text-neutral-500 font-mono">
                        Works when dashboard closed: {prov.worksWhenDashboardClosed ? 'YES (Cloud / Service)' : 'NO (Requires Web/Phone Action)'} •{' '}
                        Requires dedicated number: {prov.requiresDedicatedNumber ? 'YES' : 'NO'}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {prov.status === 'connected_active' && (
                        <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                          <Check className="w-4 h-4" /> Ready to Use
                        </span>
                      )}
                      {prov.status === 'blocked_awaiting_meta_credentials' && (
                        <span className="text-xs font-mono text-amber-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" /> Needs Meta App ID & Token
                        </span>
                      )}
                      {prov.status === 'unavailable_unsupported' && (
                        <span className="text-xs font-mono text-rose-400 flex items-center gap-1.5">
                          <Lock className="w-4 h-4" /> Unsupported by Meta API
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assessment Documentation Notice */}
            <div className="border border-neutral-800 rounded-xl p-5 bg-neutral-900/20 text-xs text-neutral-400 space-y-3">
              <div className="font-semibold text-neutral-200 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Linked Devices & Personal Account Capability Audit
              </div>
              <p className="leading-relaxed">
                <strong className="text-white">Why Linked Devices QR automation is marked UNAVAILABLE:</strong> Meta’s official Linked Devices architecture is designed solely for interactive personal clients (WhatsApp Web/Desktop) using proprietary end-to-end Signal/Noise session synchronization. Meta does not expose an official API or webhook interface for third-party automated message ingestion or dispatching on personal accounts.
              </p>
              <p className="leading-relaxed">
                <strong className="text-white">Ban & Integrity Protection:</strong> Tools claiming QR-based automation utilize reverse-engineered websocket parsers or headless browser automation (e.g., Baileys, whatsapp-web.js). These actively violate Meta’s Terms of Service and trigger automated anti-bot detection leading to irreversible personal number bans. Mani never uses unofficial scraping or fakes connection states.
              </p>
              <div className="pt-2 border-t border-neutral-800/80">
                <div className="text-neutral-300 font-semibold mb-1">Legitimate Alternatives:</div>
                <ul className="list-disc list-inside space-y-1 text-neutral-400">
                  <li><span className="text-white font-medium">Official Cloud API:</span> 24/7 autonomous messaging with dashboard closed. Requires dedicated number on Meta Business Platform.</li>
                  <li><span className="text-white font-medium">Android Notification Companion:</span> Local Android background service that replies to personal notifications via Android RemoteInput while physical phone is on.</li>
                  <li><span className="text-white font-medium">Human-in-the-Loop Studio:</span> Copy/Share sheet directly to personal WhatsApp with 100% safety and zero ban risk.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 7. ACTIVITY & DELIVERY LOGS TAB */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div className="border border-neutral-800 rounded-xl p-5 bg-neutral-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-neutral-400" />
                    Activity, Delivery & Diagnostic Logs
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Immutable per-user audit trail of AI generations, safety checks, approvals, and webhook deliveries.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const logsList = await apiRequest('/privacy/logs');
                      setAuditLogs(logsList || []);
                      setStatusMsg({ text: 'Logs refreshed successfully.', type: 'info' });
                    } catch (e: any) {
                      setStatusMsg({ text: e.message, type: 'error' });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-xs text-neutral-300 font-mono flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </button>
              </div>
            </div>

            <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/20">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400 font-mono">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4">Decision</th>
                    <th className="py-3 px-4">Reason Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80 font-mono text-[11px]">
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-neutral-600">
                        No activity recorded in this session.
                      </td>
                    </tr>
                  )}
                  {auditLogs.map((log: any, idx: number) => (
                    <tr key={log.id || idx} className="hover:bg-neutral-900/40">
                      <td className="py-3 px-4 text-neutral-400">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-white uppercase">{log.eventType}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded ${
                          log.decision === 'completed' || log.decision === 'allowed'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : log.decision === 'blocked'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {log.decision}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-400">{log.reasonCode || 'OK'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* WhatsApp Linked Devices QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 text-neutral-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Connect Personal WhatsApp</h3>
              </div>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Loading State */}
            {qrLoading && (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-neutral-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                <span>Requesting secure session from WhatsApp provider...</span>
              </div>
            )}

            {/* Not Configured State */}
            {!qrLoading && qrSession?.status === 'not_configured' && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>WhatsApp Integration Not Configured</span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-amber-300/90">
                    {qrSession.message || 'WhatsApp Linked Devices QR provider is not configured on the backend. Personal WhatsApp account QR automation is not supported without an approved provider integration.'}
                  </p>
                </div>
                <div className="text-[11px] text-neutral-400 bg-neutral-950 p-3 rounded border border-neutral-800 leading-relaxed">
                  <strong className="text-white">Why personal QR automation is restricted:</strong> Meta provides no official cloud API for personal accounts paired via Linked Devices. Unofficial scraping bots violate Meta Terms of Service and result in permanent phone number bans. Project Mani enforces safety by refusing fake or unsupported automation.
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowQRModal(false)}
                    className="py-2 px-4 rounded bg-neutral-800 text-neutral-200 text-xs hover:bg-neutral-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Error State */}
            {!qrLoading && qrSession?.status === 'error' && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Connection Error</span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-rose-300">
                    {qrSession.message || 'An error occurred while connecting to WhatsApp.'}
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowQRModal(false)}
                    className="py-2 px-4 rounded bg-neutral-800 text-neutral-200 text-xs hover:bg-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={initiateQRConnection}
                    className="py-2 px-4 rounded bg-white text-black font-semibold text-xs hover:bg-neutral-200"
                  >
                    Retry Connection
                  </button>
                </div>
              </div>
            )}

            {/* QR Ready State */}
            {!qrLoading && qrSession?.status === 'qr_ready' && (
              <div className="space-y-4">
                {/* Instructions */}
                <div className="text-xs text-neutral-300 space-y-1 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  <div className="font-semibold text-white mb-1.5">How to Link Your WhatsApp:</div>
                  <ol className="list-decimal list-inside space-y-1 text-neutral-400 text-[11px]">
                    <li>Open <strong>WhatsApp</strong> on your mobile phone</li>
                    <li>Tap <strong>Menu (Android ⋮)</strong> or <strong>Settings (iOS ⚙)</strong></li>
                    <li>Select <strong>Linked Devices</strong></li>
                    <li>Tap <strong>Link a Device</strong></li>
                    <li>Point your phone camera at this QR code to scan</li>
                  </ol>
                </div>

                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-inner">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="WhatsApp Linked Devices QR Code"
                      className="w-56 h-56 object-contain"
                    />
                  ) : (
                    <div className="w-56 h-56 flex items-center justify-center text-black text-xs font-mono">
                      Generating QR...
                    </div>
                  )}
                </div>

                {/* Expiry Timer & Same-Phone Notice */}
                <div className="space-y-2">
                  {qrSecondsRemaining !== null && (
                    <div className="text-center text-xs font-mono">
                      {qrSecondsRemaining > 0 ? (
                        <span className="text-neutral-400">QR expires in <strong className="text-white">{qrSecondsRemaining}s</strong></span>
                      ) : (
                        <span className="text-amber-400">QR code expired. Click Refresh QR.</span>
                      )}
                    </div>
                  )}

                  <div className="text-[11px] text-neutral-400 bg-neutral-950 p-2.5 rounded border border-neutral-800/80 leading-relaxed">
                    <span className="text-amber-400 font-semibold">Same-Phone Notice:</span> If you are viewing Mani on the phone running WhatsApp, you will need a second screen to scan this QR code, or use the OS Share/Clipboard mode.
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                  <button
                    onClick={handleRefreshQR}
                    disabled={qrLoading}
                    className="py-2 px-3 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${qrLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh QR</span>
                  </button>
                  <button
                    onClick={() => setShowQRModal(false)}
                    className="py-2 px-4 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Expired State */}
            {!qrLoading && qrSession?.status === 'expired' && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-amber-950/30 border border-amber-800/80 text-amber-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>QR Code Expired</span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-amber-300">
                    The linking QR code expired to protect your session security. Please request a fresh QR code from the provider.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowQRModal(false)}
                    className="py-2 px-4 rounded bg-neutral-800 text-neutral-300 text-xs hover:bg-neutral-700"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleRefreshQR}
                    className="py-2 px-4 rounded bg-white text-black font-semibold text-xs hover:bg-neutral-200 flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh QR</span>
                  </button>
                </div>
              </div>
            )}

            {/* Connected State */}
            {!qrLoading && qrSession?.status === 'connected' && (
              <div className="space-y-4 py-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center mx-auto text-emerald-400">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">WhatsApp Connected Successfully!</h4>
                  <p className="text-xs text-neutral-400 mt-1 font-mono">
                    Linked: {qrSession.connectedPhone || 'Personal Account'}
                  </p>
                </div>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={() => setShowQRModal(false)}
                    className="py-2 px-6 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
