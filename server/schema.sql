-- Climbing Trainer API — MySQL schema (reference copy)
--
-- The real, authoritative implementation of this schema already exists as
-- Laravel migrations in github.com/temo-123/climbing.ge:
--   database/migrations/2026_08_09_1200*.php
-- along with the full public + admin API and admin CMS pages — see that
-- repo's docs/TRAINING.md for the up-to-date contract. This file is kept
-- here only as a quick reference for what utils/api.ts expects; if the two
-- ever disagree, docs/TRAINING.md in climbing.ge wins.
--
-- Public API (no auth, only is_published=1 rows), base https://climbing.ge/api:
--   GET /get_training/get_all_trainings?type=<fingerboard|campus|flexibility|strength|endurance>  -> Workout[]
--   GET /get_training/get_training_data/{id}                                                      -> Workout
--   GET /get_training_plan/get_all_plans                                                           -> TrainingPlan[]
--   GET /get_training_plan/get_plan_data/{id}                                                      -> TrainingPlan
--
-- "trainings" are single exercises (what types/models.ts calls a Workout —
-- hangTime/restTime/reps/sets/recoverTime, optionally with an ordered `steps`
-- array for step-by-step execution). "training_plans" are multi-day coaching
-- programs that reference trainings per day.

CREATE DATABASE IF NOT EXISTS climbing_trainer
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE climbing_trainer;

-- ─── Trainings (exercises) ──────────────────────────────────────────────────

CREATE TABLE trainings (
  id              VARCHAR(64)  NOT NULL PRIMARY KEY,
  name            VARCHAR(120) NOT NULL,
  description     TEXT,
  type            ENUM('fingerboard','campus','flexibility','strength','endurance') NOT NULL,
  difficulty      ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
  target_muscle   VARCHAR(160),
  coach_tip       TEXT,
  image_url       VARCHAR(500),
  -- Legacy formula fields — always required as a fallback even when `steps` are
  -- provided, since History/Analytics and the completion screen read reps/sets
  -- directly. For a step-based training, set reps = number of work steps and
  -- sets = 1 so those summaries still read sensibly.
  hang_time       INT NOT NULL DEFAULT 7,
  rest_time       INT NOT NULL DEFAULT 3,
  reps            INT NOT NULL DEFAULT 6,
  sets            INT NOT NULL DEFAULT 4,
  recover_time    INT NOT NULL DEFAULT 180,
  is_published    TINYINT(1) NOT NULL DEFAULT 1,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_trainings_type (type),
  INDEX idx_trainings_published (is_published)
) ENGINE=InnoDB;

-- Ordered steps for step-by-step training (types/models.ts TrainingStep[]).
-- Optional: a training with no rows here just runs the classic
-- hang/rest/reps/sets/recover formula in the app's timer.
CREATE TABLE training_steps (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  training_id       VARCHAR(64) NOT NULL,
  step_order        INT NOT NULL,
  phase             ENUM('prepare','hang','rest','recover','work','stretch') NOT NULL,
  label             VARCHAR(120),
  duration_seconds  INT NOT NULL,
  image_url         VARCHAR(500),
  instructions      TEXT,
  FOREIGN KEY (training_id) REFERENCES trainings(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_training_step_order (training_id, step_order)
) ENGINE=InnoDB;

-- Per-locale overrides. The app reads `workout.translations[lang]` and falls
-- back to the base training row when a locale or field is missing.
CREATE TABLE training_translations (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  training_id     VARCHAR(64) NOT NULL,
  locale          VARCHAR(8) NOT NULL,           -- e.g. 'en', 'ka'
  name            VARCHAR(120),
  description     TEXT,
  coach_tip       TEXT,
  target_muscle   VARCHAR(160),
  FOREIGN KEY (training_id) REFERENCES trainings(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_training_locale (training_id, locale)
) ENGINE=InnoDB;

-- ─── Training plans (multi-day coaching programs) ──────────────────────────

CREATE TABLE training_plans (
  id              VARCHAR(64)  NOT NULL PRIMARY KEY,
  name            VARCHAR(120) NOT NULL,
  emoji           VARCHAR(16),
  level           ENUM('beginner','intermediate','expert','maintenance') NOT NULL,
  tagline         VARCHAR(200),
  description     TEXT,
  coach_note      TEXT,
  days_per_week   INT NOT NULL,
  weeks           INT NOT NULL DEFAULT 0,        -- 0 = ongoing / no fixed end date
  is_published    TINYINT(1) NOT NULL DEFAULT 1,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_plans_published (is_published)
) ENGINE=InnoDB;

CREATE TABLE plan_translations (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  plan_id         VARCHAR(64) NOT NULL,
  locale          VARCHAR(8) NOT NULL,
  name            VARCHAR(120),
  tagline         VARCHAR(200),
  description     TEXT,
  coach_note      TEXT,
  FOREIGN KEY (plan_id) REFERENCES training_plans(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_plan_locale (plan_id, locale)
) ENGINE=InnoDB;

-- One row per training day in a plan (dayIndex: 0=Mon ... 6=Sun).
CREATE TABLE plan_sessions (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  plan_id         VARCHAR(64) NOT NULL,
  day_index       TINYINT NOT NULL,
  day_label       VARCHAR(40) NOT NULL,          -- e.g. 'Monday'
  FOREIGN KEY (plan_id) REFERENCES training_plans(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_plan_day (plan_id, day_index)
) ENGINE=InnoDB;

-- Which trainings run on a given session day, and in what order.
CREATE TABLE plan_session_trainings (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  plan_session_id   BIGINT NOT NULL,
  training_id       VARCHAR(64) NOT NULL,
  sort_order        INT NOT NULL DEFAULT 0,
  FOREIGN KEY (plan_session_id) REFERENCES plan_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (training_id) REFERENCES trainings(id) ON DELETE RESTRICT,
  INDEX idx_pst_session (plan_session_id, sort_order)
) ENGINE=InnoDB;

-- ─── Example: assembling a GET /trainings/:id response ─────────────────────
--
-- SELECT * FROM trainings WHERE id = ? AND is_published = 1;
-- SELECT * FROM training_steps WHERE training_id = ? ORDER BY step_order;
-- SELECT * FROM training_translations WHERE training_id = ?;
--
-- -> { id, name, description, type, difficulty, targetMuscle, coachTip,
--      imageUrl, hangTime, restTime, reps, sets, recoverTime,
--      steps: [{ order, phase, label, durationSeconds, imageUrl, instructions }],
--      translations: { ka: { name, description, coachTip, targetMuscle } } }
--
-- ─── Example: assembling a GET /plans/:id response ─────────────────────────
--
-- SELECT * FROM training_plans WHERE id = ? AND is_published = 1;
-- SELECT * FROM plan_sessions WHERE plan_id = ? ORDER BY day_index;
-- SELECT pst.plan_session_id, t.* FROM plan_session_trainings pst
--   JOIN trainings t ON t.id = pst.training_id
--   WHERE pst.plan_session_id IN (...) ORDER BY pst.sort_order;
-- SELECT * FROM plan_translations WHERE plan_id = ?;
--
-- -> { id, name, emoji, level, tagline, description, coachNote,
--      daysPerWeek, weeks, isPreset: true,
--      sessions: [{ dayIndex, dayLabel, workouts: [<training rows, same shape as /trainings/:id>] }],
--      translations: { ka: { name, tagline, description, coachNote } } }
--
-- Note: `isActive`, `startDate`, `notificationsEnabled` etc. on TrainingPlan
-- are per-device state the app keeps in AsyncStorage — the API never needs
-- to store or return them.