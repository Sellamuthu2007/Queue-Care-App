-- Clean up duplicate reports keeping only the oldest record
DELETE FROM reports a USING reports b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.title = b.title
  AND a.type = b.type
  AND a.doctor_name = b.doctor_name
  AND a.report_date = b.report_date;

-- Clean up duplicate notifications keeping only the oldest record
DELETE FROM notifications a USING notifications b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.title = b.title
  AND a.message = b.message
  AND a.type = b.type;
