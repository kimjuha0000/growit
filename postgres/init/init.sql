CREATE SCHEMA IF NOT EXISTS mart;

CREATE TABLE IF NOT EXISTS mart.daily_events (
  event_date date NOT NULL,
  user_id    text NOT NULL,
  cnt        bigint NOT NULL,
  PRIMARY KEY (event_date, user_id)
);
