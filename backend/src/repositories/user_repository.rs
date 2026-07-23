use crate::models::user::User;
use sqlx::{PgPool, Result};
use uuid::Uuid;

#[derive(Clone, Debug)]
pub struct UserRepository {
    db: PgPool,
}

impl UserRepository {
    pub fn new(db: PgPool) -> Self {
        Self { db }
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<User>> {
        sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.db)
            .await
    }

    pub async fn find_by_phone(&self, phone: &str) -> Result<Option<User>> {
        sqlx::query_as::<_, User>("SELECT * FROM users WHERE phone = $1")
            .bind(phone)
            .fetch_optional(&self.db)
            .await
    }

    pub async fn create_user(&self, phone: &str, password_hash: &str) -> Result<User> {
        sqlx::query_as::<_, User>(
            "INSERT INTO users (phone, password_hash, is_verified, role) 
             VALUES ($1, $2, TRUE, 'patient') 
             RETURNING *"
        )
        .bind(phone)
        .bind(password_hash)
        .fetch_one(&self.db)
        .await
    }
}
