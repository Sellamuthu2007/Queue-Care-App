CREATE TABLE IF NOT EXISTS otp_verification_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(30) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otp_verification_sessions_token_hash ON otp_verification_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_otp_verification_sessions_phone ON otp_verification_sessions(phone);
