-- Phase 1: Journey Flow Discovery
-- Inspect available event_name values to validate the journey mapping.

SELECT
  event_name,
  COUNT(*) AS event_count,
  COUNT(DISTINCT user_pseudo_id) AS user_count
FROM
  `bigquery-public-data.ga4_obfuscated_sample_ecommerce.events_*`
WHERE
  _TABLE_SUFFIX BETWEEN '20210101' AND '20210131' -- Adjust date range as needed
GROUP BY
  1
ORDER BY
  2 DESC;
