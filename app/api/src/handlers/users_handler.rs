use axum::{
    extract::{Path, State},
    http::StatusCode,
    Extension, Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::{
    db::{self, AppState},
    middleware::{encode_jwt, hash_password, verify_password},
};

use super::ErrorResponse;

#[derive(Debug, Serialize)]
pub struct GetUserResponse {
    pub id: String,
    pub name: String,
    pub email: String,
    pub public_key: String,
    pub private_key: Vec<u8>,
}

pub async fn get_user_handler(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<String>,
    Extension(current_user_id): Extension<String>,
) -> Result<Json<GetUserResponse>, Json<ErrorResponse>> {
    let mut id = user_id.clone();
    if user_id.is_empty() && !current_user_id.is_empty() {
        id.clone_from(&current_user_id);
    }

    let user = db::get_user_by_id(&state.db_pool, &id).await.map_err(|e| {
        Json(ErrorResponse {
            status_code: StatusCode::INTERNAL_SERVER_ERROR.as_u16(),
            error: e.to_string(),
        })
    })?;

    Ok(Json(GetUserResponse {
        id: user.id,
        name: user.name,
        email: user.email,
        public_key: user.public_key,
        private_key: user.private_key,
    }))
}

#[derive(Debug, Deserialize)]
pub struct SignUpRequest {
    pub name: String,
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct SignUpResponse {
    pub id: String,
    pub name: String,
    pub email: String,
    pub public_key: String,
}

pub async fn sign_up_handler(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SignUpRequest>,
) -> Result<Json<SignUpResponse>, Json<ErrorResponse>> {
    let existing_user = db::get_user_by_email(&state.db_pool, &payload.email).await;

    if existing_user.is_ok() {
        return Err(Json(ErrorResponse {
            status_code: StatusCode::BAD_REQUEST.as_u16(),
            error: "Email is already registered".into(),
        }));
    }

    let password_hash = hash_password(&payload.password).map_err(|_| {
        Json(ErrorResponse {
            status_code: StatusCode::INTERNAL_SERVER_ERROR.as_u16(),
            error: "Password hashing failed".into(),
        })
    })?;

    let user = db::create_user(
        &state.db_pool,
        &payload.name,
        &payload.email,
        &password_hash,
    )
    .await
    .map_err(|e| {
        Json(ErrorResponse {
            status_code: StatusCode::INTERNAL_SERVER_ERROR.as_u16(),
            error: e.to_string(),
        })
    })?;

    Ok(Json(SignUpResponse {
        id: user.id.to_string(),
        name: user.name,
        email: user.email,
        public_key: user.public_key,
    }))
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub user: GetUserResponse,
    pub token: String,
}

pub async fn login_handler(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, Json<ErrorResponse>> {
    let user = db::get_user_by_email(&state.db_pool, &payload.email)
        .await
        .map_err(|e| {
            Json(ErrorResponse {
                status_code: StatusCode::UNAUTHORIZED.as_u16(),
                error: e.to_string(),
            })
        })?;

    let is_valid = verify_password(&payload.password, &user.password_hash).map_err(|_| {
        Json(ErrorResponse {
            status_code: StatusCode::INTERNAL_SERVER_ERROR.as_u16(),
            error: "Password verification failed".into(),
        })
    })?;

    if !is_valid {
        return Err(Json(ErrorResponse {
            status_code: StatusCode::UNAUTHORIZED.as_u16(),
            error: "Invalid credentials".into(),
        }));
    }

    let token = encode_jwt(user.id.clone(), &state.jwt_secret.encoding).map_err(|e| {
        Json(ErrorResponse {
            status_code: StatusCode::INTERNAL_SERVER_ERROR.as_u16(),
            error: e.to_string(),
        })
    })?;

    Ok(Json(LoginResponse {
        token,
        user: GetUserResponse {
            id: user.id,
            name: user.name,
            email: user.email,
            public_key: user.public_key,
            private_key: user.private_key,
        },
    }))
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserRequest {
    pub name: Option<String>,
    pub email: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct UpdateUserResponse {
    pub id: String,
    pub name: String,
    pub email: String,
    pub public_key: String,
}

pub async fn update_user_handler(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<String>,
    Json(payload): Json<UpdateUserRequest>,
) -> Result<Json<UpdateUserResponse>, Json<ErrorResponse>> {
    let user = db::update_user(&state.db_pool, &user_id, payload.name, payload.email)
        .await
        .map_err(|e| {
            Json(ErrorResponse {
                status_code: StatusCode::INTERNAL_SERVER_ERROR.as_u16(),
                error: e.to_string(),
            })
        })?;

    Ok(Json(UpdateUserResponse {
        id: user.id,
        name: user.name,
        email: user.email,
        public_key: user.public_key,
    }))
}

#[derive(Debug, Serialize)]
pub struct DeleteUserResponse {
    pub message: String,
}

pub async fn delete_user_handler(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<String>,
) -> Result<Json<DeleteUserResponse>, Json<ErrorResponse>> {
    db::delete_user(&state.db_pool, &user_id)
        .await
        .map_err(|e| {
            Json(ErrorResponse {
                status_code: StatusCode::INTERNAL_SERVER_ERROR.as_u16(),
                error: e.to_string(),
            })
        })?;

    Ok(Json(DeleteUserResponse {
        message: "User successfully deleted".into(),
    }))
}
