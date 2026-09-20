alter table public.call_summaries
  add column historical_change_text text null
  check (historical_change_text is null or char_length(trim(historical_change_text)) between 1 and 2000);
