import React, { useState } from 'react';
import { X, CheckCircle2, Download, Phone, Calendar, ArrowRight, Sparkles } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  type: 'consult' | 'starter' | null;
  onClose: () => void;
}

export function ConsultationModal({ isOpen, type, onClose }: ModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    focus: 'Voice AI & Lead Acceleration (V.I.R.A.)',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen || !type) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleDownload = () => {
    setDownloaded(true);
    // Create a downloadable luxury text/markdown guide file
    const content = `# AIX: ARTIFICIAL INTELLIGENCE XTREME
## Executive Architecture & Systems Blueprint

Chapter 1: The Mirror of Intent (Thought Engineering)
- Prompt architecture mirrors cognitive clarity.
- Formulate inputs through structured context, deterministic constraints, and zero ambiguity.

Chapter 2: The Speed of Response (V.I.R.A. Inbound Engine)
- Sub-60s lead response guarantees a 391% lift in qualified appointments.
- 24/7 Voice AI triage with direct calendar synchronization.
- Hotline: (586) 619-4612

Chapter 3: Systems Mastery (Regional Dallas Intelligence)
- Granular business intelligence with verified composability scoring.
- Elimination of data silos across lead acquisition and CRM fulfillment.

Chapter 4: Integration Roadmap
- Step 1: Inbound voice gateway deployment.
- Step 2: RAG business intelligence ingestion.
- Step 3: Executive autonomous workflow synthesis.

© Artificial Intelligence Xtreme (AIX). All rights reserved.
`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AIX-Executive-Systems-Blueprint.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="aix-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="aix-modal-card"
        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-[#cd7f32]/40 bg-[#0b0c12] p-6 text-white shadow-2xl shadow-[#cd7f32]/10"
      >
        {/* Accent Glow Top Border */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#cd7f32] to-[#0066ff]" />

        <button
          id="close-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {type === 'consult' ? (
          <div>
            {!submitted ? (
              <>
                <div className="mb-5">
                  <span className="text-[11px] font-mono tracking-widest text-[#cd7f32] uppercase">
                    Chapter IV · Direct Access
                  </span>
                  <h3 className="text-2xl font-serif tracking-tight mt-1 text-white">
                    Book AIX Consultation
                  </h3>
                  <p className="text-sm text-neutral-400 mt-1">
                    Connect with AIX systems architects to deploy autonomous voice agents and regional intelligence pipelines.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">
                      Full Name
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Terrence Vance"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-md border border-neutral-800 bg-[#12141c] px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-[#cd7f32] focus:outline-none focus:ring-1 focus:ring-[#cd7f32]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">
                        Work Email
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="you@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-md border border-neutral-800 bg-[#12141c] px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-[#cd7f32] focus:outline-none focus:ring-1 focus:ring-[#cd7f32]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">
                        Company / Org
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Apex Media Dallas"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full rounded-md border border-neutral-800 bg-[#12141c] px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-[#cd7f32] focus:outline-none focus:ring-1 focus:ring-[#cd7f32]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">
                      Primary Objective
                    </label>
                    <select
                      value={formData.focus}
                      onChange={(e) => setFormData({ ...formData, focus: e.target.value })}
                      className="w-full rounded-md border border-neutral-800 bg-[#12141c] px-3 py-2 text-sm text-white focus:border-[#cd7f32] focus:outline-none focus:ring-1 focus:ring-[#cd7f32]"
                    >
                      <option value="Voice AI & Lead Acceleration (V.I.R.A.)">
                        V.I.R.A. Sub-60s Inbound Voice Engine
                      </option>
                      <option value="Systems Mastery & Dallas Market Intelligence">
                        Systems Mastery & Regional Intelligence
                      </option>
                      <option value="Thought Engineering & Custom AI Models">
                        EDUCE Thought Engineering & Custom Pipelines
                      </option>
                      <option value="Enterprise Architecture Integration">
                        Full Enterprise AIX Infrastructure Deployment
                      </option>
                    </select>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <a
                      href="tel:5866194612"
                      className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Direct Test: (586) 619-4612
                    </a>

                    <button
                      id="submit-consultation-btn"
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-md bg-[#cd7f32] hover:bg-[#b86f2a] px-5 py-2.5 text-sm font-semibold text-black transition cursor-pointer"
                    >
                      <span>Request Session</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="py-6 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#cd7f32]/20 flex items-center justify-center border border-[#cd7f32]/40 text-[#cd7f32]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-serif font-bold text-white">
                    Consultation Requested
                  </h4>
                  <p className="text-sm text-neutral-300 mt-2 max-w-sm mx-auto">
                    Thank you, {formData.name}. An AIX Senior Systems Architect will review {formData.company}&apos;s specifications and reach out within 4 business hours.
                  </p>
                </div>
                <div className="p-3.5 rounded-lg bg-[#141722] border border-neutral-800 text-xs text-neutral-300 text-left">
                  <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
                    Immediate Inbound Demonstration
                  </div>
                  You can test V.I.R.A. right now by dialing <a href="tel:5866194612" className="text-sky-400 font-bold underline">(586) 619-4612</a> to experience autonomous lead qualification in real time.
                </div>
                <button
                  onClick={onClose}
                  className="rounded-md bg-neutral-800 hover:bg-neutral-700 px-6 py-2 text-sm text-white transition cursor-pointer"
                >
                  Return to Sculpture Gallery
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-mono tracking-widest text-[#0088ff] uppercase">
                Resource Package
              </span>
              <h3 className="text-2xl font-serif tracking-tight mt-1 text-white">
                AIX Starter Blueprint
              </h3>
              <p className="text-sm text-neutral-400 mt-1">
                The comprehensive architectural breakdown of Thought Engineering, V.I.R.A. speed protocols, and Dallas regional intelligence sourcing.
              </p>
            </div>

            <div className="space-y-2.5 bg-[#12141c] p-3.5 rounded-lg border border-neutral-800 text-xs text-neutral-300">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Calendar className="w-4 h-4 text-[#cd7f32]" />
                Included Specifications:
              </div>
              <ul className="list-disc list-inside space-y-1 text-neutral-400 pl-1">
                <li>EDUCE 5-Tier Prompt Architecture Framework</li>
                <li>Sub-60s Inbound Voice AI Pipeline Diagram</li>
                <li>Regional Dallas Market Composability Matrix</li>
                <li>Zero-Latency Lead Qualification Checklist</li>
              </ul>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                id="download-blueprint-btn"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-md bg-[#0066ff] hover:bg-[#0055dd] px-5 py-2.5 text-sm font-semibold text-white transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{downloaded ? 'Downloaded ✓' : 'Download Blueprint (.MD)'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
