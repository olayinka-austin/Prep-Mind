import React from "react";
import { ExamResult } from "../types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { Trophy, TrendingUp, Award, Clock, ThumbsUp, Activity } from "lucide-react";

interface HistoryDashboardProps {
  results: ExamResult[];
}

export default function HistoryDashboard({ results }: HistoryDashboardProps) {
  if (results.length === 0) {
    return null;
  }

  // Calculate metrics
  const totalAttempts = results.length;
  const averageScore = Math.round(
    results.reduce((acc, r) => acc + r.score, 0) / totalAttempts
  );
  const highestScore = Math.max(...results.map((r) => r.score));
  const practiceCount = results.filter((r) => r.mode === "practice").length;
  const examCount = results.filter((r) => r.mode === "exam").length;
  const passCount = results.filter((r) => r.score >= 50).length;
  const passRate = Math.round((passCount / totalAttempts) * 100);

  // Prep chart data (sorted oldest to newest to show progression)
  let cumulativeTotal = 0;
  const chartData = [...results]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((res, index) => {
      cumulativeTotal += res.score;
      const runningAverage = Math.round(cumulativeTotal / (index + 1));
      return {
        index: index + 1,
        attemptLabel: `#${index + 1}`,
        date: new Date(res.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        score: res.score,
        average: runningAverage,
        subject: res.subjectTitle,
        mode: res.mode,
      };
    });

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5 max-w-[220px]">
          <div className="flex justify-between items-center border-b border-white/10 pb-1">
            <span className="font-bold text-slate-300">Attempt {data.index}</span>
            <span className="text-[10px] text-slate-400 font-medium">{data.date}</span>
          </div>
          <p className="font-semibold text-white leading-tight line-clamp-1">
            {data.subject}
          </p>
          <div className="pt-1.5 space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Score:</span>
              <span className="font-bold text-blue-400">{data.score}%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Avg Progress:</span>
              <span className="font-bold text-amber-400">{data.average}%</span>
            </div>
            <div className="flex justify-between gap-4 pt-1">
              <span className="text-slate-400">Mode:</span>
              <span className={`px-1.5 py-0.2 bg-white/10 text-[9px] rounded-sm uppercase font-bold ${
                data.mode === "exam" ? "text-rose-300" : "text-blue-300"
              }`}>
                {data.mode}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6" id="performance-dashboard">
      {/* Stats Cards Bento-grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Avg Score */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4 shadow-2xs hover:shadow-xs transition duration-200">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Score</p>
            <h3 className="text-2xl font-extrabold text-slate-800 leading-tight">
              {averageScore}%
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Overall mean performance</p>
          </div>
        </div>

        {/* Card 2: Highest Score */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4 shadow-2xs hover:shadow-xs transition duration-200">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peak Score</p>
            <h3 className="text-2xl font-extrabold text-slate-800 leading-tight">
              {highestScore}%
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Your highest single test</p>
          </div>
        </div>

        {/* Card 3: Pass Rate */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4 shadow-2xs hover:shadow-xs transition duration-200">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CBT Pass Rate</p>
            <h3 className="text-2xl font-extrabold text-slate-800 leading-tight">
              {passRate}%
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Scores 50% and above</p>
          </div>
        </div>

        {/* Card 4: Total Attempts */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4 shadow-2xs hover:shadow-xs transition duration-200">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Attempts</p>
            <h3 className="text-2xl font-extrabold text-slate-800 leading-tight">
              {totalAttempts}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {practiceCount} Practice • {examCount} Exam
            </p>
          </div>
        </div>
      </div>

      {/* Recharts Progress Graph */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">CBT Progress Analytics</h3>
            <p className="text-xs text-slate-500">Chronological analysis of test scores and cumulative performance trends</p>
          </div>
          <div className="flex gap-4 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-blue-600"></span>
              Attempt Score
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-amber-500"></span>
              Moving Average
            </span>
          </div>
        </div>

        <div className="h-[280px] w-full" id="recharts-progress-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="attemptLabel"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }} />
              
              {/* Pass score indicator at 50% */}
              <ReferenceLine y={50} stroke="#e2e8f0" strokeDasharray="4 4" label={{ value: 'Pass Line (50%)', fill: '#94a3b8', fontSize: 10, position: 'insideBottomRight' }} />

              <Line
                name="Score"
                type="monotone"
                dataKey="score"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
                activeDot={{ r: 6 }}
              />
              <Line
                name="Cumulative Average"
                type="monotone"
                dataKey="average"
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
