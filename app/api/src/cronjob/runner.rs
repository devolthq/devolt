use std::collections::HashSet;
use std::sync::{Arc, Mutex};

use anchor_client::{
    solana_sdk::{commitment_config::CommitmentConfig, signature::Keypair},
    Client, Cluster,
};
use payment_engine::{DeVoltEscrow, EscrowState};
use tokio::{
    task,
    time::{sleep, Duration},
};

use crate::{db::AppState, solana::PaymentEngineService};

pub fn run(app_state: Arc<AppState>) {
    let devolt_bytes = app_state.devolt_bytes.clone();
    let url = Arc::new(app_state.payment_engine_service_url.clone());
    let processing_transactions = Arc::new(Mutex::new(HashSet::new()));

    task::spawn(async move {
        let mut retries = 0;
        loop {
            let delay = Duration::from_secs(5 * (2_u64.pow(retries)));
            sleep(delay).await;
            let success = check_for_confirmations(
                devolt_bytes.clone(),
                url.clone(),
                processing_transactions.clone(),
            )
            .await;
            if success {
                retries = 0;
            } else {
                retries += 1;
            }
        }
    });
}

async fn check_for_confirmations(
    devolt_bytes: Vec<u8>,
    url: Arc<String>,
    processing_transactions: Arc<Mutex<HashSet<String>>>,
) -> bool {
    let devolt = match Keypair::from_bytes(&devolt_bytes) {
        Ok(keypair) => keypair,
        Err(e) => {
            eprintln!("Failed to create devolt keypair: {:?}", e);
            return false;
        }
    };
    let program_id = payment_engine::ID;
    let cluster = Cluster::Localnet;
    let client = Client::new_with_options(cluster, &devolt, CommitmentConfig::processed());
    let program = match client.program(program_id) {
        Ok(program) => program,
        Err(e) => {
            eprintln!("Failed to get program: {:?}", e);
            return false;
        }
    };

    let accounts = match program.accounts::<DeVoltEscrow>(vec![]).await {
        Ok(accounts) => accounts,
        Err(e) => {
            eprintln!("Failed to get accounts: {:?}", e);
            return false;
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

            // match account.transaction {
                // payment_engine::TransactionType::Buy => {
                //     println!("Confirmation needed for buying escrow: {:?}", pubkey);
                //     let cloned_url = url.clone();
                //     let processing_transactions_clone = processing_transactions.clone();
                //     task::spawn(async move {
                //         let pes = PaymentEngineService::new(&cloned_url);
                //         let response = pes.confirm_buying(pubkey_string.clone()).await;

                //         match response {
                //             Ok(signature) => {
                //                 println!("Confirmed buying: {:?}", signature);
                //             }
                //             Err(e) => {
                //                 eprintln!("Failed to confirm buying: {:?}", e);
                //             }
                //         }

                //         let mut processing_transactions_guard =
                //             processing_transactions_clone.lock().unwrap();
                //         processing_transactions_guard.remove(&pubkey_string);
                //     });
                // }
                // // payment_engine::TransactionType::Sell => {}
                // payment_engine::TransactionType::Sell => {
                //     println!("Confirmation needed for selling escrow: {:?}", pubkey);
                //     let cloned_url = url.clone();
                //     let processing_transactions_clone = processing_transactions.clone();
                //     task::spawn(async move {
                //         let pes = PaymentEngineService::new(&cloned_url);
                //         let response = pes.confirm_selling(pubkey_string.clone()).await;

                //         match response {
                //             Ok(signature) => {
                //                 println!("Confirmed selling: {:?}", signature);
                //             }
                //             Err(e) => {
                //                 eprintln!("Failed to confirm selling: {:?}", e);
                //             }
                //         }

                //         let mut processing_transactions_guard =
                //             processing_transactions_clone.lock().unwrap();
                //         processing_transactions_guard.remove(&pubkey_string);
                //     });
                // }
            // }
        }
    }
    true
}
