# Journey Explorer

**Journey Explorer** is a proof-of-concept visualization tool designed to shift the focus of digital analytics from static pageviews to dynamic user journeys.

It implements the **"Spine and Deep Dive"** mental model described in the article *[Why Page Views and KPIs Fail Business: Journeys Are the Simpler Path](./From_Pageviews_to_Journeys.md)*.

## The Problem
Traditional dashboards excel at answering "how many" (Pageviews, Sessions, Conversion Rate) but fail to answer "why." They flatten complex, multi-step user behaviors into disconnected aggregate metrics, hiding the friction, loops, and detours that actually drive performance.

## The Solution: Spine and Deep Dive
This tool demonstrates a new workflow for exploring user behavior:

1.  **The Spine (Orientation):** A horizontal, Sankey-style funnel that visualizes the ideal user path (e.g., *Session Start -> View Item -> Add to Cart -> Purchase*). The thickness of the flow represents user volume, providing an instant visual cue of drop-off points.
2.  **The Deep Dive (Exploration):** An interactive drill-down capability. Clicking on any transition expands a panel to reveal the "why" behind the movement:
    *   **Time Distribution:** How long does the transition take?
    *   **Micro-Events:** What specific actions (e.g., *view_shipping_info*, *remove_from_cart*) happened inside the step?
    *   **Friction Signals:** Where are users encountering errors or confusion?

## Features
*   **Interactive Sankey Visualization:** Visualizes flow volume and conversion rates.
*   **Drill-Down Panels:** Detailed metrics for every step and transition.
*   **Ecommerce Micro-Events:** Context-aware event tracking (e.g., cart actions, checkout steps).
*   **Friction & Detour Analysis:** Identifies where users get stuck or lost.

## Tech Stack
*   **React + TypeScript + Vite**
*   **D3.js** for custom visualizations
*   **Tailwind CSS** for styling

## Getting Started
1.  Clone the repository.
2.  Run `npm install` in the `app` directory.
3.  Run `npm run dev` to start the local server.

---
*Part of the "Analytics Thinking" series.*
