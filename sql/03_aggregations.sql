-- Phase 3: Deep Dive Aggregations

-- 1) Funnel Summary
SELECT
  step_id,
  COUNT(DISTINCT user_pseudo_id) AS users,
  COUNT(DISTINCT session_id) AS sessions
FROM
  `your_project.your_dataset.step_hits`
GROUP BY
  1
ORDER BY
  1;

-- 2) Deep Dive per Step (Example for Step 1, repeat or group by step_id)
-- Traffic Channels
SELECT
  sh.step_id,
  COALESCE(be.traffic_source, '<Unknown>') AS source,
  COALESCE(be.traffic_medium, '<Unknown>') AS medium,
  COALESCE(be.traffic_campaign, '<Unknown>') AS campaign,
  COUNT(*) AS count
FROM
  `your_project.your_dataset.step_hits` sh
JOIN
  `your_project.your_dataset.base_events` be
ON
  sh.user_pseudo_id = be.user_pseudo_id
  AND sh.session_id = be.session_id
  AND sh.step_timestamp = be.event_timestamp
GROUP BY
  1, 2, 3, 4
ORDER BY
  1, 5 DESC;

-- Page Details
SELECT
  sh.step_id,
  COALESCE(be.page_location, '<Unknown Page>') AS page_location,
  COUNT(*) AS count
FROM
  `your_project.your_dataset.step_hits` sh
JOIN
  `your_project.your_dataset.base_events` be
ON
  sh.user_pseudo_id = be.user_pseudo_id
  AND sh.session_id = be.session_id
  AND sh.step_timestamp = be.event_timestamp
GROUP BY
  1, 2
ORDER BY
  1, 3 DESC;

-- Micro Events (Events between steps)
-- This requires joining back to base_events for events between step_timestamp and next_step_timestamp
SELECT
  t.from_step_id,
  be.event_name,
  COUNT(*) AS count
FROM
  `your_project.your_dataset.transitions` t
JOIN
  `your_project.your_dataset.base_events` be
ON
  t.user_pseudo_id = be.user_pseudo_id
  AND t.session_id = be.session_id
  AND be.event_timestamp > t.from_step_timestamp
  AND (t.to_step_timestamp IS NULL OR be.event_timestamp < t.to_step_timestamp)
GROUP BY
  1, 2
ORDER BY
  1, 3 DESC;

-- 3) Deep Dive per Transition
-- Time-to-next-step histogram
SELECT
  from_step_id,
  to_step_id,
  FLOOR(time_to_next_step_sec / 60) AS minute_bin, -- Example binning
  COUNT(*) AS count
FROM
  `your_project.your_dataset.transitions`
WHERE
  to_step_id IS NOT NULL
GROUP BY
  1, 2, 3
ORDER BY
  1, 2, 3;
