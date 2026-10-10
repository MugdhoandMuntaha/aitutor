"use client";

import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Timer, ChevronUp, ChevronDown } from "lucide-react";

export function FloatingPomodoro() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");
  const [isExpanded, setIsExpanded] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      if (mode === "work") {
        setCompletedSessions((c) => c + 1);
        setMode("break");
        setTimeLeft(5 * 60);
      } else {
        setMode("work");
        setTimeLeft(25 * 60);
      }
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode]);

  const toggleRun = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === "work" ? 25 * 60 : 5 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <aside
      aria-label="Pomodoro Timer"
      className="fixed bottom-5 right-5 z-40 flex flex-col items-end pointer-events-auto"
    >
      {isExpanded ? (
        <div className="bg-slate-900/95 border border-slate-800 backdrop-blur-xl rounded-2xl p-4 shadow-2xl shadow-indigo-950/40 w-64 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${mode === "work" ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`} />
              <span className="text-xs font-semibold text-white capitalize">{mode} Session</span>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center py-2">
            <div className="text-3xl font-mono font-bold tracking-tight text-white">{timeFormatted}</div>
            <p className="text-[10px] text-slate-400 mt-1">Completed today: {completedSessions} Pomodoros</p>
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={toggleRun}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isRunning
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
                  : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
              }`}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isRunning ? "Pause" : "Start"}
            </button>
            <button
              type="button"
              onClick={resetTimer}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition border border-slate-800 cursor-pointer"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className={`flex items-center gap-2.5 px-3.5 py-2 rounded-full border backdrop-blur-md shadow-xl transition-all cursor-pointer ${
            isRunning
              ? "bg-rose-950/70 border-rose-500/50 text-rose-300 shadow-rose-950/30"
              : "bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <Timer className={`w-4 h-4 ${isRunning ? "text-rose-400 animate-spin" : "text-indigo-400"}`} />
          <span className="font-mono text-xs font-semibold">{timeFormatted}</span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        </button>
      )}
    </aside>
  );
}
