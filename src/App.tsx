import { useState, useEffect } from 'react';
import type { JourneyData, SelectionContext, ViewMode } from './types';
import { Funnel } from './components/Funnel';
import { DeepDivePanel } from './components/DeepDivePanel';
import { Loader2, AlertTriangle } from 'lucide-react';

function App() {
  const [data, setData] = useState<JourneyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('SUMMARY');
  const [selection, setSelection] = useState<SelectionContext>({ type: null });
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [funnelHeight, setFunnelHeight] = useState(600);
  const [isDragging, setIsDragging] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Fetching data...");
    fetch('./journey_data.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(d => {
        console.log("Data loaded:", d);
        setData(d);
        // Auto-select first transition (pipe) to show friction/detour data
        if (d.steps.length > 1) {
          setSelection({
            type: 'transition',
            fromStepId: d.steps[0].stepId,
            toStepId: d.steps[1].stepId
          });
          setViewMode('DEEP_DIVE');
          // Set initial height for deep dive mode
          setFunnelHeight(window.innerHeight * 0.4);
        } else if (d.steps.length > 0) {
          setSelection({ type: 'step', stepId: d.steps[0].stepId });
          setViewMode('DEEP_DIVE');
          setFunnelHeight(window.innerHeight * 0.4);
        }
      })
      .catch(err => {
        console.error("Failed to load data", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      // Constrain height between 100px and window height - 100px
      const newHeight = Math.max(100, Math.min(window.innerHeight - 100, e.clientY - 64)); // 64 is approx header height
      setFunnelHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleStepClick = (stepId: string) => {
    setSelection({ type: 'step', stepId });
    setViewMode('DEEP_DIVE');
    if (funnelHeight > window.innerHeight * 0.6) {
      setFunnelHeight(window.innerHeight * 0.4); // Auto-shrink funnel on selection if it's too big
    }
  };

  const handleTransitionClick = (fromStepId: string, toStepId: string) => {
    setSelection({ type: 'transition', fromStepId, toStepId });
    setViewMode('DEEP_DIVE');
  };

  const handleBack = () => {
    // Keep selection but go back to summary view? 
    // Requirement: "Back exits Deep Dive mode but returns to the SAME selected step/transition on the funnel"
    setViewMode('SUMMARY');
  };

  const handleReset = () => {
    setSelection({ type: null });
    setViewMode('SUMMARY');
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin w-8 h-8 text-blue-500" /><span className="ml-2">Loading data...</span></div>;
  if (error) return <div className="flex items-center justify-center h-screen text-red-500 flex-col"><AlertTriangle className="w-8 h-8 mb-2" /><span>Error loading data: {error}</span></div>;
  if (!data) return <div className="flex items-center justify-center h-screen">No data available</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{data.journey.name}</h1>
          <p className="text-sm text-gray-500">Date Range: {data.journey.dateRange}</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedSegment}
            onChange={(e) => setSelectedSegment(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {data.segments.map(s => (
              <option key={s.segmentId} value={s.segmentId}>{s.segmentName}</option>
            ))}
          </select>
          {viewMode === 'DEEP_DIVE' && (
            <button
              onClick={handleBack}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors"
            >
              Back to Summary
            </button>
          )}
          <button
            onClick={handleReset}
            className="text-sm font-medium text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            Reset
          </button>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Funnel View */}
        <div
          style={{ height: viewMode === 'DEEP_DIVE' ? funnelHeight : '100%' }}
          className="transition-all duration-300 ease-out flex-shrink-0 bg-white relative"
        >
          <Funnel
            data={data}
            segmentId={selectedSegment}
            selection={selection}
            onStepClick={handleStepClick}
            onTransitionClick={handleTransitionClick}
            compact={viewMode === 'DEEP_DIVE'}
          />
        </div>

        {/* Splitter Handle - Visible only in Deep Dive mode */}
        {viewMode === 'DEEP_DIVE' && (
          <div
            className="h-3 bg-gray-200 border-y border-gray-300 cursor-row-resize flex items-center justify-center hover:bg-gray-300 transition-colors flex-shrink-0 z-50 select-none"
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent text selection
              setIsDragging(true);
            }}
          >
            {/* Grip Icon */}
            <div className="flex gap-1">
              <div className="w-8 h-1 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        )}

        {/* Deep Dive Panel */}
        {viewMode === 'DEEP_DIVE' && (
          <div className="flex-1 overflow-hidden bg-gray-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <DeepDivePanel
              data={data}
              segmentId={selectedSegment}
              selection={selection}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
