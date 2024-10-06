use anchor_client::solana_sdk::{pubkey::Pubkey, signature::Keypair, signer::Signer};
use hex::encode;
use hmac::{Hmac, Mac};
use jsonwebtoken::{DecodingKey, EncodingKey};
use rand::Rng;
use sha2::Sha256;
use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::time::Duration;

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
            .connect("sqlite://my_database.db") // .connect("sqlite::memory:")
            .await
            .expect("Failed to connect to SQLite");

        create_table(&db_pool).await;

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

    let users = vec![
        (
            "Matheus Macedo Santos",
            "matheus@email.com",
            "password",
            Keypair::from_bytes(&[
                121, 225, 52, 151, 9, 51, 15, 189, 164, 202, 191, 246, 15, 218, 89, 28, 208, 161,
                240, 200, 2, 231, 81, 66, 218, 90, 141, 222, 95, 25, 9, 144, 9, 44, 56, 131, 62,
                16, 193, 9, 61, 110, 143, 41, 117, 75, 164, 61, 187, 83, 242, 209, 132, 204, 39,
                163, 220, 40, 111, 20, 126, 79, 28, 99,
            ])
            .unwrap(), // con9L1bjbUHHJiLLBbzBwWXmyerS54Hw5kEhvf4YkQS
        ),
        (
            "Marcelo Gomes Feitoza",
            "marcelo@email.com",
            "password",
            Keypair::from_bytes(&[
                239, 244, 218, 57, 218, 179, 145, 208, 32, 225, 107, 208, 180, 142, 142, 181, 121,
                154, 217, 67, 212, 74, 19, 23, 115, 16, 254, 206, 40, 85, 201, 78, 12, 66, 158, 97,
                110, 253, 230, 194, 145, 180, 124, 92, 250, 137, 222, 58, 192, 93, 56, 208, 134,
                34, 192, 85, 113, 32, 168, 50, 209, 111, 105, 107,
            ])
            .unwrap(), // prozjgfrKQP59jGSXJkNKNSVFKCZNnS7FRqAt7dnvpA
        ),
    ];

    for (index, (name, email, password, keypair)) in users.iter().enumerate() {
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
