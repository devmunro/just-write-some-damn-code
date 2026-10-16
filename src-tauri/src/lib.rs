use serde::{Deserialize, Serialize};
use url::Url;

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct OllamaMessage {
    role: String,
    content: String,
}

#[derive(Debug, Serialize)]
struct OllamaChatRequest {
    model: String,
    messages: Vec<OllamaMessage>,
    stream: bool,
    format: String,
}

#[derive(Debug, Deserialize)]
struct OllamaChatResponse {
    message: Option<OllamaResponseMessage>,
}

#[derive(Debug, Deserialize)]
struct OllamaResponseMessage {
    content: String,
}

#[tauri::command]
async fn ollama_chat(
    base_url: String,
    model: String,
    messages: Vec<OllamaMessage>,
) -> Result<String, String> {
    let base = Url::parse(base_url.trim()).map_err(|error| format!("Invalid Ollama URL: {error}"))?;
    if base.scheme() != "http" && base.scheme() != "https" {
        return Err("Ollama URL must start with http:// or https://.".to_string());
    }

    let endpoint = base
        .join("/api/chat")
        .map_err(|error| format!("Invalid Ollama API URL: {error}"))?;

    let request = OllamaChatRequest {
        model,
        messages,
        stream: false,
        format: "json".to_string(),
    };

    let response = reqwest::Client::new()
        .post(endpoint)
        .json(&request)
        .send()
        .await
        .map_err(|error| format!("Could not reach Ollama: {error}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("Ollama returned {status}: {body}"));
    }

    let body: OllamaChatResponse = response
        .json()
        .await
        .map_err(|error| format!("Could not parse Ollama response: {error}"))?;

    body.message
        .map(|message| message.content)
        .ok_or_else(|| "Ollama returned no message content.".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![tauri_plugin_sql::Migration {
        version: 1,
        description: "create challenge history table",
        sql: "
            CREATE TABLE IF NOT EXISTS challenge_history (
                id TEXT PRIMARY KEY,
                challenge_text TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
        ",
        kind: tauri_plugin_sql::MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:practice.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![ollama_chat])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
