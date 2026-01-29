# Journey Funnel Explorer

An interactive D3 + React visualization for exploring ecommerce user journeys, built with BigQuery GA4 data.

## Overview

This application visualizes a multi-step user journey (Session Start -> Purchase) and allows deep-dive exploration into specific steps and transitions. It is designed to be embedded in web articles or dashboards.

## Features

- **Journey Funnel**: Interactive visualization of user flow with conversion rates and drop-offs.
- **Deep Dive Mode**: Detailed metrics for each step (Traffic Channels, Top Pages, Micro-events).
- **Transition Analysis**: Histograms of time-to-next-step, friction signals, and detours.
- **Responsive Design**: Built with Tailwind CSS for seamless embedding.

## Setup & Deployment

1.  **Install Dependencies**:
    ```bash
    cd app
    npm install
    ```

2.  **Build for Production**:
    ```bash
    npm run build
    ```

3.  **Deploy**:
    - Upload the contents of the `app/dist` folder to any static hosting provider (GitHub Pages, Netlify, Vercel, S3).
    - The application is self-contained and loads data from `journey_data.json`.

## Data Pipeline

The data is derived from the BigQuery public dataset `ga4_obfuscated_sample_ecommerce`.

1.  **SQL Extraction**: Queries in `sql/` extract raw events, map them to journey steps, and aggregate metrics.
2.  **Data Processing**: `scripts/generate_journey_json.py` processes the aggregated data (or generates synthetic data for testing) and applies imputation rules.

### Imputation & Data Completion

To ensure a robust visualization even with sparse or obfuscated data, the following rules are applied (NO hallucination, only deterministic smoothing):

-   **Missing Channels**: Source/Medium fields are coalesced to `<Unknown>` if missing.
-   **Sparse Distributions**: Dirichlet/Add-one smoothing is applied to histograms to ensure continuity.
-   **Missing Pages**: Unidentified page locations are bucketed as `<Unknown Page>`.
-   **Micro-events**: If dominant events are fewer than 5, the remainder is aggregated into `<Other>`.

## Project Structure

-   `app/`: React + TypeScript application.
-   `sql/`: BigQuery SQL queries for data extraction.
-   `scripts/`: Python scripts for data processing and JSON generation.
-   `journey_data.json`: The data file consumed by the frontend.
