use anchor_client::solana_sdk::{signature::Keypair, signer::Signer};
use sqlx::sqlite::SqlitePool;
use uuid::Uuid;

use crate::models::User;

pub async fn create_user(
    pool: &SqlitePool,
    name: &str,
    email: &str,
    password_hash: &str,
) -> Result<User, sqlx::Error> {
    let keypair = Keypair::new();
    let public_key = keypair.pubkey().to_string();
    let private_key = keypair.to_bytes().to_vec();

    let user = User {
        id: Uuid::new_v4().to_string(),
        name: name.to_string(),
        email: email.to_string(),
        password_hash: password_hash.to_string(),
        public_key,
        private_key,
    };

    sqlx::query(
        "INSERT INTO users (id, name, email, password_hash, public_key, private_key) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
    )
    .bind(&user.id.to_string())
    .bind(&user.name)
    .bind(&user.email)
    .bind(&user.password_hash)
    .bind(&user.public_key)
    .bind(&user.private_key)
    .execute(pool)
    .await?;

    Ok(user)
}

pub async fn get_user_by_id(pool: &SqlitePool, user_id: &String) -> Result<User, sqlx::Error> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?1")
        .bind(user_id)
        .fetch_one(pool)
        .await?;

    Ok(user)
}

pub async fn get_user_by_email(pool: &SqlitePool, email: &String) -> Result<User, sqlx::Error> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = ?1")
        .bind(email)
        .fetch_one(pool)
        .await?;

    Ok(user)
}

pub async fn update_user(
    pool: &SqlitePool,
    user_id: &String,
    name: Option<String>,
    email: Option<String>,
) -> Result<User, sqlx::Error> {
    if let Some(name) = name {
        sqlx::query("UPDATE users SET name = ?1 WHERE id = ?2")
            .bind(name.clone())
            .bind(user_id)
            .execute(pool)
            .await?;
    }
    println!("updated user name");

    if let Some(email) = email {
        sqlx::query("UPDATE users SET email = ?1 WHERE id = ?2")
            .bind(email.clone())
            .bind(user_id)
            .execute(pool)
            .await?;
    }
    println!("updated user email");

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?1")
        .bind(user_id)
        .fetch_one(pool)
        .await?;

    Ok(user)
}

pub async fn delete_user(pool: &SqlitePool, user_id: &String) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM users WHERE id = ?1")
        .bind(user_id)
        .execute(pool)
        .await?;

    Ok(())
}
