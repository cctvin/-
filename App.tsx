
import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Label
} from 'recharts';
import { 
  Activity, 
  Settings, 
  Table as TableIcon, 
  PieChart as ChartIcon, 
  RotateCcw, 
  Zap,
  Info,
  CalendarDays,
  AlertTriangle,
  Download,
  Repeat
} from 'lucide-react';
import { SimulationParams, SimulationOutput } from './types';
import { simulateStoragePlant, calculateAnnualCycles } from './lib/storageSimulation';

const DEFAULT_MONTHLY_CYCLES = [
  1.9835, 1.9835, 0.9836, 0.9836, 0.9836, 0.9836, 1.9835, 1.9835, 0.9836, 0.9836, 0.9836, 0.9836
];

// 自定义图表点组件，用于标记更换年份
const CustomizedDot = (props: any) => {
  const { cx, cy, payload } = props;

  if (payload.isReplaced) {
    const color = payload.isForced ? "#2563eb" : "#f97316"; // 计划更换用蓝色，阈值更换用橙色
    return (
      <g>
        <circle cx={cx} cy={cy} r={7} fill={color} stroke="#fff" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={11} fill="none" stroke={color} strokeWidth={1} strokeDasharray="3 3" />
        {/* 如果是因性能衰减触发，加一个警示小圆点 */}
        {!payload.isForced && <circle cx={cx} cy={cy} r={2} fill="#fff" />}
      </g>
    );
  }

  return <circle cx={cx} cy={cy} r={4} fill="#3b82f6" stroke="#fff" strokeWidth={1} />;
};

const App: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>({
    nominalCapacity: 300,
    operationYears: 25,
    dod: 0.95,
    systemEfficiency: 0.86,
    firstYearDegradation: 0.0,
    annualDegradation: 0.02,
    replaceThreshold: 0.80,
    useActualMonthDays: true,
    monthlyCycles: [...DEFAULT_MONTHLY_CYCLES],
    forcedReplacementYears: []
  });

  const [forcedInput, setForcedInput] = useState("");
  const [simulationResult, setSimulationResult] = useState<SimulationOutput | null>(null);

  const runSimulation = () => {
    const result = simulateStoragePlant(params);
    setSimulationResult(result);
  };

  useEffect(() => {
    runSimulation();
  }, []);

  const handleCycleChange = (index: number, value: string) => {
    const val = parseFloat(value) || 0;
    const newCycles = [...params.monthlyCycles];
    newCycles[index] = val;
    setParams({ ...params, monthlyCycles: newCycles });
  };

  const handleForcedYearsChange = (value: string) => {
    setForcedInput(value);
    const years = value.split(',')
      .map(v => parseInt(v.trim()))
      .filter(v => !isNaN(v) && v > 0);
    setParams({ ...params, forcedReplacementYears: years });
  };

  const resetCycles = () => {
    setParams({ ...params, monthlyCycles: [...DEFAULT_MONTHLY_CYCLES] });
  };

  // 导出 CSV 功能
  const exportToCSV = () => {
    if (!simulationResult) return;
    
    const headers = ["年份", "电池役龄", "年初SOH(%)", "年末SOH(%)", "当年循环", "放电量(MWh)", "维护状态"];
    const rows = simulationResult.yearlyResults.map(r => [
      `第${r.year}年`,
      `${r.batteryAge}年`,
      (r.sohStart * 100).toFixed(1),
      (r.sohEnd * 100).toFixed(1),
      Math.round(r.annualCycles),
      r.annualEnergy.toFixed(0),
      r.isForced ? "计划更换" : (r.isReplaced ? "阈值更换" : "运行中")
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // 添加 BOM 头 (UTF-8 BOM) 以确保 Excel 正确识别中文
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `储能模拟结果_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = useMemo(() => {
    if (!simulationResult) return [];
    return simulationResult.yearlyResults.map(r => ({
      year: `第${r.year}年`,
      soh: parseFloat((r.sohEnd * 100).toFixed(1)),
      energy: Math.round(r.annualEnergy / 1000), // 转换为 GWh
      isReplaced: r.isReplaced,
      isForced: r.isForced
    }));
  }, [simulationResult]);

  // 计算年充放总次数
  const annualTotalCycles = useMemo(() => {
    return calculateAnnualCycles(params.monthlyCycles, params.useActualMonthDays);
  }, [params.monthlyCycles, params.useActualMonthDays]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap className="text-yellow-400 w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">储能电站全生命周期模拟器</h1>
              <p className="text-xs text-slate-400">专业级储能系统性能与电量预测</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <div className="text-right">
              <span className="block text-xs uppercase text-slate-500 font-semibold tracking-wider">系统状态</span>
              <span className="text-sm font-medium text-green-400 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                模拟引擎已就绪
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2 font-semibold text-slate-700">
                <Settings className="w-4 h-4" />
                <span>核心模拟参数</span>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">额定容量 (MWh)</label>
                  <input 
                    type="number" 
                    value={params.nominalCapacity} 
                    onChange={(e) => setParams({...params, nominalCapacity: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">运行年限 (年)</label>
                  <input 
                    type="number" 
                    value={params.operationYears} 
                    onChange={(e) => setParams({...params, operationYears: parseInt(e.target.value) || 1})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">放电深度 (DOD)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={params.dod} 
                    onChange={(e) => setParams({...params, dod: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">综合效率</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={params.systemEfficiency} 
                    onChange={(e) => setParams({...params, systemEfficiency: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">首年衰减率</label>
                  <input 
                    type="number" 
                    step="0.001"
                    value={params.firstYearDegradation} 
                    onChange={(e) => setParams({...params, firstYearDegradation: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">后续年均衰减率</label>
                  <input 
                    type="number" 
                    step="0.001"
                    value={params.annualDegradation} 
                    onChange={(e) => setParams({...params, annualDegradation: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">电池更换 SOH 阈值</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={params.replaceThreshold} 
                  onChange={(e) => setParams({...params, replaceThreshold: parseFloat(e.target.value) || 0})}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="flex items-center space-x-1 block text-xs font-bold text-slate-700 mb-2 uppercase tracking-tight">
                  <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
                  <span>计划内强制更换年份</span>
                </label>
                <input 
                  type="text" 
                  placeholder="例如: 8, 16 (逗号分隔)"
                  value={forcedInput}
                  onChange={(e) => handleForcedYearsChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="mt-1.5 text-[10px] text-slate-400">在指定年份的年初强制重置电池状态</p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input 
                  type="checkbox" 
                  checked={params.useActualMonthDays} 
                  onChange={(e) => setParams({...params, useActualMonthDays: e.target.checked})}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-600">按每月实际天数计算电量</span>
              </div>

              <button 
                onClick={runSimulation}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <Activity className="w-5 h-5" />
                <span>开始模拟计算</span>
              </button>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2 font-semibold text-slate-700">
                <ChartIcon className="w-4 h-4" />
                <span>月度循环策略</span>
              </div>
              <button onClick={resetCycles} title="重置为默认策略" className="text-blue-600 hover:text-blue-800 transition-colors">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4 bg-slate-900 rounded-lg p-4 text-white flex items-center justify-between shadow-inner">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Repeat className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">年充放总次数</p>
                    <p className="text-2xl font-black">{Math.round(annualTotalCycles)} <span className="text-xs font-normal text-slate-400 tracking-normal">次/年</span></p>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 mb-3 leading-tight uppercase font-bold tracking-widest text-center">各月日均等效循环次数</p>
              <div className="grid grid-cols-4 gap-2">
                {params.monthlyCycles.map((cycle, idx) => (
                  <div key={idx} className="space-y-1">
                    <label className="block text-[10px] text-slate-500 text-center">{idx + 1}月</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={cycle} 
                      onChange={(e) => handleCycleChange(idx, e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-xs text-center focus:ring-1 focus:ring-blue-400 outline-none font-mono"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  当前策略下，电站每年将进行累计约 <strong>{Math.round(annualTotalCycles)}</strong> 次完整充放电循环。
                </p>
              </div>
            </div>
          </section>
        </aside>

        <div className="lg:col-span-8 space-y-6">
          {simulationResult && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">全周期总放电量</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-black text-slate-800">
                      {simulationResult.summary.totalEnergyBillionKWh.toFixed(2)}
                    </span>
                    <span className="text-sm font-semibold text-slate-500">亿 kWh</span>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">年均放电量</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-black text-blue-600">
                      {Math.round(simulationResult.summary.avgAnnualEnergyMWh / 1000)}
                    </span>
                    <span className="text-sm font-semibold text-slate-500">GWh/年</span>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">电池更换频率</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-black text-orange-500">
                      {simulationResult.summary.replacementYears.length}
                    </span>
                    <span className="text-sm font-semibold text-slate-500">次</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {simulationResult.summary.replacementYears.map(yr => (
                      <span key={yr} className={`px-1.5 py-0.5 text-[10px] rounded font-bold border ${simulationResult.yearlyResults[yr-1]?.isForced ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>第 {yr} 年</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-800 flex items-center space-x-2">
                    <ChartIcon className="w-5 h-5 text-blue-500" />
                    <span>SOH 与年放电量变化趋势</span>
                  </h3>
                  <div className="flex items-center space-x-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <div className="flex items-center space-x-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                      <span>阈值更换点</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                      <span>计划更换点</span>
                    </div>
                  </div>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                      <YAxis yAxisId="left" orientation="left" domain={[0, 105]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}
                        cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                        formatter={(value, name, props) => {
                          if (name === "健康度 (SOH %)") return [`${value}%`, name];
                          return [`${value} GWh`, name];
                        }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      
                      {/* 渲染更换阈值参考线 */}
                      <ReferenceLine 
                        yAxisId="left" 
                        y={params.replaceThreshold * 100} 
                        stroke="#ef4444" 
                        strokeDasharray="5 5"
                        strokeWidth={1.5}
                      >
                        <Label 
                          value="更换阈值" 
                          position="insideBottomLeft" 
                          fill="#ef4444" 
                          fontSize={10} 
                          fontWeight="bold" 
                          dy={-5}
                        />
                      </ReferenceLine>

                      <Line 
                        yAxisId="left" 
                        type="monotone" 
                        dataKey="soh" 
                        name="健康度 (SOH %)" 
                        stroke="#3b82f6" 
                        strokeWidth={3} 
                        dot={<CustomizedDot />}
                        activeDot={{ r: 8, strokeWidth: 0 }} 
                      />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="energy" 
                        name="年放电量 (GWh)" 
                        stroke="#10b981" 
                        strokeWidth={2} 
                        strokeDasharray="5 5"
                        dot={{ r: 3, fill: '#10b981' }} 
                        activeDot={{ r: 6 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start space-x-3">
                  <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    <strong>可视化说明：</strong> 图表上的实心彩色点表示电池发生更换。
                    <span className="text-orange-600 font-bold ml-1">橙色圆圈</span> 表示电池 SOH 跌破了 {params.replaceThreshold * 100}% 的性能阈值触发的更换；
                    <span className="text-blue-600 font-bold ml-1">蓝色圆圈</span> 表示在您指定的计划年份进行的强制更换。
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-bold text-slate-800 uppercase tracking-tight">
                    <TableIcon className="w-5 h-5 text-blue-600" />
                    <span>逐年模拟明细数据</span>
                  </div>
                  <button 
                    onClick={exportToCSV}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>导出数据 (CSV)</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3">年份</th>
                        <th className="px-6 py-3">电池役龄</th>
                        <th className="px-6 py-3 text-center">年初 SOH</th>
                        <th className="px-6 py-3 text-center">年末 SOH</th>
                        <th className="px-6 py-3 text-center">当年循环</th>
                        <th className="px-6 py-3 text-right">放电量 (MWh)</th>
                        <th className="px-6 py-3 text-center">维护状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {simulationResult.yearlyResults.map((r) => (
                        <tr key={r.year} className={`hover:bg-slate-50 transition-colors ${r.isReplaced ? (r.isForced ? 'bg-blue-50/30' : 'bg-orange-50/50') : ''}`}>
                          <td className="px-6 py-3 font-bold text-slate-700 italic">第 {r.year} 年</td>
                          <td className="px-6 py-3 text-slate-600 text-center">{r.batteryAge} 年</td>
                          <td className="px-6 py-3 text-center">{(r.sohStart * 100).toFixed(1)}%</td>
                          <td className="px-6 py-3 text-center">
                            <span className={`font-medium ${r.sohEnd < params.replaceThreshold ? 'text-red-500 font-bold' : ''}`}>
                              {(r.sohEnd * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-3 text-slate-600 font-mono text-center">{Math.round(r.annualCycles)}</td>
                          <td className="px-6 py-3 font-semibold text-slate-800 text-right">{r.annualEnergy.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                          <td className="px-6 py-3 text-center">
                            {r.isForced ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase shadow-sm">
                                计划更换
                              </span>
                            ) : r.isReplaced ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500 text-white uppercase animate-pulse">
                                触发更换
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase">
                                运行中
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-400 font-medium">
            储能电站全生命周期模拟器 &copy; {new Date().getFullYear()} - 专业资产管理与收益评估工具
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
