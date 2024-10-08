use anchor_client::solana_sdk::{pubkey::Pubkey, signature::Keypair, signer::Signer};
use hex::encode;
use hmac::{Hmac, Mac};
use jsonwebtoken::{DecodingKey, EncodingKey};
use rand::Rng;
use sha2::Sha256;
use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::time::Duration;

use crate::models::User;

type HmacSha256 = Hmac<Sha256>;

pub struct JwtSecret {
    pub encoding: EncodingKey,
    pub decoding: DecodingKey,
}

pub struct AppState {
    pub db_pool: SqlitePool,
    pub devolt_bytes: Vec<u8>,
    pub payment_engine_service_url: String,
    pub jwt_secret: JwtSecret,
    pub usdc_mint: Pubkey,
    pub volt_mint: Pubkey,
}

impl AppState {
    pub async fn new() -> Self {
        let private_key_str =
            std::env::var("DEVOLT_PRIVATE_KEY").expect("DEVOLT_PRIVATE_KEY is not set");
        let usdc_mint = std::env::var("USDC_MINT")
            .expect("USDC_MINT is not set")
            .parse()
            .unwrap();
        let volt_mint = std::env::var("VOLT_MINT")
            .expect("VOLT_MINT is not set")
            .parse()
            .unwrap();
        let payment_engine_service_url = std::env::var("PAYMENT_ENGINE_SERVICE_URL")
            .expect("PAYMENT_ENGINE_SERVICE_URL is not set");

        let devolt_bytes = private_key_str
            .trim_matches(|c| c == '[' || c == ']')
            .split(',')
            .map(|s| {
                s.trim()
                    .parse()
                    .expect("Invalid byte in DEVOLT_PRIVATE_KEY")
            })
            .collect();

        let jwt_secret_str = std::env::var("JWT_SECRET").expect("JWT_SECRET is not set");
        let jwt_secret = JwtSecret {
            encoding: EncodingKey::from_secret(jwt_secret_str.as_ref()),
            decoding: DecodingKey::from_secret(jwt_secret_str.as_ref()),
        };

        let db_pool = SqlitePoolOptions::new()
            .max_connections(5)
            .acquire_timeout(Duration::from_secs(3))
            .connect("sqlite://my_database.db")
            .await
            .expect("Failed to connect to SQLite");

        create_table(&db_pool).await;

        let users = sqlx::query_as::<_, User>("SELECT * FROM users")
            .fetch_all(&db_pool)
            .await
            .expect("Failed to fetch users");
        for user in users {
            println!("{:?}", user.public_key);
        }

        AppState {
            db_pool,
            devolt_bytes,
            jwt_secret,
            usdc_mint,
            volt_mint,
            payment_engine_service_url,
        }
    }
}

async fn create_table(pool: &SqlitePool) {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            public_key TEXT NOT NULL,
            private_key BLOB NOT NULL
        );
        "#,
    )
    .execute(pool)
    .await
    .expect("Failed to create users table");

    let producer_keypair_bytes: Vec<u8> = std::env::var("PRODUCER_KEYPAIR_BYTES")
        .expect("PRODUCER_KEYPAIR_BYTES is not set")
        .trim_matches(|c| c == '[' || c == ']')
        .split(',')
        .map(|s| {
            s.trim()
                .parse()
                .expect("Invalid byte in PRODUCER_KEYPAIR_BYTES")
        })
        .collect();

    let consumer_keypair_bytes: Vec<u8> = std::env::var("CONSUMER_KEYPAIR_BYTES")
        .expect("CONSUMER_KEYPAIR_BYTES is not set")
        .trim_matches(|c| c == '[' || c == ']')
        .split(',')
        .map(|s| {
            s.trim()
                .parse()
                .expect("Invalid byte in CONSUMER_KEYPAIR_BYTES")
        })
        .collect();

    let producer_keypair =
        Keypair::from_bytes(&producer_keypair_bytes).expect("Failed to create producer Keypair");
    let consumer_keypair =
        Keypair::from_bytes(&consumer_keypair_bytes).expect("Failed to create consumer Keypair");

    let users = vec![
        (
            "Matheus Macedo Santos",
            "matheus@email.com",
            "password",
            consumer_keypair,
        ),
        (
            "Marcelo Gomes Feitoza",
            "marcelo@email.com",
            "password",
            producer_keypair,
        ),
    ];

    for (index, (name, email, password, keypair)) in users.iter().enumerate() {
        println!("{:?}", keypair.to_base58_string());

        let public_key = keypair.pubkey().to_string();
        let private_key = keypair.to_bytes().to_vec();

        let salt: [u8; 16] = rand::thread_rng().gen();

        let mut mac = HmacSha256::new_from_slice(&salt).expect("HMAC can take key of any size");
        mac.update(password.as_bytes());
        let result = mac.finalize();
        let hash_bytes = result.into_bytes();

        let password_hash = format!("{}:{}", encode(salt), encode(hash_bytes));

        sqlx::query(
            "INSERT OR IGNORE INTO users (id, name, email, password_hash, public_key, private_key) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        )
        .bind(index.to_string() /* Uuid::new_v4().to_string() */)
        .bind(name)
        .bind(email)
        .bind(password_hash)
        .bind(public_key)
        .bind(private_key)
        .execute(pool)
        .await
        .expect("Failed to insert user");
    }
}
