use axum::Router;
use db::AppState;
use dotenv::dotenv;
use handlers::{payment_engine_router, user_router};
use std::sync::Arc;
use tokio::net::TcpListener;

mod cronjob;
mod db;
mod handlers;
mod middleware;
mod models;
mod solana;

#[tokio::main]
async fn main() {
    dotenv().ok();

    let app_state = Arc::new(AppState::new().await);

    // cronjob::run(Arc::clone(&app_state));

    let app = Router::new()
        .nest("/user", user_router(Arc::clone(&app_state)))
        .nest(
            "/payment_engine",
            payment_engine_router(Arc::clone(&app_state)),
        )
        .with_state(app_state);

    let listener = TcpListener::bind("0.0.0.0:5500").await.unwrap();

    println!("Listening on http://{}/ 🚀", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}
