use axum::{
    body::Body,
    extract::{Request, State},
    http::{self, Response, StatusCode},
    middleware::Next,
};
use chrono::{Duration, Utc};
use hex::{decode, encode};
use hmac::{Hmac, Mac};
use jsonwebtoken::{
    decode as jwt_decode, encode as jwt_encode, DecodingKey, EncodingKey, Header, TokenData,
    Validation,
};
use rand::Rng;
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use std::sync::Arc;

type HmacSha256 = Hmac<Sha256>;

use crate::db::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub exp: usize,
}

pub fn encode_jwt(
    user_id: String,
    secret: &EncodingKey,
) -> Result<String, jsonwebtoken::errors::Error> {
    let now = Utc::now();
    let exp = (now + Duration::hours(24)).timestamp() as usize;

    let claims = Claims { sub: user_id, exp };

    jwt_encode(&Header::default(), &claims, secret)
}

pub fn decode_jwt(
    token: &str,
    secret: &DecodingKey,
) -> Result<TokenData<Claims>, jsonwebtoken::errors::Error> {
    jwt_decode::<Claims>(token, secret, &Validation::default())
}

pub fn verify_password(password: &str, hash: &str) -> Result<bool, StatusCode> {
    let parts: Vec<&str> = hash.split(':').collect();
    if parts.len() != 2 {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let salt = decode(parts[0]).map_err(|_| StatusCode::UNAUTHORIZED)?;
    let expected_hash = decode(parts[1]).map_err(|_| StatusCode::UNAUTHORIZED)?;

    let mut mac = HmacSha256::new_from_slice(&salt).map_err(|_| StatusCode::UNAUTHORIZED)?;
    mac.update(password.as_bytes());
    let result = mac.finalize();
    let hash_bytes = result.into_bytes();

    Ok(hash_bytes.as_slice() == expected_hash.as_slice())
}

pub fn hash_password(password: &str) -> Result<String, StatusCode> {
    let salt = rand::thread_rng().gen::<[u8; 32]>();
    let mut mac =
        HmacSha256::new_from_slice(&salt).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    mac.update(password.as_bytes());
    let result = mac.finalize();
    let hash_bytes = result.into_bytes();
    let password_hash = format!("{}:{}", encode(salt), encode(hash_bytes));

    Ok(password_hash)
}

pub async fn authorization_middleware(
    State(state): State<Arc<AppState>>,
    mut req: Request,
    next: Next,
) -> Result<Response<Body>, StatusCode> {
    let auth_header = req.headers().get(http::header::AUTHORIZATION);
    let auth_header = match auth_header {
        Some(header) => header.to_str().map_err(|_| StatusCode::UNAUTHORIZED)?,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    let mut parts = auth_header.split_whitespace();
    let scheme = parts.next().unwrap_or("");
    let token = parts.next().unwrap_or("");

    if scheme != "Bearer" {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let decoding_key = &state.jwt_secret.decoding.clone();

    let token_data = decode_jwt(token, decoding_key).map_err(|_| StatusCode::UNAUTHORIZED)?;

    req.extensions_mut().insert(token_data.claims.sub);

    Ok(next.run(req).await)
}
