use axum::Router;
use crate::state::AppState;

pub mod auth_routes;

pub fn v1_router() -> Router<AppState> {
    Router::new()
        .nest("/auth", auth_routes::router())
}
