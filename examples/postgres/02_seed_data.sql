INSERT INTO public.actor (actor_id, first_name, last_name) VALUES
  (1, 'Alice', 'Smith'),
  (2, 'Bob',   'Johnson')
ON CONFLICT (actor_id) DO NOTHING;