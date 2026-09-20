-- Authenticated users may write only conversation data for parents they can access.
-- No service-role access is required for the browser voice-test pipeline.

create policy "Calls are creatable through a relationship"
on public.calls
for insert
to authenticated
with check ((select private.can_access_parent(calls.parent_id)));

create policy "Calls are updatable through a relationship"
on public.calls
for update
to authenticated
using ((select private.can_access_parent(calls.parent_id)))
with check ((select private.can_access_parent(calls.parent_id)));

create policy "Observations are creatable through a relationship"
on public.observations
for insert
to authenticated
with check (
  (select private.can_access_parent(observations.parent_id))
  and exists (
    select 1
    from public.calls call_record
    where call_record.id = observations.call_id
      and call_record.parent_id = observations.parent_id
  )
);

create policy "Summaries are creatable through a relationship"
on public.call_summaries
for insert
to authenticated
with check (
  (select private.can_access_parent(call_summaries.parent_id))
  and exists (
    select 1
    from public.calls call_record
    where call_record.id = call_summaries.call_id
      and call_record.parent_id = call_summaries.parent_id
  )
);

create policy "Alerts are creatable through a relationship"
on public.alerts
for insert
to authenticated
with check (
  (select private.can_access_parent(alerts.parent_id))
  and (
    alerts.call_id is null
    or exists (
      select 1
      from public.calls call_record
      where call_record.id = alerts.call_id
        and call_record.parent_id = alerts.parent_id
    )
  )
);

create policy "Notifications are creatable by their child"
on public.notifications
for insert
to authenticated
with check (
  (select auth.uid()) = notifications.child_id
  and (
    notifications.alert_id is null
    or exists (
      select 1
      from public.alerts alert_record
      where alert_record.id = notifications.alert_id
        and (select private.can_access_parent(alert_record.parent_id))
    )
  )
);
