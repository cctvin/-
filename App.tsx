
import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  Activity, 
  Settings, 
  Table as TableIcon, 
  PieChart as ChartIcon, 
  RotateCcw, 
  Zap,
  Info
} from 'lucide-react';
import { SimulationParams, SimulationOutput } from './types';
import { simulateStoragePlant } from './lib/storageSimulation';

const DEFAULT_MONTHLY_CYCLES = [
  1.9835, 1.9835, 0.9836, 0.9836, 0.9836, 0.9836, 1.9835, 1.9835, 0.9836, 0.9836, 0.9836, 0.9836
];

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
    monthlyCycles: [...DEFAULT_MONTHLY_CYCLES]
  });

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

  const resetCycles = () => {
    setParams({ ...params, monthlyCycles: [...DEFAULT_MONTHLY_CYCLES] });
  };

  const chartData = useMemo(() => {
    if (!simulationResult) return [];
    return simulationResult.yearlyResults.map(r => ({
      year: `第${r.year}年`,
      soh: parseFloat((r.sohEnd * 100).toFixed(1)),
      energy: Math.round(r.annualEnergy / 1000) // 转换为 GWh
    }));
  }, [simulationResult]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 顶部栏 */}
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
        {/* 侧边控制栏 */}
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
                  当前配置：年累计约 <strong>{Math.round(params.monthlyCycles.reduce((a,b)=>a+b,0) / 12 * 365)}</strong> 次循环
                </p>
              </div>
            </div>
          </section>
        </aside>

        {/* 结果显示区 */}
        <div className="lg:col-span-8 space-y-6">
          {simulationResult && (
            <>
              {/* 指标摘要卡片 */}
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
                      <span key={yr} className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] rounded font-bold border border-orange-200">第 {yr} 年</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 图表展示区 */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-800 flex items-center space-x-2">
                    <ChartIcon className="w-5 h-5 text-blue-500" />
                    <span>SOH 与年放电量变化趋势</span>
                  </h3>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                      <YAxis yAxisId="left" orientation="left" domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                        formatter={(value, name) => [value, name]}
                      />
                      <Legend verticalAlign="top" height={36}/>
                      <Line yAxisId="left" type="monotone" dataKey="soh" name="健康度 (SOH %)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                      <Line yAxisId="right" type="monotone" dataKey="energy" name="年放电量 (GWh)" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 明细数据表 */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-bold text-slate-800 uppercase tracking-tight">
                    <TableIcon className="w-5 h-5 text-blue-600" />
                    <span>逐年模拟明细数据</span>
                  </div>
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
                        <tr key={r.year} className={`hover:bg-slate-50 transition-colors ${r.isReplaced ? 'bg-orange-50/50' : ''}`}>
                          <td className="px-6 py-3 font-bold text-slate-700 italic">第 {r.year} 年</td>
                          <td className="px-6 py-3 text-slate-600 text-center">{r.batteryAge} 年</td>
                          <td className="px-6 py-3 text-center">{(r.sohStart * 100).toFixed(1)}%</td>
                          <td className="px-6 py-3">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                                <div 
                                  className={`h-full rounded-full ${r.sohEnd < params.replaceThreshold + 0.05 ? 'bg-orange-500' : 'bg-green-500'}`} 
                                  style={{width: `${r.sohEnd * 100}%`}}
                                ></div>
                              </div>
                              <span className="font-medium">{(r.sohEnd * 100).toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-slate-600 font-mono text-center">{Math.round(r.annualCycles)}</td>
                          <td className="px-6 py-3 font-semibold text-slate-800 text-right">{r.annualEnergy.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                          <td className="px-6 py-3 text-center">
                            {r.isReplaced ? (
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

      {/* 页脚 */}
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
