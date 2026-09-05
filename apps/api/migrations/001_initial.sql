CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE app_user (
  id text PRIMARY KEY,
  settings jsonb NOT NULL DEFAULT '{}',
  schema_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE saved_location (
  id text NOT NULL,
  user_id text NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  position geography(PointZ, 4979) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);

CREATE INDEX saved_location_position_gix ON saved_location USING gist (position);
