-- list schemas and tables seen by Trino
SHOW SCHEMAS FROM postgres;
SHOW TABLES FROM postgres.public;

-- simple select from Postgres via Trino
SELECT * FROM postgres.public.actor ORDER BY actor_id;

-- prove pushdown works (basic filter & projection)
SELECT actor_id, first_name
FROM postgres.public.actor
WHERE last_name = 'Smith';