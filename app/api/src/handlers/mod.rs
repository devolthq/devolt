pub mod payment_engine_handler;
pub mod users_handler;

use axum::{
    middleware,
    routing::{delete, get, post, put},
    Router,
};
use payment_engine_handler::{buy_energy_handler, confirm_buying_handler, confirm_selling_handler, sell_energy_handler};
use serde::Serialize;
use std::sync::Arc;
use users_handler::{
    delete_user_handler, get_user_handler, login_handler, sign_up_handler, update_user_handler,
};

use crate::{db::AppState, middleware::authorization_middleware};

#[derive(Serialize, Debug)]
pub struct ErrorResponse {
    pub status_code: u16,
    pub error: String,
}

pub fn user_router(state: Arc<AppState>) -> Router<Arc<AppState>> {
    let protected_routes = Router::new()
        .route("/", get(get_user_handler))
        .route("/:user_id", get(get_user_handler))
        .route("/:user_id", put(update_user_handler))
        .route("/:user_id", delete(delete_user_handler))
        .layer(middleware::from_fn_with_state(
            Arc::clone(&state),
            authorization_middleware,
        ));

    Router::new()
        .route("/sign_up", post(sign_up_handler))
        .route("/login", post(login_handler))
        .nest("/", protected_routes)
}

pub fn payment_engine_router(state: Arc<AppState>) -> Router<Arc<AppState>> {
    Router::new()
        .route("/sell_energy", post(sell_energy_handler))
        .route("/confirm_selling", post(confirm_selling_handler))
        .route("/buy_energy", post(buy_energy_handler))
        .route("/confirm_buying", post(confirm_buying_handler))
        .layer(middleware::from_fn_with_state(
            Arc::clone(&state),
            authorization_middleware,
        ))
}
