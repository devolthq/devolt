use anchor_client::solana_sdk::signature::Keypair;
use axum::http::StatusCode;
use axum::Extension;
use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use super::ErrorResponse;
use crate::db::{self, AppState};
use crate::solana::PaymentEngineService;

#[derive(Debug, Deserialize, Serialize)]
pub struct SellEnergyRequest {
    pub seed: u64,
    pub usdc_amount: u64,
}

#[derive(Debug, Serialize)]
pub struct SellEnergyResponse {
    pub signature: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct BuyEnergyRequest {
    pub seed: u64,
    pub energy_amount: u64,
}

#[derive(Debug, Serialize)]
pub struct BuyEnergyResponse {
    pub signature: String,
}

pub async fn sell_energy_handler(
    State(state): State<Arc<AppState>>,
    Extension(user_id): Extension<String>,
    Json(payload): Json<SellEnergyRequest>,
) -> Result<Json<SellEnergyResponse>, Json<ErrorResponse>> {
    let user = db::get_user_by_id(&state.db_pool, &user_id)
        .await
        .map_err(|e| {
            Json(ErrorResponse {
                status_code: StatusCode::INTERNAL_SERVER_ERROR.as_u16(),
                error: e.to_string(),
            })
        })?;

    let pes = PaymentEngineService::new(&state.payment_engine_service_url);

    let producer_keypair = Keypair::from_bytes(&user.private_key).map_err(|e| {
        Json(ErrorResponse {
            status_code: StatusCode::INTERNAL_SERVER_ERROR.as_u16(),
            error: e.to_string(),
        })
    })?;

    let signature = pes.sell_energy(&producer_keypair, payload).await;

    match signature {
        Ok(signature) => Ok(Json(SellEnergyResponse {
            signature: signature.to_string(),
        })),
        Err(e) => Err(Json(ErrorResponse {
            status_code: StatusCode::INTERNAL_SERVER_ERROR.as_u16(),
            error: e.error,
        })),
    }
}

pub async fn buy_energy_handler(
    State(state): State<Arc<AppState>>,
    Extension(user_id): Extension<String>,
    Json(payload): Json<BuyEnergyRequest>,
) -> Result<Json<BuyEnergyResponse>, Json<ErrorResponse>> {
    let user = db::get_user_by_id(&state.db_pool, &user_id)
        .await
        .map_err(|e| {
            Json(ErrorResponse {
                status_code: StatusCode::INTERNAL_SERVER_ERROR.as_u16(),
                error: e.to_string(),
            })
        })?;

    let pes = PaymentEngineService::new(&state.payment_engine_service_url);

    let consumer_keypair = Keypair::from_bytes(&user.private_key).map_err(|e| {
        Json(ErrorResponse {
            status_code: StatusCode::INTERNAL_SERVER_ERROR.as_u16(),
            error: e.to_string(),
        })
    })?;

    let buy_energy_request = BuyEnergyRequest {
        seed: payload.seed,
        energy_amount: payload.energy_amount,
    };

    let signature = pes.buy_energy(&consumer_keypair, buy_energy_request).await;

    match signature {
        Ok(signature) => Ok(Json(BuyEnergyResponse {
            signature: signature.to_string(),
        })),
        Err(e) => Err(Json(ErrorResponse {
            status_code: StatusCode::INTERNAL_SERVER_ERROR.as_u16(),
            error: e.error,
        })),
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ConfirmRequest {
    pub escrow_public_key: String,
}

#[derive(Debug, Serialize)]
pub struct ConfirmResponse {
    pub signature: String,
}

pub async fn confirm_selling_handler(
    State(state): State<Arc<AppState>>,
    Extension(user_id): Extension<String>,
    Json(payload): Json<ConfirmRequest>,
) -> Result<Json<ConfirmResponse>, Json<ErrorResponse>> {
    let _user = db::get_user_by_id(&state.db_pool, &user_id)
        .await
        .map_err(|e| {
            Json(ErrorResponse {
                status_code: StatusCode::INTERNAL_SERVER_ERROR.as_u16(),
                error: e.to_string(),
            })
        })?;

    let pes = PaymentEngineService::new(&state.payment_engine_service_url);

    // let producer_keypair = Keypair::from_bytes(&state.devolt_private_key).map_err(|e| {
    //     Json(ErrorResponse {
    //         status_code: StatusCode::INTERNAL_SERVER_ERROR.as_u16(),
    //         error: e.to_string(),
    //     })
    // })?;

    let signature = pes.confirm_selling(payload.escrow_public_key).await;

    match signature {
        Ok(signature) => Ok(Json(ConfirmResponse {
            signature: signature.to_string(),
        })),
        Err(e) => Err(Json(ErrorResponse {
            status_code: StatusCode::INTERNAL_SERVER_ERROR.as_u16(),
            error: e.error,
        })),
    }
}

pub async fn confirm_buying_handler(
    State(state): State<Arc<AppState>>,
    Extension(user_id): Extension<String>,
    Json(payload): Json<ConfirmRequest>,
) -> Result<Json<ConfirmResponse>, Json<ErrorResponse>> {
    let _user = db::get_user_by_id(&state.db_pool, &user_id)
        .await
        .map_err(|e| {
            Json(ErrorResponse {
                status_code: StatusCode::INTERNAL_SERVER_ERROR.as_u16(),
                error: e.to_string(),
            })
        })?;

    let pes = PaymentEngineService::new(&state.payment_engine_service_url);

    let signature = pes.confirm_buying(payload.escrow_public_key).await;

    match signature {
        Ok(signature) => Ok(Json(ConfirmResponse {
            signature: signature.to_string(),
        })),
        Err(e) => Err(Json(ErrorResponse {
            status_code: StatusCode::INTERNAL_SERVER_ERROR.as_u16(),
            error: e.error,
        })),
    }
}
