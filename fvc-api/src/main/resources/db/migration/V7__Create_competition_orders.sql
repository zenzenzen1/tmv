-- Create table to store athlete execution orders per competition/content
CREATE TABLE IF NOT EXISTS competition_orders (
    id UUID PRIMARY KEY,
    competition_id UUID NOT NULL,
    athlete_id UUID NOT NULL,
    content_selection_id UUID NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_competition_orders_competition
        FOREIGN KEY (competition_id)
        REFERENCES competitions (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_competition_orders_athlete
        FOREIGN KEY (athlete_id)
        REFERENCES athletes (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_competition_orders_content_selection
        FOREIGN KEY (content_selection_id)
        REFERENCES competition_fist_item_selections (id)
        ON DELETE SET NULL
);

-- Ensure uniqueness of order within the same competition/content scope
CREATE UNIQUE INDEX IF NOT EXISTS uq_competition_orders_scope
ON competition_orders (competition_id, COALESCE(content_selection_id, '00000000-0000-0000-0000-000000000000'::uuid), order_index);

-- Speed up lookups
CREATE INDEX IF NOT EXISTS idx_competition_orders_competition
ON competition_orders (competition_id);

CREATE INDEX IF NOT EXISTS idx_competition_orders_athlete
ON competition_orders (athlete_id);


