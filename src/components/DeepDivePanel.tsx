import React, { useState, useEffect } from 'react';
import type { JourneyData, SelectionContext, DistributionItem } from '../types';
import { BarChart3, Users, ArrowRight, AlertTriangle, Map } from 'lucide-react';

interface DeepDivePanelProps {
    data: JourneyData;
    segmentId: string;
    selection: SelectionContext;
}

export const DeepDivePanel: React.FC<DeepDivePanelProps> = ({
    data,
    segmentId,
    selection
}) => {
    const [activeTab, setActiveTab] = useState('summary');

    // Reset tab when selection changes
    useEffect(() => {
        if (selection.type === 'step') {
            setActiveTab('summary');
        } else if (selection.type === 'transition') {
            setActiveTab('between-steps');
        }
    }, [selection.type, selection.stepId, selection.fromStepId, selection.toStepId]);

    if (!selection.type) return null;

    const renderDistribution = (items: DistributionItem[], total: number, colorClass: string = "bg-blue-500") => {
        // Filter out "Unknown" items for cleaner display
        const validItems = items ? items.filter(i => i.name !== '<Unknown>' && i.name !== 'Other') : [];

        if (!validItems || validItems.length === 0) return <p className="text-gray-500 italic text-sm">No significant data available</p>;

        const max = Math.max(...validItems.map(i => i.count));

        return (
            <div className="space-y-3">
                {validItems.map((item, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                        <div className="w-48 truncate text-gray-700" title={item.name}>{item.name}</div>
                        <div className="flex-1 mx-3 h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${colorClass}`}
                                style={{ width: `${(item.count / max) * 100}%` }}
                            />
                        </div>
                        <div className="w-20 text-right text-gray-600 font-mono">
                            {item.count.toLocaleString()} <span className="text-xs text-gray-400">({((item.count / total) * 100).toFixed(1)}%)</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Step Context
    if (selection.type === 'step' && selection.stepId) {
        const stepData = data.deepDiveBySegment[segmentId][selection.stepId];
        const stepName = data.steps.find(s => s.stepId === selection.stepId)?.stepName;
        const totalUsers = stepData.summary.users;

        return (
            <div className="h-full flex flex-col bg-white shadow-inner">
                <div className="flex border-b border-gray-200 px-6 bg-gray-50">
                    {['summary', 'channels', 'pages', 'micro-events'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.replace('-', ' ')}
                        </button>
                    ))}
                </div>

                <div className="flex-1 p-6 overflow-auto">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded uppercase tracking-wide">Step</span>
                        {stepName}
                    </h2>

                    {activeTab === 'summary' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-2 text-gray-500">
                                    <Users className="w-5 h-5" />
                                    <span className="text-sm font-medium">Users</span>
                                </div>
                                <div className="text-3xl font-bold text-gray-900">{stepData.summary.users.toLocaleString()}</div>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-2 text-gray-500">
                                    <BarChart3 className="w-5 h-5" />
                                    <span className="text-sm font-medium">Sessions</span>
                                </div>
                                <div className="text-3xl font-bold text-gray-900">{stepData.summary.sessions.toLocaleString()}</div>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-2 text-gray-500">
                                    <ArrowRight className="w-5 h-5" />
                                    <span className="text-sm font-medium">Conversion</span>
                                </div>
                                <div className="text-3xl font-bold text-gray-900">
                                    {data.steps[0].stepId === selection.stepId
                                        ? '100%'
                                        : `${(stepData.summary.conversionFromPrev * 100).toFixed(1)}%`}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    {data.steps[0].stepId === selection.stepId
                                        ? 'Journey Start'
                                        : 'from previous step'}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'channels' && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200">
                            <h3 className="text-lg font-semibold mb-4">Traffic Channels</h3>
                            {renderDistribution(stepData.channels, totalUsers, "bg-emerald-500")}
                        </div>
                    )}

                    {activeTab === 'pages' && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200">
                            <h3 className="text-lg font-semibold mb-4">Top Pages</h3>
                            {renderDistribution(stepData.pages, totalUsers, "bg-indigo-500")}
                        </div>
                    )}

                    {activeTab === 'micro-events' && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200">
                            <h3 className="text-lg font-semibold mb-4">Micro Events</h3>
                            <p className="text-sm text-gray-500 mb-4">Events occurring between this step and the next.</p>
                            {renderDistribution(stepData.microEvents, totalUsers, "bg-amber-500")}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Transition Context
    if (selection.type === 'transition' && selection.fromStepId && selection.toStepId) {
        const transKey = `${selection.fromStepId}|${selection.toStepId}`;
        const transData = data.transitionMetricsBySegment[segmentId][transKey];
        const fromName = data.steps.find(s => s.stepId === selection.fromStepId)?.stepName;
        const toName = data.steps.find(s => s.stepId === selection.toStepId)?.stepName;

        if (!transData) return <div className="p-6">No transition data available.</div>;

        const { histogram, frictionSignals, detours } = transData.betweenSteps;
        const maxHist = Math.max(...histogram.map(h => h.count));

        // Calculate summary metrics for the transition
        const avgTime = histogram.reduce((acc, curr) => acc + (curr.bin * curr.count), 0) / histogram.reduce((acc, curr) => acc + curr.count, 0);
        const totalTrans = histogram.reduce((acc, curr) => acc + curr.count, 0);
        const slowTrans = histogram.slice(5).reduce((acc, curr) => acc + curr.count, 0); // Arbitrary threshold > 5m

        return (
            <div className="h-full flex flex-col bg-white shadow-inner">
                <div className="flex border-b border-gray-200 px-6 bg-gray-50">
                    <button
                        className="px-4 py-3 text-sm font-medium border-b-2 border-blue-600 text-blue-600 transition-colors capitalize"
                    >
                        Between Steps Analysis
                    </button>
                </div>

                <div className="flex-1 p-6 overflow-auto">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded uppercase tracking-wide">Transition</span>
                        {fromName} <ArrowRight className="w-4 h-4 text-gray-400" /> {toName}
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Scorecards */}
                        <div className="col-span-1 lg:col-span-2 grid grid-cols-3 gap-4 mb-2">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <div className="text-xs text-blue-600 font-semibold uppercase">Avg Time</div>
                                <div className="text-2xl font-bold text-gray-900">{(avgTime + 0.5).toFixed(1)}m</div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                <div className="text-xs text-green-600 font-semibold uppercase">Total Transitions</div>
                                <div className="text-2xl font-bold text-gray-900">{totalTrans.toLocaleString()}</div>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                                <div className="text-xs text-orange-600 font-semibold uppercase">Slow ({'>'}5m)</div>
                                <div className="text-2xl font-bold text-gray-900">{((slowTrans / totalTrans) * 100).toFixed(1)}%</div>
                            </div>
                        </div>

                        {/* Histogram */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 col-span-1 lg:col-span-2">
                            <h3 className="text-lg font-semibold mb-4">Time Distribution</h3>
                            <div className="h-32 flex items-end gap-1">
                                {histogram.map((bin, idx) => {
                                    const heightPct = maxHist > 0 ? (bin.count / maxHist) * 100 : 0;
                                    return (
                                        <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                            <div
                                                className="w-full bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors"
                                                style={{ height: `${Math.max(4, heightPct)}%` }}
                                            />
                                            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 shadow-lg">
                                                {bin.label}: {bin.count} users
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex justify-between text-xs text-gray-400 mt-2 border-t border-gray-100 pt-2">
                                <span>0m</span>
                                <span>{histogram.length}m+</span>
                            </div>
                        </div>

                        {/* Friction */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                <h3 className="text-lg font-semibold">Friction Signals</h3>
                            </div>
                            {renderDistribution(frictionSignals, 100, "bg-amber-500")}
                        </div>

                        {/* Detours */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                                <Map className="w-5 h-5 text-indigo-500" />
                                <h3 className="text-lg font-semibold">Detours</h3>
                            </div>
                            {renderDistribution(detours, 100, "bg-indigo-500")}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
