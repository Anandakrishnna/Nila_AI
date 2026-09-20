-- The existing RLS policies define which rows authenticated users may write.
-- These grants provide the underlying table privileges without bypassing RLS.
grant insert, update on public.calls to authenticated;
grant insert on public.observations, public.call_summaries, public.alerts, public.notifications to authenticated;

create or replace function public.persist_completed_checkin(
  p_call_id uuid,
  p_parent_id uuid,
  p_started_at timestamptz,
  p_ended_at timestamptz,
  p_duration_seconds integer,
  p_overall_tone text,
  p_summary_text text,
  p_follow_up_text text,
  p_historical_change_text text,
  p_observations jsonb,
  p_alert_severity text default null,
  p_alert_message text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  completed_call_id uuid;
  created_alert_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if not (select private.can_access_parent(p_parent_id)) then
    raise exception 'This parent is unavailable for a check-in.' using errcode = '42501';
  end if;

  if jsonb_typeof(p_observations) <> 'array' then
    raise exception 'Observations must be an array.' using errcode = '22023';
  end if;

  update public.calls
  set
    status = 'completed',
    started_at = p_started_at,
    ended_at = p_ended_at,
    duration_seconds = p_duration_seconds,
    failure_reason = null
  where id = p_call_id
    and parent_id = p_parent_id
    and status = 'in_progress'
  returning id into completed_call_id;

  if completed_call_id is null then
    raise exception 'This check-in has already been finalised or is unavailable.' using errcode = 'P0001';
  end if;

  insert into public.call_summaries (
    call_id,
    parent_id,
    overall_tone,
    summary_text,
    follow_up_text,
    historical_change_text
  ) values (
    completed_call_id,
    p_parent_id,
    p_overall_tone,
    p_summary_text,
    p_follow_up_text,
    p_historical_change_text
  );

  insert into public.observations (
    call_id,
    parent_id,
    category,
    observation_text,
    source_excerpt
  )
  select
    completed_call_id,
    p_parent_id,
    item.category,
    item.observation_text,
    item.source_excerpt
  from jsonb_to_recordset(p_observations) as item(
    category text,
    observation_text text,
    source_excerpt text
  );

  if p_alert_severity is not null and p_alert_message is not null then
    insert into public.alerts (parent_id, call_id, severity, message)
    values (p_parent_id, completed_call_id, p_alert_severity, p_alert_message)
    returning id into created_alert_id;

    insert into public.notifications (child_id, alert_id, title, body)
    values (
      (select auth.uid()),
      created_alert_id,
      case when p_alert_severity = 'urgent' then 'Something needs attention' else 'Something to follow up on' end,
      case
        when p_alert_severity = 'urgent' then 'Nila recorded a potentially urgent concern in the latest check-in. Please review it promptly.'
        else 'Nila recorded a follow-up item in the latest check-in.'
      end
    );
  end if;

  return completed_call_id;
end;
$$;

revoke all on function public.persist_completed_checkin(uuid, uuid, timestamptz, timestamptz, integer, text, text, text, text, jsonb, text, text) from public;
grant execute on function public.persist_completed_checkin(uuid, uuid, timestamptz, timestamptz, integer, text, text, text, text, jsonb, text, text) to authenticated;
