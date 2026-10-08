import React, { useState } from 'react';
import { CHAPTERS, Chapter } from '../types';
import {
  Volume2,
  VolumeX,
  Phone,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Compass,
} from 'lucide-react';
import { galleryAudio } from '../utils/audio';

interface OverlayUIProps {
  activeChapter: number;
  onSelectChapter: (chapterId: number) => void;
  onOpenConsult: () => void;
  onOpenStarter: () => void;
  isInspecting: boolean;
  onToggleInspect: () => void;
  scrollProgress: number;
}

export function OverlayUI({
  activeChapter,
  onSelectChapter,
  onOpenConsult,
  onOpenStarter,
  isInspecting,
  onToggleInspect,
  scrollProgress,
}: OverlayUIProps) {
  const [soundActive, setSoundActive] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const currentChapter: Chapter = CHAPTERS[activeChapter - 1] || CHAPTERS[0];

  const toggleSound = () => {
    const newState = galleryAudio.toggle();
    setSoundActive(newState);
  };

  const copyPhoneNumber = () => {
    navigator.clipboard.writeText('(586) 619-4612');
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 md:p-8 select-none">
      {/* Top Navigation Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 pointer-events-auto bg-black/40 backdrop-blur-md px-5 py-3 rounded-xl border border-neutral-800/80 shadow-lg">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#cd7f32] to-[#804a1b] flex items-center justify-center font-bold text-black text-sm shadow-md shadow-[#cd7f32]/20 font-serif">
            X
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-[0.25em] text-[#cd7f32] m-0 font-serif">
              AIX
            </h1>
            <p className="text-[10px] tracking-wider text-neutral-400 m-0 uppercase font-mono">
              Artificial Intelligence Xtreme
            </p>
          </div>
        </div>

        {/* Chapter Quick Selector for desktop */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-neutral-900/80 p-1 rounded-lg border border-neutral-800 text-xs">
          {CHAPTERS.map((ch) => {
            const isActive = ch.id === activeChapter;
            return (
              <button
                key={ch.id}
                id={`nav-chapter-${ch.id}`}
                onClick={() => {
                  onSelectChapter(ch.id);
                  galleryAudio.playChapterTone(ch.id);
                }}
                className={`px-3 py-1.5 rounded-md font-mono tracking-wide transition-all ${
                  isActive
                    ? 'bg-[#cd7f32] text-black font-semibold shadow'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                {ch.roman}. {ch.title.split(' ')[0]}
              </button>
            );
          })}
        </nav>

        {/* Action Links & Controls */}
        <div className="flex items-center gap-3 text-xs md:text-sm">
          {/* Audio Toggle */}
          <button
            id="toggle-audio-btn"
            onClick={toggleSound}
            title={soundActive ? 'Disable Ambient Audio' : 'Enable Ambient Audio'}
            className={`p-2 rounded-lg border transition ${
              soundActive
                ? 'border-[#cd7f32] text-[#cd7f32] bg-[#cd7f32]/10'
                : 'border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Orbit Inspect Mode Toggle */}
          <button
            id="toggle-inspect-btn"
            onClick={onToggleInspect}
            title="Inspect 3D sculpture in 360 degrees"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition ${
              isInspecting
                ? 'border-sky-500 text-sky-400 bg-sky-950/40'
                : 'border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isInspecting ? 'Free Look Active' : 'Inspect 3D'}</span>
          </button>

          {/* External Ecosystem Links */}
          <a
            href="https://aix-io.com"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-neutral-300 hover:text-white transition tracking-wide text-xs font-mono"
          >
            <span>aix-io.com</span>
            <ExternalLink className="w-3 h-3 text-neutral-500" />
          </a>

          <a
            href="https://aix-app.org"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0066ff] hover:bg-[#0052cc] text-white font-semibold transition text-xs shadow-md shadow-blue-900/30"
          >
            <span>LAUNCH APP</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Free look inspection banner */}
      {isInspecting && (
        <div className="pointer-events-auto mx-auto my-2 px-4 py-1.5 rounded-full bg-sky-950/80 border border-sky-500/50 backdrop-blur-md text-sky-300 text-xs font-mono flex items-center gap-2 shadow-lg animate-fade-in">
          <Compass className="w-3.5 h-3.5 animate-spin text-sky-400" />
          <span>360° Inspection Active — Drag with mouse/touch to orbit sculpture</span>
          <button
            onClick={onToggleInspect}
            className="ml-2 text-white hover:text-sky-200 underline text-[11px] cursor-pointer"
          >
            Resume Path
          </button>
        </div>
      )}

      {/* Main Dynamic Chapter Card Overlay */}
      <div className="my-auto pointer-events-auto max-w-xl transition-all duration-500">
        <div
          id="chapter-info-card"
          className="relative overflow-hidden rounded-2xl border border-neutral-800/90 bg-[#090a10]/85 p-6 md:p-8 backdrop-blur-xl shadow-2xl shadow-black/80"
          style={{
            borderLeft: '4px solid #cd7f32',
          }}
        >
          {/* Subtle Roman Numeral Background Watermark */}
          <div className="absolute right-4 top-2 text-7xl md:text-8xl font-serif font-black text-neutral-800/20 select-none pointer-events-none">
            {currentChapter.roman}
          </div>

          {/* Chapter Metadata Header */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-mono font-bold tracking-[0.2em] text-[#cd7f32] uppercase">
              {currentChapter.subtitle}
            </span>
            {currentChapter.metric && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#cd7f32]/15 text-[#e5a663] border border-[#cd7f32]/30">
                {currentChapter.metric}
              </span>
            )}
          </div>

          {/* Chapter Title */}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-light tracking-tight text-white mb-3">
            {currentChapter.title}
          </h2>

          {/* Chapter Description */}
          <p className="text-sm md:text-base text-neutral-300 leading-relaxed mb-5 font-sans">
            {currentChapter.desc}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {currentChapter.tags.map((tag, i) => (
              <span
                key={i}
                className="text-[11px] font-mono text-neutral-400 bg-neutral-900/90 px-2.5 py-1 rounded-md border border-neutral-800"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Chapter Specific Actions */}
          {/* Chapter 2: V.I.R.A. Live Test */}
          {activeChapter === 2 && (
            <div className="mt-2 p-3.5 rounded-xl bg-gradient-to-r from-[#0d1f33] to-[#0f172a] border border-sky-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shrink-0 animate-pulse">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-sky-300 uppercase tracking-wider">
                    Live V.I.R.A. Demonstration Line
                  </div>
                  <a
                    href="tel:5866194612"
                    className="text-base font-bold text-white hover:text-sky-300 transition underline underline-offset-2"
                  >
                    (586) 619-4612
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="copy-phone-btn"
                  onClick={copyPhoneNumber}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-950/80 hover:bg-sky-900 border border-sky-700/50 text-sky-200 text-xs font-mono transition"
                >
                  {copiedPhone ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <a
                  href="tel:5866194612"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black text-xs font-bold transition shadow"
                >
                  <span>Call Now</span>
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Chapter 4: Integration Invitation CTA */}
          {activeChapter === 4 && (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                id="book-consultation-btn"
                onClick={onOpenConsult}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#cd7f32] hover:bg-[#df9144] text-black font-serif font-bold text-xs md:text-sm tracking-wider uppercase transition shadow-lg shadow-[#cd7f32]/20 cursor-pointer"
              >
                <span>Book AIX Consultation</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="starter-resource-btn"
                onClick={onOpenStarter}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#0066ff] hover:bg-[#1a75ff] text-white font-serif font-semibold text-xs md:text-sm tracking-wider uppercase transition shadow-lg shadow-blue-900/30 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Download Starter Blueprint</span>
              </button>
            </div>
          )}

          {/* Chapter 1 & 3 Next Chapter Helper */}
          {(activeChapter === 1 || activeChapter === 3) && (
            <div className="mt-2 flex items-center justify-between border-t border-neutral-800/80 pt-3 text-xs text-neutral-400">
              <span className="font-mono">
                {activeChapter === 1 ? 'Next: Sub-60s Inbound Voice AI' : 'Next: White-Glove Enterprise Integration'}
              </span>
              <button
                onClick={() => {
                  const next = activeChapter + 1;
                  onSelectChapter(next);
                  galleryAudio.playChapterTone(next);
                }}
                className="inline-flex items-center gap-1 text-[#cd7f32] hover:text-[#e5a663] font-semibold transition"
              >
                <span>Proceed</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Chapter Navigation & Progress */}
      <footer className="flex flex-wrap items-end justify-between gap-4 pointer-events-auto bg-black/40 backdrop-blur-md px-5 py-3 rounded-xl border border-neutral-800/80">
        {/* Helper Guidance */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
            <span className="inline-block w-2 h-2 rounded-full bg-[#cd7f32] animate-ping" />
            <span className="hidden sm:inline">Scroll or step to travel along the monument gallery</span>
            <span className="sm:hidden">Swipe or tap chapters to travel</span>
          </div>

          {/* Prev / Next Step Controls */}
          <div className="flex items-center gap-1 ml-2">
            <button
              id="prev-chapter-btn"
              disabled={activeChapter === 1}
              onClick={() => {
                const prev = Math.max(1, activeChapter - 1);
                onSelectChapter(prev);
                galleryAudio.playChapterTone(prev);
              }}
              className="p-1 rounded bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
              aria-label="Previous Chapter"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-neutral-400 px-1">
              {activeChapter} / 4
            </span>
            <button
              id="next-chapter-btn"
              disabled={activeChapter === 4}
              onClick={() => {
                const next = Math.min(4, activeChapter + 1);
                onSelectChapter(next);
                galleryAudio.playChapterTone(next);
              }}
              className="p-1 rounded bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
              aria-label="Next Chapter"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visual Progress Bar & Clickable Chapter Dots */}
        <div className="flex items-center gap-2">
          {CHAPTERS.map((ch) => {
            const isActive = ch.id === activeChapter;
            return (
              <button
                key={ch.id}
                id={`footer-chapter-pill-${ch.id}`}
                onClick={() => {
                  onSelectChapter(ch.id);
                  galleryAudio.playChapterTone(ch.id);
                }}
                className="group relative flex flex-col items-center py-1 transition cursor-pointer"
              >
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'w-10 bg-[#cd7f32] shadow-sm shadow-[#cd7f32]'
                      : 'w-3.5 bg-neutral-700 hover:bg-neutral-500'
                  }`}
                />
                <span
                  className={`text-[9px] font-mono mt-1 transition ${
                    isActive ? 'text-[#cd7f32] font-bold' : 'text-neutral-500 group-hover:text-neutral-300'
                  }`}
                >
                  {ch.roman}
                </span>
              </button>
            );
          })}
        </div>
      </footer>
    </div>
  );
}
