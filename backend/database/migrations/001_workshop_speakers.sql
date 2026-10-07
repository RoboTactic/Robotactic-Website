-- Additive migration. Existing workshop and participant records are preserved.
ALTER TABLE workshops ALTER COLUMN presenter_name DROP NOT NULL;

CREATE TABLE IF NOT EXISTS speakers (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workshop_speakers (
    workshop_id INTEGER NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    speaker_id INTEGER NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (workshop_id, speaker_id)
);

CREATE INDEX IF NOT EXISTS workshop_speakers_speaker_id_idx ON workshop_speakers (speaker_id);
