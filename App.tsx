
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import InputForm from './components/InputForm';
import DashboardWidget from './components/DashboardWidget';
import { analyzeLogistics, getShippingNews } from './services/geminiService';
import { ShipmentData, LogisticsResult, RouteOption, NewsItem } from './types';

const JourneyTimeline: React.FC<{ option: RouteOption }> = ({ option }) => (
  <div className="mt-4 space-y-2">
    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Journey Breakdown</div>
    {option.legs?.map((leg, i) => (
      <div key={i} className="flex items-center gap-3 p-2 bg-slate-900/30 rounded border border-slate-800/50">
        <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-emerald-400' : i === option.legs.length - 1 ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-300">{leg.label}</span>
            <span className="text-[10px] text-emerald-400 font-mono">${leg.cost}</span>
          </div>
          <div className="flex justify-between items-center text-[9px] text-slate-500">
            <span>{leg.location}</span>
            <span>{leg.durationDays}d</span>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const ContainerVisual: React.FC<{ percent: number }> = ({ percent }) => {
  return (
    <div className="relative w-full h-32 bg-slate-900/50 rounded-lg border border-slate-700 flex items-center justify-center overflow-hidden perspective-1000 group">
      {/* 3D Container Effect - Back Wall */}
      <div className="absolute inset-2 border-2 border-slate-600 bg-slate-900/80 rounded z-0">
         {/* Vertical Ribs */}
         <div className="absolute inset-0 flex justify-between px-2 opacity-20">
             {[...Array(6)].map((_, i) => <div key={i} className="w-1 h-full bg-slate-500"></div>)}
         </div>
      </div>
      
      {/* Cargo Load */}
      <div 
        className="absolute bottom-3 left-3 right-3 bg-gradient-to-t from-emerald-900 to-emerald-600 border border-emerald-500/50 opacity-90 transition-all duration-1000 z-10 rounded-sm"
        style={{ height: `${percent * 0.8}%`, maxHeight: '85%' }}
      >
        <div className="absolute top-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-30"></div>
        {/* Top of cargo label */}
        <div className="absolute -top-5 w-full text-center">
             <span className="text-[10px] font-bold text-emerald-400 bg-slate-900/80 px-1 rounded">{percent}% Full</span>
        </div>
      </div>

      {/* Door Frame Overlay */}
      <div className="absolute inset-0 border-[3px] border-slate-600 rounded-lg z-20 pointer-events-none"></div>
      
      {/* Open Door Visuals */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-500 z-30 shadow-xl"></div>
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-slate-500 z-30 shadow-xl"></div>
    </div>
  );
};

type ViewMode = 'dashboard' | 'fleet' | 'news';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [result, setResult] = useState<LogisticsResult | null>(null);
  const [newsResult, setNewsResult] = useState<{ news: NewsItem[], sources: {title: string, uri: string}[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('dashboard');
  const [manualTrackingId, setManualTrackingId] = useState('');

  // Fetch news when entering news view
  useEffect(() => {
    if (view === 'news' && !newsResult && !newsLoading) {
      handleFetchNews();
    }
  }, [view]);

  const handleFetchNews = async () => {
    setNewsLoading(true);
    try {
      const data = await getShippingNews();
      setNewsResult(data);
    } catch (err) {
      console.error("News fetch error", err);
    } finally {
      setNewsLoading(false);
    }
  };

  const handleCalculate = async (data: ShipmentData) => {
    setLoading(true);
    setError(null);
    try {
      const analysis = await analyzeLogistics(data);
      setResult(analysis);
    } catch (err: any) {
      console.error('Logistics Analysis Error:', err);
      const isQuota = err?.message?.includes('429') || err?.status === 'RESOURCE_EXHAUSTED';
      if (isQuota) {
        setError("Network capacity reached. Our systems are currently processing a high volume of requests. Please wait 10 seconds and try again.");
      } else {
        setError("The analysis service is currently unavailable. Please verify your connection or try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = (id: string) => {
    if (!id) return;
    const isContainer = /^[A-Z]{4}\d{7}$/.test(id.toUpperCase());
    const url = isContainer 
      ? `https://www.track-trace.com/container/${id}`
      : `https://www.vesselfinder.com/vessels?name=${id}`;
    window.open(url, '_blank');
  };

  const renderNews = () => (
    <div className="lg:col-span-8 space-y-6 animate-in fade-in duration-500">
       <div className="flex justify-between items-center">
         <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
            <i className="fas fa-newspaper text-emerald-400"></i> Global Shipping Intelligence
         </h2>
         <button onClick={handleFetchNews} className="text-xs text-slate-400 hover:text-white transition-colors">
            <i className={`fas fa-sync mr-1 ${newsLoading ? 'fa-spin' : ''}`}></i> Refresh
         </button>
       </div>

       {newsLoading && !newsResult && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {[1,2,3,4].map(i => (
               <div key={i} className="h-48 bg-slate-800/50 rounded-xl animate-pulse"></div>
             ))}
         </div>
       )}

       {newsResult && (
         <>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {newsResult.news.map((item, i) => (
                <div key={i} className="glass-card p-5 rounded-xl border-l-4 border-l-emerald-500 hover:border-slate-500 transition-all group">
                   <div className="flex justify-between items-start mb-2">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{item.date}</span>
                      <i className="fas fa-ship text-slate-700 group-hover:text-emerald-500 transition-colors"></i>
                   </div>
                   <h3 className="text-sm font-bold text-white mb-2 leading-tight">{item.headline}</h3>
                   <p className="text-xs text-slate-400 mb-4 leading-relaxed">{item.summary}</p>
                   
                   <div className="bg-slate-950/50 p-2 rounded border border-slate-800">
                      <div className="text-[9px] font-bold text-emerald-400 uppercase mb-1">
                        <i className="fas fa-bolt mr-1"></i> Shipping Impact
                      </div>
                      <p className="text-[10px] text-slate-300">{item.shippingImpact}</p>
                   </div>
                </div>
             ))}
           </div>

           {newsResult.sources.length > 0 && (
             <div className="mt-8 p-4 bg-slate-900/30 rounded-xl border border-slate-800/50">
                <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Sources & References</h4>
                <div className="flex flex-wrap gap-2">
                  {newsResult.sources.map((source, i) => (
                    <a 
                      key={i} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] bg-slate-950 hover:bg-slate-800 text-blue-400 px-3 py-1.5 rounded-full border border-slate-800 transition-colors truncate max-w-[200px]"
                    >
                      <i className="fas fa-link mr-1 text-[8px] text-slate-600"></i>
                      {source.title || new URL(source.uri).hostname}
                    </a>
                  ))}
                </div>
             </div>
           )}
         </>
       )}
    </div>
  );

  const renderDashboard = () => (
    <div className="lg:col-span-8 space-y-6">
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="fas fa-circle-exclamation text-red-400"></i>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-red-200">Processing Interruption</h4>
            <p className="text-xs text-red-300/80 mt-1 leading-relaxed">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="h-full flex flex-col items-center justify-center p-12 glass-card rounded-2xl text-center border-dashed border-2 border-slate-700">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
            <i className="fas fa-chart-line text-3xl text-slate-500"></i>
          </div>
          <h2 className="text-2xl font-bold text-slate-300">Ready to Analyze</h2>
          <p className="text-slate-500 max-w-sm mt-2">
            Input your shipment parameters on the left to generate an AI-powered logistics strategy.
          </p>
        </div>
      )}

      {loading && (
        <div className="space-y-6 animate-pulse">
          <div className="h-40 bg-slate-800 rounded-xl"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 bg-slate-800 rounded-xl"></div>
            <div className="h-32 bg-slate-800 rounded-xl"></div>
          </div>
          <div className="h-64 bg-slate-800 rounded-xl"></div>
        </div>
      )}

      {result && (
        <>
          {/* Classification & Currency Strategy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DashboardWidget title="Product Classification" icon="fas fa-tags">
               <div className="space-y-4">
                 <div>
                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Category</div>
                    <div className="text-4xl font-black text-white leading-none tracking-tight">{result.classification.category}</div>
                 </div>
                 <div className="pt-3 border-t border-slate-700/50">
                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Sub-Category</div>
                    <div className="text-xl font-bold text-emerald-400">{result.classification.subCategory}</div>
                    {result.classification.hsCodeHint && (
                      <div className="mt-3 inline-block px-3 py-1 bg-slate-900 rounded-md text-[10px] font-mono text-slate-400 border border-slate-800">
                        <i className="fas fa-barcode mr-2 text-slate-500"></i>
                        HS HINT: {result.classification.hsCodeHint}
                      </div>
                    )}
                 </div>
               </div>
            </DashboardWidget>

            <DashboardWidget title="Currency Strategy & Valuation" icon="fas fa-coins">
               <div className="space-y-3">
                 <div className="flex justify-between items-start">
                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Base Value (USD)</div>
                    <div className="text-2xl font-black text-white">${result.currencyOptimization.baseValueUSD.toLocaleString()}</div>
                 </div>
                 
                 <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-800">
                   <table className="w-full text-left text-[10px]">
                     <thead>
                       <tr className="text-slate-500 border-b border-slate-800">
                         <th className="pb-1 pl-1">Currency</th>
                         <th className="pb-1">Total Cost</th>
                         <th className="pb-1 text-right">Risk</th>
                       </tr>
                     </thead>
                     <tbody>
                       {result.currencyOptimization.paymentOptions?.map((opt, i) => (
                         <tr key={i} className={`border-b border-slate-800/50 last:border-0 ${opt.isRecommended ? 'bg-emerald-900/20' : ''}`}>
                           <td className="py-2 pl-1 font-bold text-slate-300">
                             {opt.currency}
                             {opt.isRecommended && <span className="ml-1 text-[8px] bg-emerald-600 text-white px-1 rounded">BEST</span>}
                           </td>
                           <td className="py-2 text-slate-300 font-mono">{opt.totalCost.toLocaleString()}</td>
                           <td className="py-2 text-right text-slate-400">{opt.exchangeRateRisk}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>

                 <div className="bg-blue-900/10 border border-blue-500/20 p-3 rounded-lg">
                    <div className="text-[9px] text-blue-400 font-bold uppercase mb-1 flex items-center gap-1">
                      <i className="fas fa-lightbulb text-yellow-500"></i> Why this recommendation?
                    </div>
                    <div className="text-[10px] text-slate-300 leading-snug">
                      {result.currencyOptimization.reasoning || result.currencyOptimization.analysis}
                    </div>
                 </div>
               </div>
            </DashboardWidget>
          </div>

          {/* Freight Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DashboardWidget 
              title="Air Priority" 
              icon="fas fa-plane"
              className="border-l-4 border-l-blue-500"
            >
              <div className="flex justify-between items-end mb-4">
                <div>
                  <div className="text-3xl font-black text-white">{result.flightOption.estimatedDays} Days</div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Factory to Door</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-400">${result.flightOption.estimatedCost.toLocaleString()}</div>
                </div>
              </div>
              <JourneyTimeline option={result.flightOption} />
            </DashboardWidget>

            <DashboardWidget 
              title="Sea Economic" 
              icon="fas fa-anchor"
              className="border-l-4 border-l-emerald-500"
            >
              <div className="flex justify-between items-end mb-4">
                <div>
                  <div className="text-3xl font-black text-white">{result.seaOption.estimatedDays} Days</div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Factory to Door</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-emerald-400">${result.seaOption.estimatedCost.toLocaleString()}</div>
                </div>
              </div>
              <JourneyTimeline option={result.seaOption} />
            </DashboardWidget>
          </div>

          {/* Breakdown Rows */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DashboardWidget title="Import Roadmap" icon="fas fa-list-check">
              <div className="space-y-3">
                {result.importSteps.slice(0, 6).map((step, i) => (
                  <div key={i} className="flex gap-2 text-[10px] text-slate-300 leading-snug border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
                    <div className="min-w-[16px] h-[16px] bg-emerald-900/50 text-emerald-400 rounded-full flex items-center justify-center text-[8px] font-bold mt-0.5">{i+1}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-0.5">
                        <span className="font-bold text-slate-200">{step.step}</span>
                        {step.estimatedCost > 0 && (
                          <span className="text-emerald-400 font-mono text-[9px] bg-emerald-900/20 px-1 rounded border border-emerald-900/50">
                            ${step.estimatedCost}
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 text-[9px]">{step.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardWidget>
            
            <DashboardWidget title="Container Utilization" icon="fas fa-cube">
              <div className="flex flex-col gap-4 h-full">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-xs font-bold text-slate-300 mb-2">{result.containerRecommendation.type}</div>
                    <ContainerVisual percent={result.containerRecommendation.utilizationPercent} />
                  </div>
                </div>
                
                <div className="flex-1 bg-slate-900/30 rounded p-2 text-[10px] text-slate-400 overflow-y-auto max-h-[150px]">
                  <p className="font-bold text-slate-300 mb-1">Loading Advice:</p>
                  {result.containerRecommendation.natureOfGoodsAdvice}
                </div>
              </div>
            </DashboardWidget>
            
            <DashboardWidget title="Compliance Alert" icon="fas fa-stamp">
              <div className="space-y-3">
                {result.mandatoryCertificates.map((c, i) => (
                  <div key={i} className="text-[10px] bg-slate-900/30 p-2 rounded border border-slate-800">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-200">{c.certificate}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${c.level === 'Mandatory' ? 'bg-red-900/40 text-red-400 border border-red-900' : 'bg-blue-900/40 text-blue-400 border border-blue-900'}`}>
                        {c.level}
                      </span>
                    </div>
                    <div className="text-slate-500 mb-1">{c.description}</div>
                    <div className="text-[9px] text-slate-600 font-mono">Auth: {c.authority}</div>
                  </div>
                ))}
              </div>
            </DashboardWidget>
          </div>
        </>
      )}
    </div>
  );

  const renderFleetTracking = () => (
    <div className="lg:col-span-8 space-y-6 animate-in fade-in duration-500">
      <DashboardWidget title="Live Fleet Monitor" icon="fas fa-satellite">
        {!result ? (
          <div className="h-[400px] flex flex-col items-center justify-center text-slate-600">
            <i className="fas fa-globe-africa text-4xl mb-4 opacity-20"></i>
            Run analysis to activate fleet tracking.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative h-[450px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
               <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <XAxis type="number" dataKey="x" hide domain={[-180, 180]} />
                    <YAxis type="number" dataKey="y" hide domain={[-90, 90]} />
                    <ZAxis type="number" range={[150, 150]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Shipment" data={[{ x: result.trackingData.liveLocalization.longitude, y: result.trackingData.liveLocalization.latitude }]} fill="#10b981" className="animate-pulse" />
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="absolute top-4 left-4 p-4 bg-slate-900/90 rounded-xl border border-slate-700 backdrop-blur-md shadow-2xl">
                   <div className="text-[10px] text-slate-500 uppercase font-black mb-1 tracking-widest">Global Telemetry</div>
                   <div className="text-xs text-white font-mono flex items-center gap-2">
                     <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                     {result.trackingData.liveLocalization.status}
                   </div>
                   <div className="text-[9px] text-slate-500 mt-2 font-bold">LAT: {result.trackingData.liveLocalization.latitude.toFixed(4)}</div>
                   <div className="text-[9px] text-slate-500 font-bold">LNG: {result.trackingData.liveLocalization.longitude.toFixed(4)}</div>
                </div>
            </div>
            
            <div className="flex gap-4">
               <div className="flex-1">
                 <label className="text-[10px] text-slate-500 uppercase font-black mb-2 block tracking-widest">Vessel / Container Lookup</label>
                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="IMO Number or Container ID (e.g. MSCU1234567)"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                      value={manualTrackingId}
                      onChange={(e) => setManualTrackingId(e.target.value)}
                    />
                    <button 
                      onClick={() => handleTrack(manualTrackingId)}
                      className="px-8 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-black transition-all shadow-lg shadow-blue-900/20 uppercase text-xs"
                    >
                      Search
                    </button>
                 </div>
               </div>
            </div>
          </div>
        )}
      </DashboardWidget>
    </div>
  );

  return (
    <div className="min-h-screen pb-20 selection:bg-emerald-500/30">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-900/20">
              <i className="fas fa-route text-xl text-white"></i>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">SilkRoad <span className="text-emerald-500">Kosovo</span></h1>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Intelligent Trade Hub</p>
            </div>
          </div>
          <div className="flex gap-1.5 p-1 bg-slate-950 rounded-full border border-slate-800">
             <button 
              onClick={() => setView('dashboard')}
              className={`text-[10px] px-5 py-1.5 rounded-full font-black uppercase transition-all ${view === 'dashboard' ? 'bg-slate-800 text-white border border-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
             >
               Dashboard
             </button>
             <button 
              onClick={() => setView('fleet')}
              className={`text-[10px] px-5 py-1.5 rounded-full font-black uppercase transition-all ${view === 'fleet' ? 'bg-slate-800 text-white border border-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
             >
               Fleet Tracking
             </button>
             <button 
              onClick={() => setView('news')}
              className={`text-[10px] px-5 py-1.5 rounded-full font-black uppercase transition-all ${view === 'news' ? 'bg-slate-800 text-white border border-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
             >
               News
             </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <InputForm onCalculate={handleCalculate} isLoading={loading} />
        </div>

        {view === 'dashboard' ? renderDashboard() : view === 'fleet' ? renderFleetTracking() : renderNews()}
      </main>

      <footer className="mt-20 border-t border-slate-800 py-10 px-4 text-center opacity-40">
        <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.4em]">SilkRoad Global Intelligence Network • 2024</p>
      </footer>
    </div>
  );
};

export default App;
