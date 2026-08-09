CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed an initial welcome notification for demo/visual testing
INSERT INTO notifications (user_id, title, message, type)
SELECT id, 'Welcome to Queue Care!', 'Your digital queue and health account is successfully activated.', 'info'
FROM users LIMIT 1 ON CONFLICT DO NOTHING;
