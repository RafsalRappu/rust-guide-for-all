export default {
  slug: 'configuration',
  level: 'projects',
  title: 'Configuring Cargo & Your App',
  summary: 'Cargo.toml in depth, profiles, workspaces, .cargo/config.toml, environment variables, .env files, and structured logging.',
  sections: [
    {
      type: 'p',
      text: 'There are two kinds of configuration in a Rust project. **Build configuration** tells Cargo how to compile your code. **App configuration** tells your running program which port to use, where the database is, and how much to log. This lesson covers both.',
    },
    { type: 'h2', text: 'Cargo.toml, section by section' },
    {
      type: 'code',
      language: 'toml',
      title: 'Cargo.toml',
      code: `[package]
name = "task-api"
version = "0.1.0"
edition = "2024"
rust-version = "1.85"        # oldest compiler this project supports
description = "A small task manager REST API"
license = "MIT"

[dependencies]
serde = { version = "1", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
tracing = "0.1"
tracing-subscriber = { version = "0.3", optional = true }
shared = { path = "../shared" }                           # a local crate
my-fork = { git = "https://github.com/me/my-fork", branch = "main" }

[dev-dependencies]           # only compiled for tests, examples, benchmarks
pretty_assertions = "1"

[features]
default = ["logging"]
logging = ["dep:tracing-subscriber"]

[profile.release]
lto = "thin"                 # optimize across crates
codegen-units = 1            # slower build, faster binary
strip = true                 # remove debug symbols, smaller binary

[lints.clippy]
unwrap_used = "warn"`,
    },
    {
      type: 'list',
      items: [
        '**Version requirements**: `"1.2.3"` means "1.2.3 or any newer 1.x". `"0.3"` means "any 0.3.x", because before 1.0 the minor number signals breaking changes. Use `"=1.2.3"` only when you must pin one exact version.',
        '**`[dev-dependencies]`** keep test-only crates out of your final program.',
        '**`[features]`** let users switch optional parts on and off. Guard feature-only code with `#[cfg(feature = "logging")]`.',
        '**`[profile.dev]` and `[profile.release]`** control optimization. `cargo build` uses dev; `cargo build --release` uses release.',
        '**`[lints]`** sets compiler and Clippy lint levels for the whole package.',
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Faster debug builds that still run quickly',
      text: 'Add `[profile.dev.package."*"]` with `opt-level = 2`. Your own code stays quick to compile, while dependencies (which rarely change) are optimized once and cached.',
    },
    { type: 'h2', text: 'Cargo.lock: commit it' },
    {
      type: 'p',
      text: '`Cargo.toml` says which versions are **allowed**. `Cargo.lock` records the exact versions that were **chosen**. Commit it so every machine and every CI run builds the same code. Run `cargo update` when you deliberately want newer compatible versions.',
    },
    { type: 'h2', text: 'Workspaces: several crates, one repository' },
    {
      type: 'p',
      text: 'Larger projects split into crates, for example a `core` library, an `api` server, and a `cli` tool. A **workspace** builds them together with one shared `Cargo.lock` and one `target/` folder.',
    },
    {
      type: 'code',
      language: 'toml',
      title: 'Cargo.toml (workspace root)',
      code: `[workspace]
resolver = "3"               # use "2" if your crates are on edition 2021
members = ["core", "api", "cli"]

[workspace.dependencies]     # declare shared versions once
serde = { version = "1", features = ["derive"] }
tokio = { version = "1", features = ["full"] }`,
    },
    {
      type: 'code',
      language: 'toml',
      title: 'api/Cargo.toml',
      code: `[package]
name = "api"
version = "0.1.0"
edition = "2024"

[dependencies]
core = { path = "../core" }
serde = { workspace = true }
tokio = { workspace = true }`,
    },
    {
      type: 'p',
      text: 'Run `cargo build` at the root to build everything, or `cargo run -p api` to run one member.',
    },
    { type: 'h2', text: '.cargo/config.toml and tool config files' },
    {
      type: 'code',
      language: 'toml',
      title: '.cargo/config.toml',
      code: `[alias]
lint = "clippy --all-targets -- -D warnings"   # now "cargo lint" works

[env]
APP_PORT = "3000"    # default for cargo run and cargo test; a real env var wins`,
    },
    {
      type: 'code',
      language: 'toml',
      title: 'rustfmt.toml',
      code: `max_width = 100
use_field_init_shorthand = true`,
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'Build config is not app config',
      text: 'Everything above is read when you **compile**. Secrets and settings that differ between your laptop, staging, and production (database passwords, API keys, ports) must be read when the program **runs**, usually from environment variables.',
    },
    { type: 'h2', text: 'App configuration from environment variables' },
    {
      type: 'p',
      text: 'A good pattern is one `Config` struct, loaded once at startup, that fails fast with a clear message. Reading values through a function parameter (instead of calling `std::env::var` everywhere) makes the loader easy to test:',
    },
    {
      type: 'code',
      runnable: true,
      title: 'src/config.rs',
      code: `use std::collections::HashMap;
use std::env;
use std::fmt;

#[derive(Debug)]
struct Config {
    host: String,
    port: u16,
    database_url: String,
    log_level: String,
}

#[derive(Debug)]
enum ConfigError {
    Missing(&'static str),
    Invalid { key: &'static str, value: String },
}

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ConfigError::Missing(key) => write!(f, "missing required setting {key}"),
            ConfigError::Invalid { key, value } => write!(f, "invalid value {value:?} for {key}"),
        }
    }
}

impl std::error::Error for ConfigError {}

impl Config {
    // Reads each setting through \`get\`, so tests can pass fake values.
    fn load(get: impl Fn(&str) -> Option<String>) -> Result<Self, ConfigError> {
        let port_raw = get("APP_PORT").unwrap_or_else(|| "3000".to_string());
        let port = port_raw.parse().map_err(|_| ConfigError::Invalid {
            key: "APP_PORT",
            value: port_raw.clone(),
        })?;

        Ok(Config {
            host: get("APP_HOST").unwrap_or_else(|| "127.0.0.1".to_string()),
            port,
            database_url: get("DATABASE_URL").ok_or(ConfigError::Missing("DATABASE_URL"))?,
            log_level: get("LOG_LEVEL").unwrap_or_else(|| "info".to_string()),
        })
    }

    fn from_env() -> Result<Self, ConfigError> {
        Self::load(|key| env::var(key).ok())
    }
}

fn main() {
    let good = HashMap::from([("APP_PORT", "8080"), ("DATABASE_URL", "sqlite:tasks.db")]);
    match Config::load(|key| good.get(key).map(|v| v.to_string())) {
        Ok(c) => println!("listening on {}:{} (db: {}, log: {})", c.host, c.port, c.database_url, c.log_level),
        Err(e) => println!("config error: {e}"),
    }

    let bad = HashMap::from([("APP_PORT", "eighty")]);
    if let Err(e) = Config::load(|key| bad.get(key).map(|v| v.to_string())) {
        println!("config error: {e}");
    }

    // The real environment here has no DATABASE_URL, so this fails fast.
    if let Err(e) = Config::from_env() {
        println!("config error: {e}");
    }
}`,
      output: `listening on 127.0.0.1:8080 (db: sqlite:tasks.db, log: info)
config error: invalid value "eighty" for APP_PORT
config error: missing required setting DATABASE_URL`,
    },
    { type: 'h2', text: '.env files for local development' },
    {
      type: 'p',
      text: 'Typing environment variables every time is tedious. The `dotenvy` crate loads them from a `.env` file at startup. Real environment variables still take priority, so production is unaffected.',
    },
    {
      type: 'code',
      language: 'shell',
      title: '.env (add to .gitignore)',
      code: `APP_PORT=8080
DATABASE_URL=sqlite:tasks.db?mode=rwc
LOG_LEVEL=debug
WEATHER_API_KEY=replace-me`,
    },
    {
      type: 'code',
      title: 'src/main.rs',
      code: `fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok(); // a missing .env file is fine in production
    let config = Config::from_env()?;
    println!("starting on port {}", config.port);
    Ok(())
}`,
    },
    {
      type: 'list',
      items: [
        'Add `.env` to `.gitignore`. It holds secrets.',
        'Commit a `.env.example` with the same keys and placeholder values, so teammates know what to set.',
        'In production, set real environment variables through your hosting platform, Docker, or a secrets manager.',
      ],
    },
    { type: 'h2', text: 'Structured logging with tracing' },
    {
      type: 'p',
      text: '`println!` is fine for a toy program. Real services use **tracing**: log levels, key-value fields, and **spans** that attach context (like a request id) to every message inside them.',
    },
    {
      type: 'code',
      language: 'shell',
      code: `cargo add tracing
cargo add tracing-subscriber`,
    },
    {
      type: 'code',
      runnable: true,
      code: `use tracing::{debug, error, info, info_span, warn};

fn handle_request(id: u32, path: &str) {
    // A span attaches context to every event inside it. In a real project,
    // putting #[tracing::instrument] on the function does this for you.
    let span = info_span!("request", id, path);
    let _guard = span.enter();

    info!("handling request");
    if path == "/admin" {
        warn!(user = "guest", "access denied");
    }
}

fn main() {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::DEBUG)
        .without_time() // hidden here only so the output below is stable
        .with_target(false)
        .with_ansi(false)
        .init();

    debug!("config loaded");
    info!(port = 8080, "starting server");
    handle_request(1, "/tasks");
    handle_request(2, "/admin");
    error!(code = 500, "something went wrong");
}`,
      output: `DEBUG config loaded
 INFO starting server port=8080
 INFO request{id=1 path="/tasks"}: handling request
 INFO request{id=2 path="/admin"}: handling request
 WARN request{id=2 path="/admin"}: access denied user="guest"
ERROR something went wrong code=500`,
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Logs for machines',
      text: 'In production, enable the `json` feature of `tracing-subscriber` and call `.json()` on the builder. Log platforms can then search and filter by fields such as `port` or `user`.',
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Extend `Config` with a `max_connections: u32` setting that defaults to `10` and rejects `0`. Then use `log_level` to choose the tracing level: map `"debug"` to `Level::DEBUG`, `"info"` to `Level::INFO`, and anything else to an `Invalid` error.',
    },
    {
      type: 'quiz',
      question: 'Which of these belongs in your Git repository?',
      options: [
        '`.env` containing the production database password',
        '`.env.example` listing every setting with placeholder values',
        'The `target/` folder, so others do not have to compile',
        'None of them: configuration never belongs in Git',
      ],
      answer: 1,
      explanation: 'Commit **`.env.example`** (and `Cargo.lock`) so others know what to configure. Keep `.env` out of Git because it holds secrets, and never commit `target/`, which is build output.',
    },
  ],
}
