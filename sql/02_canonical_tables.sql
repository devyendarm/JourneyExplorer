-- Phase 2: Build Canonical Journey Tables

-- A) base_events
CREATE OR REPLACE TABLE `your_project.your_dataset.base_events` AS
SELECT
  event_date,
  event_timestamp,
  user_pseudo_id,
  (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS session_id,
  event_name,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS page_location,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_title') AS page_title,
  traffic_source.source AS traffic_source,
  traffic_source.medium AS traffic_medium,
  traffic_source.name AS traffic_campaign,
  device.category AS device_category,
  geo.country AS geo_country
FROM
  `bigquery-public-data.ga4_obfuscated_sample_ecommerce.events_*`
WHERE
  _TABLE_SUFFIX BETWEEN '20210101' AND '20210131'; -- Adjust date range

-- B) step_hits
-- Define the journey steps mapping here
CREATE OR REPLACE TABLE `your_project.your_dataset.step_hits` AS
WITH mapped_events AS (
  SELECT
    *,
    CASE
      WHEN event_name IN ('session_start', 'first_visit') THEN 1
      WHEN event_name = 'page_view' THEN 2
      WHEN event_name IN ('view_item_list', 'view_item') THEN 3
      WHEN event_name IN ('select_item', 'add_to_cart') THEN 4
      WHEN event_name = 'begin_checkout' THEN 5
      WHEN event_name IN ('add_shipping_info', 'add_payment_info') THEN 6
      WHEN event_name = 'purchase' THEN 7
      ELSE NULL
    END AS step_id
  FROM
    `your_project.your_dataset.base_events`
)
SELECT
  user_pseudo_id,
  session_id,
  step_id,
  MIN(event_timestamp) AS step_timestamp
FROM
  mapped_events
WHERE
  step_id IS NOT NULL
GROUP BY
  1, 2, 3;

-- C) transitions
CREATE OR REPLACE TABLE `your_project.your_dataset.transitions` AS
SELECT
  t1.user_pseudo_id,
  t1.session_id,
  t1.step_id AS from_step_id,
  t1.step_timestamp AS from_step_timestamp,
  t2.step_id AS to_step_id,
  t2.step_timestamp AS to_step_timestamp,
  (t2.step_timestamp - t1.step_timestamp) / 1000000 AS time_to_next_step_sec
FROM
  `your_project.your_dataset.step_hits` t1
LEFT JOIN
  `your_project.your_dataset.step_hits` t2
ON
  t1.user_pseudo_id = t2.user_pseudo_id
  AND t1.session_id = t2.session_id
  AND t2.step_id = t1.step_id + 1;
