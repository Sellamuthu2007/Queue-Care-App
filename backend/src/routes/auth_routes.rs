use axum::{
    routing::post,
    Router,
};
use crate::state::AppState;
use crate::handlers::auth_handler;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/send-otp", post(auth_handler::send_otp))
        .route("/verify-otp", post(auth_handler::verify_otp))
        .route("/set-password", post(auth_handler::set_password))
        .route("/refresh", post(auth_handler::refresh))
        .route("/logout", post(auth_handler::logout))
}
