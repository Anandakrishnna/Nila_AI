insert into public.profiles (id, full_name)
select
  user_record.id,
  coalesce(nullif(trim(user_record.raw_user_meta_data ->> 'full_name'), ''), 'Nila member')
from auth.users as user_record
on conflict (id) do nothing;

notify pgrst, 'reload schema';
