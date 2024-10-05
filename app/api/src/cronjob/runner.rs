use std::collections::HashSet;
use std::sync::{Arc, Mutex};

use anchor_client::{
    solana_sdk::{commitment_config::CommitmentConfig, signature::Keypair},
    Client, Cluster,
};
use payment_engine::{DeVoltEscrow, EscrowState};
use tokio::{
    task,
    time::{interval, Duration},
};

use crate::{db::AppState, solana::PaymentEngineService};

pub fn run(app_state: Arc<AppState>) {
    let devolt_bytes = app_state.devolt_bytes.clone();
    let url = Arc::new(app_state.payment_engine_service_url.clone());
    let processing_transactions = Arc::new(Mutex::new(HashSet::new()));

    let mut interval = interval(Duration::from_secs(30));

    task::spawn(async move {
        loop {
            interval.tick().await;
            check_for_confirmations(
                devolt_bytes.clone(),
                url.clone(),
                processing_transactions.clone(),
            )
            .await;
        }
    });
}

async fn check_for_confirmations(
    devolt_bytes: Vec<u8>,
    url: Arc<String>,
    processing_transactions: Arc<Mutex<HashSet<String>>>,
) {
    let devolt = Keypair::from_bytes(&devolt_bytes).expect("Failed to create devolt keypair");
    let program_id = payment_engine::ID;
    let cluster = 
        // Cluster::Testnet;
        Cluster::Localnet;
    let client = Client::new_with_options(cluster, &devolt, CommitmentConfig::processed());
    let program = match client.program(program_id) {
        Ok(program) => program,
        Err(e) => {
            eprintln!("Failed to get program: {:?}", e);
            return;
        }
    };

    let accounts = match program.accounts::<DeVoltEscrow>(vec![]).await {
        Ok(accounts) => accounts,
        Err(e) => {
            eprintln!("Failed to get accounts: {:?}", e);
            return;
        }
    };

    for (pubkey, account) in accounts {
        if account.state == EscrowState::Pending {
            let pubkey_string = pubkey.to_string();

            let mut processing_transactions_guard = processing_transactions.lock().unwrap();
            if processing_transactions_guard.contains(&pubkey_string) {
                continue;
            }
            processing_transactions_guard.insert(pubkey_string.clone());
            drop(processing_transactions_guard);

            match account.transaction {
                payment_engine::TransactionType::Buy => {
                    println!("Confirmation needed for buying escrow: {:?}", pubkey);
                    let cloned_url = url.clone();
                    let processing_transactions_clone = processing_transactions.clone();
                    task::spawn(async move {
                        let pes = PaymentEngineService::new(&cloned_url);
                        let signature = pes.confirm_buying(pubkey_string.clone()).await;
                        match signature {
                            Ok(signature) => {
                                println!("Confirmed buying: {:?}", signature);
                            }
                            Err(e) => {
                                eprintln!("Failed to confirm buying: {:?}", e);
                            }
                        }
                        let mut processing_transactions_guard = processing_transactions_clone.lock().unwrap();
                        processing_transactions_guard.remove(&pubkey_string);
                    });
                }
                payment_engine::TransactionType::Sell => {
                    println!("Confirmation needed for selling escrow: {:?}", pubkey);
                    let cloned_url = url.clone();
                    let processing_transactions_clone = processing_transactions.clone();
                    task::spawn(async move {
                        let pes = PaymentEngineService::new(&cloned_url);
                        let signature = pes.confirm_selling(pubkey_string.clone()).await;
                        match signature {
                            Ok(signature) => {
                                println!("Confirmed selling: {:?}", signature);
                            }
                            Err(e) => {
                                eprintln!("Failed to confirm selling: {:?}", e);
                            }
                        }
                        let mut processing_transactions_guard = processing_transactions_clone.lock().unwrap();
                        processing_transactions_guard.remove(&pubkey_string);
                    });
                }
            }
        }
    }
}