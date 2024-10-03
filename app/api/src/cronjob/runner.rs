use std::sync::Arc;

use anchor_client::{
    solana_sdk::{commitment_config::CommitmentConfig, signature::Keypair},
    Client, Cluster,
};
use payment_engine::{DeVoltEscrow, EscrowState};
use tokio::{
    task,
    time::{interval, Duration},
};

use crate::db::AppState;

pub fn run(app_state: Arc<AppState>) {
    let devolt_bytes = app_state.devolt_bytes.clone();

    let mut interval = interval(Duration::from_secs(5));

    task::spawn(async move {
        loop {
            interval.tick().await;
            check_for_confirmations(devolt_bytes.clone()).await;
        }
    });
}

async fn check_for_confirmations(devolt_bytes: Vec<u8>) {
    let devolt = Keypair::from_bytes(&devolt_bytes).expect("Failed to create devolt keypair");
    let program_id = payment_engine::ID;
    let cluster = Cluster::Localnet;
    let client = Client::new_with_options(cluster, &devolt, CommitmentConfig::processed());
    let program = client.program(program_id).expect("Failed to get program");

    let accounts = program
        .accounts::<DeVoltEscrow>(vec![])
        .await
        .expect("Failed to get accounts");

    println!("\nChecking for confirmations");

    for (pubkey, account) in accounts {
        if account.state == EscrowState::Pending {
            match account.transaction {
                payment_engine::TransactionType::Buy => {
                    println!("Confirmation needed for buying escrow: {:?}", pubkey);
                    // let signature = PaymentEngineService::confirm_buying(pubkey, account)
                    //     .await
                    //     .expect("Failed to confirm buying");
                    // println!("Confirmed buying: {:?}", signature);
                }
                payment_engine::TransactionType::Sell => {
                    println!("Confirmation needed for selling escrow: {:?}", pubkey);
                    // let signature = PaymentEngineService::confirm_selling(pubkey, account)
                    //     .await
                    //     .expect("Failed to confirm selling");
                    // println!("Confirmed selling: {:?}", signature);
                }
            }
        }
    }
}
