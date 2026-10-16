use std::{
    io::{Read, Write},
    path::{Path, PathBuf},
    process::{Command, Stdio},
    sync::{atomic::{AtomicBool, Ordering}, Arc},
    thread,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{AppHandle, Manager};
use url::Url;

const RUNNER_IMAGE: &str = "jwsdc-runner:1.0.0";
const MAX_SOURCE_BYTES: usize = 64 * 1024;
const MAX_CASES: usize = 20;
const MAX_JSON_BYTES: usize = 64 * 1024;
const MAX_PROCESS_OUTPUT: usize = 128 * 1024;
const RUN_TIMEOUT: Duration = Duration::from_secs(4);

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

#[derive(Debug, Deserialize)]
struct OllamaTagsResponse {
    models: Option<Vec<OllamaModel>>,
}

#[derive(Debug, Deserialize)]
struct OllamaModel {
    name: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SandboxStatus {
    engine: Option<String>,
    image_available: bool,
    image_tag: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RunRequest {
    exercise_id: String,
    language: String,
    source: String,
    cases: Vec<ExampleCase>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct ExampleCase {
    id: String,
    label: String,
    input: Value,
    expected_output: Value,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct CaseResult {
    id: String,
    label: String,
    passed: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    actual_output: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct RunResult {
    status: String,
    cases: Vec<CaseResult>,
    stdout: String,
    stderr: String,
    duration_ms: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    message: Option<String>,
}

#[tauri::command]
async fn ollama_chat(
    base_url: String,
    model: String,
    messages: Vec<OllamaMessage>,
) -> Result<String, String> {
    let endpoint = local_ollama_endpoint(&base_url, "/api/chat")?;
    if model.trim().is_empty() || model.len() > 160 {
        return Err("Enter a valid installed Ollama model name.".to_string());
    }
    if messages.is_empty() || messages.len() > 20 || messages.iter().any(|message| {
        !matches!(message.role.as_str(), "system" | "user") || message.content.len() > 32_000
    }) {
        return Err("The local AI request is outside the supported size.".to_string());
    }

    let request = OllamaChatRequest { model, messages, stream: false, format: "json".to_string() };
    let response = local_client(Duration::from_secs(120))?
        .post(endpoint)
        .json(&request)
        .send()
        .await
        .map_err(|error| format!("Could not reach local Ollama: {error}"))?;
    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("Ollama returned {status}: {}", truncate(&body, 1_500)));
    }
    let bytes = response.bytes().await.map_err(|error| format!("Could not read Ollama response: {error}"))?;
    if bytes.len() > 128_000 { return Err("Ollama response exceeded 128 KB.".to_string()); }
    let body: OllamaChatResponse = serde_json::from_slice(&bytes)
        .map_err(|error| format!("Could not parse Ollama response: {error}"))?;
    body.message.map(|message| message.content).ok_or_else(|| "Ollama returned no message content.".to_string())
}

#[tauri::command]
async fn ollama_models(base_url: String) -> Result<Vec<String>, String> {
    let endpoint = local_ollama_endpoint(&base_url, "/api/tags")?;
    let response = local_client(Duration::from_secs(10))?.get(endpoint).send().await
        .map_err(|error| format!("Could not reach local Ollama: {error}"))?;
    if !response.status().is_success() { return Err(format!("Ollama returned {}.", response.status())); }
    let bytes = response.bytes().await.map_err(|error| format!("Could not read Ollama model list: {error}"))?;
    if bytes.len() > 256_000 { return Err("Ollama model list exceeded 256 KB.".to_string()); }
    let result: OllamaTagsResponse = serde_json::from_slice(&bytes).map_err(|error| format!("Could not parse Ollama model list: {error}"))?;
    Ok(result.models.unwrap_or_default().into_iter().map(|model| model.name).collect())
}

#[tauri::command]
fn sandbox_status() -> SandboxStatus {
    let engine = detect_engine();
    let image_available = engine.as_deref().is_some_and(|engine| image_exists(engine));
    SandboxStatus { engine, image_available, image_tag: RUNNER_IMAGE.to_string() }
}

#[tauri::command]
async fn setup_sandbox(app: AppHandle) -> Result<SandboxStatus, String> {
    tauri::async_runtime::spawn_blocking(move || setup_sandbox_blocking(&app))
        .await.map_err(|error| format!("Runner setup task failed: {error}"))?
}

#[tauri::command]
async fn run_code(request: RunRequest) -> Result<RunResult, String> {
    validate_run_request(&request)?;
    tauri::async_runtime::spawn_blocking(move || run_code_blocking(request))
        .await.map_err(|error| format!("Runner process task failed: {error}"))?
}

fn local_ollama_endpoint(base_url: &str, path: &str) -> Result<Url, String> {
    let base = Url::parse(base_url.trim()).map_err(|error| format!("Invalid Ollama URL: {error}"))?;
    let host = base.host_str().unwrap_or_default().trim_start_matches('[').trim_end_matches(']').to_ascii_lowercase();
    if base.scheme() != "http" || !matches!(host.as_str(), "localhost" | "127.0.0.1" | "::1") ||
        base.username() != "" || base.password().is_some() {
        return Err("Ollama must use HTTP on localhost, 127.0.0.1, or ::1.".to_string());
    }
    base.join(path).map_err(|error| format!("Invalid local Ollama API URL: {error}"))
}

fn local_client(timeout: Duration) -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .timeout(timeout)
        .build()
        .map_err(|error| format!("Could not prepare local Ollama client: {error}"))
}

fn detect_engine() -> Option<String> {
    for candidate in ["podman", "docker"] {
        if Command::new(candidate).arg("info").stdout(Stdio::null()).stderr(Stdio::null()).status().is_ok_and(|status| status.success()) {
            return Some(candidate.to_string());
        }
    }
    None
}

fn image_exists(engine: &str) -> bool {
    Command::new(engine).args(["image", "inspect", RUNNER_IMAGE]).stdout(Stdio::null()).stderr(Stdio::null())
        .status().is_ok_and(|status| status.success())
}

fn setup_sandbox_blocking(app: &AppHandle) -> Result<SandboxStatus, String> {
    let engine = detect_engine().ok_or_else(|| "Start Podman or Docker before setting up the runner.".to_string())?;
    let runner_dir = runner_resources(app)?;
    let dockerfile = runner_dir.join("Dockerfile");
    if !dockerfile.is_file() { return Err(format!("Runner image recipe was not found at {}.", dockerfile.display())); }
    let output = Command::new(&engine).args(["build", "--pull", "--tag", RUNNER_IMAGE, "--file"])
        .arg(&dockerfile).arg(&runner_dir).output()
        .map_err(|error| format!("Could not start {engine}: {error}"))?;
    if !output.status.success() {
        return Err(format!("Runner image setup failed: {}", truncate(&String::from_utf8_lossy(&output.stderr), 2_000)));
    }
    Ok(SandboxStatus { engine: Some(engine.clone()), image_available: image_exists(&engine), image_tag: RUNNER_IMAGE.to_string() })
}

fn runner_resources(app: &AppHandle) -> Result<PathBuf, String> {
    let packaged = app.path().resource_dir().ok().map(|path| path.join("runner"));
    if let Some(path) = packaged.filter(|path| path.join("Dockerfile").is_file()) { return Ok(path); }
    let development = Path::new(env!("CARGO_MANIFEST_DIR")).join("runner");
    if development.join("Dockerfile").is_file() { return Ok(development); }
    Err("The local runner files are missing from this app package.".to_string())
}

fn validate_run_request(request: &RunRequest) -> Result<(), String> {
    if request.exercise_id.len() > 200 { return Err("Invalid exercise identifier.".to_string()); }
    if !matches!(request.language.as_str(), "python" | "javascript" | "typescript" | "php") {
        return Err("Choose Python, JavaScript, TypeScript, or PHP.".to_string());
    }
    if request.source.trim().is_empty() { return Err("Write code before running examples.".to_string()); }
    if request.source.len() > MAX_SOURCE_BYTES { return Err("Code is limited to 64 KB per run.".to_string()); }
    if request.cases.is_empty() || request.cases.len() > MAX_CASES { return Err("A run needs between 1 and 20 examples.".to_string()); }
    for case in &request.cases {
        let bytes = serde_json::to_vec(case).map_err(|error| format!("Could not encode example: {error}"))?;
        if bytes.len() > MAX_JSON_BYTES { return Err("Each example is limited to 64 KB.".to_string()); }
        if case.id.len() > 200 || case.label.len() > 200 { return Err("Example labels are too long.".to_string()); }
    }
    Ok(())
}

fn run_code_blocking(request: RunRequest) -> Result<RunResult, String> {
    let engine = detect_engine().ok_or_else(|| "Podman or Docker is not running. The editor and local saving still work without it.".to_string())?;
    if !image_exists(&engine) { return Err(format!("Set up the local {RUNNER_IMAGE} image before running code.")); }

    let language = request.language.as_str();
    let extension = match language { "python" => "py", "javascript" => "js", "typescript" => "ts", "php" => "php", _ => unreachable!() };
    let cases = serde_json::to_vec(&request.cases).map_err(|error| format!("Could not encode examples: {error}"))?;
    let archive = make_tar(&[(format!("main.{extension}"), request.source.as_bytes().to_vec()), ("cases.json".to_string(), cases)])?;
    let run_name = format!("jwsdc-{}-{}", std::process::id(), unique_suffix());
    let mut command = Command::new(&engine);
    command.args([
        "run", "--rm", "--name", &run_name,
        "--network=none", "--read-only", "--cap-drop=ALL", "--security-opt=no-new-privileges",
        "--pids-limit=64", "--memory=256m", "--cpus=1", "--user=65534:65534",
        "--tmpfs", "/workspace:rw,noexec,nosuid,size=8m", "--tmpfs", "/tmp:rw,noexec,nosuid,size=16m",
        "--ulimit", "nofile=128:128", "--ulimit", "fsize=1048576:1048576", "-i", RUNNER_IMAGE,
    ]);
    match language {
        "python" => { command.args(["sh", "-c", "tar -xf - -C /workspace && exec python3 /opt/jwsdc/runner.py"]); }
        "javascript" | "typescript" => { command.args(["sh", "-c", &format!("tar -xf - -C /workspace && exec node /opt/jwsdc/runner.mjs {language}")]); }
        "php" => { command.args(["sh", "-c", "tar -xf - -C /workspace && exec php /opt/jwsdc/runner.php"]); }
        _ => unreachable!(),
    }
    command.stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::piped());
    let started = Instant::now();
    let mut child = command.spawn().map_err(|error| format!("Could not start the local container: {error}"))?;
    if let Some(mut stdin) = child.stdin.take() {
        if let Err(error) = stdin.write_all(&archive) {
            let _ = child.kill();
            let _ = child.wait();
            stop_container(&engine, &run_name);
            return Err(format!("Could not send the example to the runner: {error}"));
        }
    }

    let output_overflow = Arc::new(AtomicBool::new(false));
    let stdout = take_output(child.stdout.take().expect("stdout pipe"), output_overflow.clone());
    let stderr = take_output(child.stderr.take().expect("stderr pipe"), output_overflow.clone());
    let mut timed_out = false;
    let mut exceeded_output = false;
    let status = loop {
        if started.elapsed() >= RUN_TIMEOUT { timed_out = true; let _ = child.kill(); stop_container(&engine, &run_name); break child.wait().ok(); }
        if output_overflow.load(Ordering::Relaxed) { exceeded_output = true; let _ = child.kill(); stop_container(&engine, &run_name); break child.wait().ok(); }
        match child.try_wait() {
            Ok(Some(status)) => break Some(status),
            Ok(None) => thread::sleep(Duration::from_millis(15)),
            Err(error) => { let _ = child.kill(); stop_container(&engine, &run_name); return Err(format!("Could not check runner status: {error}")); }
        }
    };
    let stdout = stdout.join().unwrap_or_default();
    let stderr = stderr.join().unwrap_or_default();
    let duration_ms = started.elapsed().as_millis() as u64;
    let stdout_text = String::from_utf8_lossy(&stdout).to_string();
    let stderr_text = String::from_utf8_lossy(&stderr).to_string();

    if timed_out || exceeded_output {
        return Ok(RunResult {
            status: if timed_out { "timeout" } else { "error" }.to_string(), cases: vec![],
            stdout: truncate(&stdout_text, 12_000), stderr: truncate(&stderr_text, 4_000), duration_ms,
            message: Some(if timed_out { "Execution exceeded the 4 second time limit.".to_string() } else { "Output exceeded the 128 KB limit.".to_string() }),
        });
    }

    let parsed = parse_runner_result(&stdout_text);
    let Some((cases, message)) = parsed else {
        let exit = status.map(|status| status.to_string()).unwrap_or_else(|| "unknown status".to_string());
        return Ok(RunResult {
            status: "error".to_string(), cases: vec![], stdout: truncate(&stdout_text, 12_000),
            stderr: truncate(&stderr_text, 4_000), duration_ms,
            message: Some(message_for_exit(&exit, &stderr_text)),
        });
    };
    let all_passed = !cases.is_empty() && cases.iter().all(|case| case.passed);
    let status = if cases.is_empty() { "error" } else if all_passed { "passed" } else { "failed" };
    Ok(RunResult {
        status: status.to_string(), cases, stdout: truncate(&stdout_text, 12_000), stderr: truncate(&stderr_text, 4_000), duration_ms,
        message,
    })
}

fn take_output<R: Read + Send + 'static>(mut reader: R, overflow: Arc<AtomicBool>) -> thread::JoinHandle<Vec<u8>> {
    thread::spawn(move || {
        let mut buffer = Vec::new();
        let mut limited = reader.by_ref().take((MAX_PROCESS_OUTPUT + 1) as u64);
        let _ = limited.read_to_end(&mut buffer);
        if buffer.len() > MAX_PROCESS_OUTPUT { overflow.store(true, Ordering::Relaxed); buffer.truncate(MAX_PROCESS_OUTPUT); }
        buffer
    })
}

fn parse_runner_result(stdout: &str) -> Option<(Vec<CaseResult>, Option<String>)> {
    let marker = "__JWS_RESULT__";
    let line = stdout.lines().rev().find_map(|line| line.find(marker).map(|position| &line[position + marker.len()..]))?;
    let value: Value = serde_json::from_str(line).ok()?;
    let message = value.get("message").and_then(Value::as_str).map(|message| truncate(message, 1_000));
    let rows = value.get("cases")?.as_array()?;
    let cases = rows.iter().map(|row| CaseResult {
        id: row.get("id").and_then(Value::as_str).unwrap_or_default().to_string(),
        label: row.get("label").and_then(Value::as_str).unwrap_or("Example").to_string(),
        passed: row.get("passed").and_then(Value::as_bool).unwrap_or(false),
        actual_output: row.get("actualOutput").cloned(),
        error: row.get("error").and_then(Value::as_str).map(|error| truncate(error, 900)),
    }).collect();
    Some((cases, message))
}

fn message_for_exit(exit: &str, stderr: &str) -> String {
    if !stderr.trim().is_empty() { format!("Runner stopped ({exit}): {}", truncate(stderr.trim(), 700)) }
    else { format!("Runner stopped before returning example results ({exit}). Check for a syntax or runtime error.") }
}

fn stop_container(engine: &str, name: &str) {
    let _ = Command::new(engine).args(["kill", name]).stdout(Stdio::null()).stderr(Stdio::null()).status();
    let _ = Command::new(engine).args(["rm", "--force", name]).stdout(Stdio::null()).stderr(Stdio::null()).status();
}

fn unique_suffix() -> u128 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_nanos()
}

fn make_tar(files: &[(String, Vec<u8>)]) -> Result<Vec<u8>, String> {
    let mut archive = Vec::new();
    for (name, contents) in files {
        if name.contains('/') || name.contains('\\') || name.len() > 100 { return Err("Invalid runner file name.".to_string()); }
        let mut header = [0u8; 512];
        copy_tar_field(&mut header[0..100], name.as_bytes());
        write_octal(&mut header[100..108], 0o644);
        write_octal(&mut header[108..116], 0);
        write_octal(&mut header[116..124], 0);
        write_octal(&mut header[124..136], contents.len() as u64);
        write_octal(&mut header[136..148], 0);
        header[148..156].fill(b' ');
        header[156] = b'0';
        copy_tar_field(&mut header[257..263], b"ustar\0");
        copy_tar_field(&mut header[263..265], b"00");
        let checksum: u64 = header.iter().map(|byte| *byte as u64).sum();
        write_octal(&mut header[148..156], checksum);
        archive.extend_from_slice(&header);
        archive.extend_from_slice(contents);
        let padding = (512 - contents.len() % 512) % 512;
        archive.resize(archive.len() + padding, 0);
    }
    archive.resize(archive.len() + 1024, 0);
    Ok(archive)
}

fn copy_tar_field(target: &mut [u8], value: &[u8]) {
    let size = target.len().min(value.len());
    target[..size].copy_from_slice(&value[..size]);
}

fn write_octal(target: &mut [u8], number: u64) {
    let value = format!("{:0width$o}", number, width = target.len().saturating_sub(1));
    let bytes = value.as_bytes();
    let start = target.len().saturating_sub(bytes.len() + 1);
    target.fill(b'0');
    target[start..start + bytes.len()].copy_from_slice(bytes);
    target[target.len() - 1] = 0;
}

fn truncate(value: &str, max: usize) -> String {
    if value.chars().count() <= max { value.to_string() } else { format!("{}…", value.chars().take(max).collect::<String>()) }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        tauri_plugin_sql::Migration {
            version: 1,
            description: "create challenge history table",
            sql: "CREATE TABLE IF NOT EXISTS challenge_history (id TEXT PRIMARY KEY, challenge_text TEXT NOT NULL, created_at TEXT NOT NULL);",
            kind: tauri_plugin_sql::MigrationKind::Up,
        },
        tauri_plugin_sql::Migration {
            version: 2,
            description: "add local practice drafts progress and settings",
            sql: "
                CREATE TABLE IF NOT EXISTS exercise_progress (exercise_id TEXT PRIMARY KEY, status TEXT NOT NULL, updated_at TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS exercise_drafts (exercise_id TEXT NOT NULL, language TEXT NOT NULL, source TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY (exercise_id, language));
                CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
            ",
            kind: tauri_plugin_sql::MigrationKind::Up,
        },
        tauri_plugin_sql::Migration {
            version: 3,
            description: "record passed exercises without submissions",
            sql: "CREATE TABLE IF NOT EXISTS passed_exercises (exercise_id TEXT PRIMARY KEY, title TEXT NOT NULL, language TEXT NOT NULL, passed_at TEXT NOT NULL);",
            kind: tauri_plugin_sql::MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().add_migrations("sqlite:practice.db", migrations).build())
        .invoke_handler(tauri::generate_handler![ollama_chat, ollama_models, sandbox_status, setup_sandbox, run_code])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
