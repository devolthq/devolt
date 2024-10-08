use anchor_client::solana_sdk::{
    signature::{Keypair, Signature},
};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::{str::FromStr, time::Duration};

use crate::handlers::{
    payment_engine_handler::{BuyEnergyRequest, SellEnergyRequest},
    ErrorResponse,
};

#[derive(Debug, Serialize)]
struct Payload {
    jsonrpc: String,
    method: String,
    params: serde_json::Value,
    id: u64,
}

#[derive(Debug, Deserialize)]
struct ResponseResult {
    transaction_id: String,
    escrow_public_key: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ApiResponse {
    jsonrpc: String,
    result: Option<ResponseResult>,
    error: Option<serde_json::Value>,
    id: u64,
}

#[derive(Debug, Serialize)]
struct ConfirmSellingPayload {
    escrowPublicKey: String,
}

#[derive(Debug, Serialize)]
struct ConfirmBuyingPayload {
    escrowPublicKey: String,
}

#[derive(Debug)]
pub struct PaymentEngineService {
    client: Client,
    url: String,
}

#[derive(Debug, Deserialize)]
pub struct Response {
    pub jsonrpc: String,
    pub result: serde_json::Value,
    pub id: u64,
}

#[derive(Serialize, Debug)]
pub struct SellEnergy {
    seed: u64,
    usdc_amount: u64,
    producer_keypair_bytes: Vec<u8>,
}

impl PaymentEngineService {
    pub fn new(url: &str) -> Self {
        PaymentEngineService {
            client: Client::new(),
            url: url.to_string(),
        }
    }

    pub async fn sell_energy(
        &self,
        producer_keypair: &Keypair,
        params: SellEnergyRequest,
    ) -> Result<(Signature, String), ErrorResponse> {
        let producer_keypair_bytes = producer_keypair.to_bytes().to_vec();
        let payload = Payload {
            jsonrpc: "2.0".to_string(),
            method: "sell_energy".to_string(),
            params: json!({
                "seed": std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                "usdcAmount": params.usdc_amount,
                "producerKeypairBytes": producer_keypair_bytes,
            }),
            id: 1,
        };

        let response = self
            .client
            .post(&self.url)
            .timeout(Duration::from_secs(12000))
            .json(&payload)
            .send()
            .await
            .map_err(|e| {
                eprintln!("Error sending request: {}", e);
                ErrorResponse {
                    status_code: 500,
                    error: "Failed to send request to payment engine".to_string(),
                }
            })?;

        println!("Received response status: {}", response.status());

        let response_json: ApiResponse = response.json().await.map_err(|e| {
            eprintln!("Error parsing response: {}", e);
            ErrorResponse {
                status_code: 500,
                error: "Failed to parse response from payment engine".to_string(),
            }
        })?;

        if let Some(result) = response_json.result {
            let transaction_id = result.transaction_id;
            let escrow_public_key = result.escrow_public_key.unwrap_or_default();
            let signature = Signature::from_str(&transaction_id).map_err(|e| {
                eprintln!("Error parsing signature: {}", e);
                ErrorResponse {
                    status_code: 500,
                    error: "Failed to parse transaction signature".to_string(),
                }
            })?;
            Ok((signature, escrow_public_key))
        } else if let Some(error) = response_json.error {
            let error_message = error
                .get("message")
                .and_then(|v| v.as_str())
                .unwrap_or("Unknown error");
            eprintln!("Error from payment engine: {}", error_message);
            Err(ErrorResponse {
                status_code: 500,
                error: "Payment engine returned an error".to_string(),
            })
        } else {
            eprintln!("Invalid response from server");
            Err(ErrorResponse {
                status_code: 500,
                error: "Invalid response from payment engine".to_string(),
            })
        }
    }

    pub async fn buy_energy(
        &self,
        consumer_keypair: &Keypair,
        params: BuyEnergyRequest,
    ) -> Result<(Signature, String), ErrorResponse> {
        let consumer_keypair_bytes = consumer_keypair.to_bytes().to_vec();
        let payload = Payload {
            jsonrpc: "2.0".to_string(),
            method: "buy_energy".to_string(),
            params: json!({
                "seed": std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                "energyAmount": params.energy_amount,
                "consumerKeypairBytes": consumer_keypair_bytes
            }),
            id: 1,
        };

        let response = self
            .client
            .post(&self.url)
            .timeout(Duration::from_secs(12000))
            .json(&payload)
            .send()
            .await
            .map_err(|e| {
                eprintln!("Error sending request: {}", e);
                ErrorResponse {
                    status_code: 500,
                    error: "Failed to send request to payment engine".to_string(),
                }
            })?;

        println!("Received response status: {}", response.status());

        let response_json: ApiResponse = response.json().await.map_err(|e| {
            eprintln!("Error parsing response: {}", e);
            ErrorResponse {
                status_code: 500,
                error: "Failed to parse response from payment engine".to_string(),
            }
        })?;

        if let Some(result) = response_json.result {
            let transaction_id = result.transaction_id;
            let escrow_public_key = result.escrow_public_key.unwrap_or_default();
            let signature = Signature::from_str(&transaction_id).map_err(|e| {
                eprintln!("Error parsing signature: {}", e);
                ErrorResponse {
                    status_code: 500,
                    error: "Failed to parse transaction signature".to_string(),
                }
            })?;
            Ok((signature, escrow_public_key))
        } else if let Some(error) = response_json.error {
            let error_message = error
                .get("message")
                .and_then(|v| v.as_str())
                .unwrap_or("Unknown error");
            eprintln!("Error from payment engine: {}", error_message);
            Err(ErrorResponse {
                status_code: 500,
                error: "Payment engine returned an error".to_string(),
            })
        } else {
            eprintln!("Invalid response from server");
            Err(ErrorResponse {
                status_code: 500,
                error: "Invalid response from payment engine".to_string(),
            })
        }
    }

    pub async fn confirm_selling(
        &self,
        escrow_public_key: String,
    ) -> Result<Signature, ErrorResponse> {
        let payload = ConfirmSellingPayload {
            escrowPublicKey: escrow_public_key,
        };

        let request_payload = Payload {
            jsonrpc: "2.0".to_string(),
            method: "confirm_selling".to_string(),
            params: serde_json::to_value(payload).map_err(|e| {
                eprintln!("Error serializing payload: {}", e);
                ErrorResponse {
                    status_code: 500,
                    error: "Failed to serialize request payload".to_string(),
                }
            })?,
            id: 1,
        };

        let response = self
            .client
            .post(&self.url)
            .timeout(Duration::from_secs(12000))
            .json(&request_payload)
            .send()
            .await
            .map_err(|e| {
                eprintln!("Error sending request: {}", e);
                ErrorResponse {
                    status_code: 500,
                    error: "Failed to send request to payment engine".to_string(),
                }
            })?;

        println!("Received response status: {}", response.status());

        let response_json: ApiResponse = response.json().await.map_err(|e| {
            eprintln!("Error parsing response: {}", e);
            ErrorResponse {
                status_code: 500,
                error: "Failed to parse response from payment engine".to_string(),
            }
        })?;

        if let Some(result) = response_json.result {
            let transaction_id = result.transaction_id;
            Signature::from_str(&transaction_id).map_err(|e| {
                eprintln!("Error parsing signature: {}", e);
                ErrorResponse {
                    status_code: 500,
                    error: "Failed to parse transaction signature".to_string(),
                }
            })
        } else if let Some(error) = response_json.error {
            let error_message = error
                .get("message")
                .and_then(|v| v.as_str())
                .unwrap_or("Unknown error");
            eprintln!("Error from payment engine: {}", error_message);
            Err(ErrorResponse {
                status_code: 500,
                error: "Payment engine returned an error".to_string(),
            })
        } else {
            eprintln!("Invalid response from server");
            Err(ErrorResponse {
                status_code: 500,
                error: "Invalid response from payment engine".to_string(),
            })
        }
    }

    pub async fn confirm_buying(
        &self,
        escrow_public_key: String,
    ) -> Result<Signature, ErrorResponse> {
        let payload = ConfirmBuyingPayload {
            escrowPublicKey: escrow_public_key,
        };

        let request_payload = Payload {
            jsonrpc: "2.0".to_string(),
            method: "confirm_buying".to_string(),
            params: serde_json::to_value(payload).map_err(|e| {
                eprintln!("Error serializing payload: {}", e);
                ErrorResponse {
                    status_code: 500,
                    error: "Failed to serialize request payload".to_string(),
                }
            })?,
            id: 1,
        };

        let response = self
            .client
            .post(&self.url)
            .timeout(Duration::from_secs(12000))
            .json(&request_payload)
            .send()
            .await
            .map_err(|e| {
                eprintln!("Error sending request: {}", e);
                ErrorResponse {
                    status_code: 500,
                    error: "Failed to send request to payment engine".to_string(),
                }
            })?;

        println!("Received response status: {}", response.status());

        let response_json: ApiResponse = response.json().await.map_err(|e| {
            eprintln!("Error parsing response: {}", e);
            ErrorResponse {
                status_code: 500,
                error: "Failed to parse response from payment engine".to_string(),
            }
        })?;

        if let Some(result) = response_json.result {
            let transaction_id = result.transaction_id;
            Signature::from_str(&transaction_id).map_err(|e| {
                eprintln!("Error parsing signature: {}", e);
                ErrorResponse {
                    status_code: 500,
                    error: "Failed to parse transaction signature".to_string(),
                }
            })
        } else if let Some(error) = response_json.error {
            let error_message = error
                .get("message")
                .and_then(|v| v.as_str())
                .unwrap_or("Unknown error");
            eprintln!("Error from payment engine: {}", error_message);
            Err(ErrorResponse {
                status_code: 500,
                error: "Payment engine returned an error".to_string(),
            })
        } else {
            eprintln!("Invalid response from server");
            Err(ErrorResponse {
                status_code: 500,
                error: "Invalid response from payment engine".to_string(),
            })
        }
    }
}