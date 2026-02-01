import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { JourneyData, SelectionContext } from '../types';

interface FunnelProps {
    data: JourneyData;
    segmentId: string;
    selection: SelectionContext;
    onStepClick: (stepId: string) => void;
    onTransitionClick: (fromStepId: string, toStepId: string) => void;
    compact: boolean;
}

export const Funnel: React.FC<FunnelProps> = ({
    data,
    segmentId,
    selection,
    onStepClick,
    onTransitionClick,
    compact
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || !data) return;

        const container = containerRef.current;
        // Fallback dimensions if clientWidth is 0 (e.g. initially hidden or flex issue)
        const width = container.clientWidth || 800;
        const height = container.clientHeight || 400;

        // Clear previous
        d3.select(container).selectAll("*").remove();

        if (width === 0 || height === 0) {
            d3.select(container).append("div").text(`Waiting for dimensions: ${width}x${height}`).style("padding", "20px");
            return;
        }

        const svg = d3.select(container)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "max-width: 100%; height: auto;");

        // Define gradients
        const defs = svg.append("defs");

        // Node Gradient (Blue)
        const gradient = defs.append("linearGradient")
            .attr("id", "nodeGradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");
        gradient.append("stop").attr("offset", "0%").attr("stop-color", "#ffffff");
        gradient.append("stop").attr("offset", "100%").attr("stop-color", "#f0f9ff");

        // Selected Node Gradient
        const selGradient = defs.append("linearGradient")
            .attr("id", "selGradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");
        selGradient.append("stop").attr("offset", "0%").attr("stop-color", "#dbeafe");
        selGradient.append("stop").attr("offset", "100%").attr("stop-color", "#bfdbfe");

        const steps = data.steps;
        const stepCount = steps.length;

        // Layout config
        const margin = { top: compact ? 30 : 60, right: 60, bottom: compact ? 30 : 60, left: 60 };
        const availableWidth = width - margin.left - margin.right;
        const availableHeight = height - margin.top - margin.bottom;

        const nodeWidth = Math.min(140, availableWidth / stepCount * 0.7);
        const nodeHeight = compact ? 70 : 120;
        const spacing = (availableWidth - (stepCount * nodeWidth)) / (stepCount - 1);

        const centerY = margin.top + availableHeight / 2;

        // Draw Connectors (Edges)
        steps.forEach((step, i) => {
            if (i < stepCount - 1) {
                const nextStep = steps[i + 1];
                const x1 = margin.left + i * (nodeWidth + spacing) + nodeWidth;
                const x2 = margin.left + (i + 1) * (nodeWidth + spacing);

                const isSelected = selection.type === 'transition' &&
                    selection.fromStepId === step.stepId &&
                    selection.toStepId === nextStep.stepId;

                const g = svg.append("g")
                    .attr("class", "connector cursor-pointer")
                    .on("click", () => onTransitionClick(step.stepId, nextStep.stepId));

                // Sankey Path Logic
                const metrics = data.stepMetricsBySegment[segmentId][nextStep.stepId];
                const conversion = metrics ? metrics.conversionFromPrev : 0.5;
                // Scale path thickness based on conversion, but keep it visible
                const pathHeight = nodeHeight * 0.4 * (0.2 + conversion * 0.8);

                // Draw thick path with bezier curves
                g.append("path")
                    .attr("d", `M ${x1} ${centerY - pathHeight / 2} 
                                C ${x1 + spacing / 2} ${centerY - pathHeight / 2}, ${x2 - spacing / 2} ${centerY - pathHeight / 2}, ${x2} ${centerY - pathHeight / 2}
                                L ${x2} ${centerY + pathHeight / 2}
                                C ${x2 - spacing / 2} ${centerY + pathHeight / 2}, ${x1 + spacing / 2} ${centerY + pathHeight / 2}, ${x1} ${centerY + pathHeight / 2}
                                Z`)
                    .attr("fill", isSelected ? "#3b82f6" : "#e2e8f0")
                    .attr("opacity", isSelected ? 0.8 : 0.5)
                    .attr("stroke", isSelected ? "#2563eb" : "none")
                    .attr("stroke-width", 1)
                    .on("mouseover", function () { d3.select(this).attr("opacity", 0.9); })
                    .on("mouseout", function () { d3.select(this).attr("opacity", isSelected ? 0.8 : 0.5); });

                // Persistent Conversion Label Pill
                if (metrics) {
                    const labelX = (x1 + x2) / 2;
                    const labelY = centerY;

                    g.append("rect")
                        .attr("x", labelX - 28)
                        .attr("y", labelY - 12)
                        .attr("width", 56)
                        .attr("height", 24)
                        .attr("rx", 12)
                        .attr("fill", "white")
                        .attr("stroke", isSelected ? "#3b82f6" : "#cbd5e1")
                        .attr("stroke-width", 1)
                        .attr("filter", "drop-shadow(0 2px 4px rgb(0 0 0 / 0.05))");

                    g.append("text")
                        .attr("x", labelX)
                        .attr("y", labelY + 4)
                        .attr("text-anchor", "middle")
                        .attr("class", `text-xs font-bold ${isSelected ? 'fill-blue-600' : 'fill-gray-600'}`)
                        .text(`${(metrics.conversionFromPrev * 100).toFixed(0)}%`);
                }
            }
        });

        // Draw Nodes (Steps)
        steps.forEach((step, i) => {
            const x = margin.left + i * (nodeWidth + spacing);
            const y = centerY - nodeHeight / 2;

            const isSelected = selection.type === 'step' && selection.stepId === step.stepId;
            const metrics = data.stepMetricsBySegment[segmentId][step.stepId];

            const g = svg.append("g")
                .attr("class", "step cursor-pointer")
                .on("click", () => onStepClick(step.stepId));

            // Node Box with Shadow and Gradient
            g.append("rect")
                .attr("x", x)
                .attr("y", y)
                .attr("width", nodeWidth)
                .attr("height", nodeHeight)
                .attr("rx", 12)
                .attr("fill", isSelected ? "url(#selGradient)" : "url(#nodeGradient)")
                .attr("stroke", isSelected ? "#3b82f6" : "#e2e8f0")
                .attr("stroke-width", isSelected ? 2 : 1)
                .attr("filter", "drop-shadow(0 4px 6px rgb(0 0 0 / 0.05))");

            // Step Name
            g.append("text")
                .attr("x", x + nodeWidth / 2)
                .attr("y", y + 24)
                .attr("text-anchor", "middle")
                .attr("class", `text-sm font-bold ${isSelected ? 'fill-blue-800' : 'fill-gray-800'}`)
                .text(step.stepName)
                .each(function () {
                    const self = d3.select(this);
                    const node = self.node();
                    if (node && node.getComputedTextLength() > nodeWidth - 16) {
                        self.text(step.stepName.substring(0, 8) + "...");
                    }
                });

            // Metrics
            if (metrics) {
                g.append("text")
                    .attr("x", x + nodeWidth / 2)
                    .attr("y", y + 46)
                    .attr("text-anchor", "middle")
                    .attr("class", "text-xs font-medium fill-gray-600")
                    .text(`${(metrics.users / 1000).toFixed(1)}k Users`);

                if (!compact) {
                    g.append("text")
                        .attr("x", x + nodeWidth / 2)
                        .attr("y", y + 62)
                        .attr("text-anchor", "middle")
                        .attr("class", "text-[10px] fill-gray-400")
                        .text(`${(metrics.sessions / 1000).toFixed(1)}k Sess`);
                }
            }
        });

    }, [data, segmentId, selection, compact]);

    return (
        <div ref={containerRef} className="w-full h-full select-none" />
    );
};
