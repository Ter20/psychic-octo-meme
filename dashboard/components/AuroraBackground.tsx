"use client";
import { motion } from "framer-motion";

export default function AuroraBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Deep base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 10% 20%, rgba(88,28,220,0.18) 0%, transparent 60%)," +
            "radial-gradient(ellipse 80% 60% at 90% 80%, rgba(16,185,129,0.12) 0%, transparent 55%)," +
            "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(59,130,246,0.08) 0%, transparent 70%)," +
            "linear-gradient(160deg, #020308 0%, #060c1a 50%, #020308 100%)",
        }}
      />

      {/* Aurora blobs */}
      <motion.div
        className="aurora-blob"
        style={{
          width: 700, height: 500,
          top: "-10%", left: "-5%",
          background: "radial-gradient(ellipse, rgba(139,92,246,0.28) 0%, rgba(99,102,241,0.15) 40%, transparent 70%)",
        }}
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.08, 0.95, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="aurora-blob"
        style={{
          width: 600, height: 400,
          bottom: "5%", right: "-8%",
          background: "radial-gradient(ellipse, rgba(52,211,153,0.2) 0%, rgba(16,185,129,0.1) 40%, transparent 70%)",
        }}
        animate={{ x: [0, -50, 30, 0], y: [0, 25, -35, 0], scale: [1, 0.92, 1.1, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
      <motion.div
        className="aurora-blob"
        style={{
          width: 500, height: 350,
          top: "30%", right: "20%",
          background: "radial-gradient(ellipse, rgba(59,130,246,0.18) 0%, rgba(37,99,235,0.08) 40%, transparent 70%)",
        }}
        animate={{ x: [0, 30, -40, 0], y: [0, -20, 30, 0], scale: [1, 1.05, 0.98, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 6 }}
      />
      <motion.div
        className="aurora-blob"
        style={{
          width: 400, height: 300,
          top: "55%", left: "25%",
          background: "radial-gradient(ellipse, rgba(251,146,60,0.12) 0%, rgba(245,101,10,0.06) 40%, transparent 70%)",
        }}
        animate={{ x: [0, -20, 35, 0], y: [0, 15, -25, 0], scale: [1, 1.1, 0.94, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 9 }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Scanlines */}
      <div className="scanlines" />
    </div>
  );
}
