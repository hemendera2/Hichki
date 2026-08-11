drop policy if exists push_devices_update on public.push_devices;
create policy push_devices_update on public.push_devices
for update to anon, authenticated
using (device_id = ((select current_setting('request.headers', true))::json ->> 'x-hichki-device-id'))
with check (device_id = ((select current_setting('request.headers', true))::json ->> 'x-hichki-device-id'));
