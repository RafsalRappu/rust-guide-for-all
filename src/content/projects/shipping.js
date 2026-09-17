export default {
  slug: 'shipping',
  level: 'projects',
  title: 'Shipping to Production',
  summary: 'Graceful shutdown, optimized release builds, a small secure Docker image, GitHub Actions CI, and deployment options.',
  sections: [
    {
      type: 'p',
      text: '**task-api** works and is tested. The last step is getting it onto a server and keeping it healthy there. Rust makes this pleasant: a release build is a **single executable** with no runtime or interpreter to install.',
    },
    { type: 'h2', text: 'Step 1: A production-ready main' },
    {
      type: 'p',
      text: 'Two changes matter in production. The **host must be configurable**, because inside a container `127.0.0.1` is unreachable from outside. And the server should **shut down gracefully**: when the platform sends a stop signal, finish in-flight requests before exiting instead of cutting them off.',
    },
    {
      type: 'code',
      title: 'src/main.rs (final version)',
      code: `use std::net::SocketAddr;
use std::sync::Arc;

use sqlx::sqlite::SqlitePoolOptions;
use task_api::{app, sqlite_repo::SqliteRepo, todo_client::TodoClient, AppState};
use tokio::signal;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt().init();

    let host = std::env::var("APP_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = std::env::var("APP_PORT").unwrap_or_else(|_| "3000".to_string());
    let addr: SocketAddr = format!("{host}:{port}").parse()?;

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&std::env::var("DATABASE_URL")?)
        .await?;
    sqlx::migrate!().run(&pool).await?;

    let todo_api_url = std::env::var("TODO_API_URL")
        .unwrap_or_else(|_| "https://jsonplaceholder.typicode.com".to_string());
    let state = AppState {
        repo: Arc::new(SqliteRepo::new(pool.clone())),
        todos: Arc::new(TodoClient::new(todo_api_url)?),
    };

    let listener = tokio::net::TcpListener::bind(addr).await?;
    tracing::info!("listening on http://{addr}");
    axum::serve(listener, app(state))
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    pool.close().await;
    tracing::info!("shut down cleanly");
    Ok(())
}

/// Resolves on Ctrl+C, or on SIGTERM (what Docker and Kubernetes send on stop).
async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c().await.expect("failed to listen for Ctrl+C");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to listen for SIGTERM")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }
    tracing::info!("shutdown signal received, finishing open requests");
}`,
    },
    {
      type: 'callout',
      variant: 'note',
      title: 'APP_HOST takes an IP address',
      text: 'Because the address is parsed as a `SocketAddr`, use `127.0.0.1` for local development and `0.0.0.0` (all interfaces) in containers and on servers. A hostname like `localhost` will fail to parse.',
    },
    { type: 'h2', text: 'Step 2: Build a release binary' },
    {
      type: 'code',
      language: 'shell',
      code: `cargo build --release --locked`,
    },
    {
      type: 'list',
      items: [
        'The binary is `target/release/task-api` (Windows: `target\\release\\task-api.exe`). Copy that one file anywhere with the same OS and CPU type and it runs.',
        '`--locked` refuses to build if `Cargo.lock` is out of date, so production uses exactly the versions you tested.',
        'Release builds are often **10 to 100 times faster** than debug builds. Never benchmark or deploy a debug build.',
        'The `[profile.release]` settings from the configuration lesson (`lto`, `codegen-units = 1`, `strip`) make the binary faster and smaller.',
      ],
    },
    {
      type: 'code',
      language: 'shell',
      title: 'Run it',
      code: `# macOS / Linux
APP_HOST=0.0.0.0 DATABASE_URL="sqlite:tasks.db?mode=rwc" ./target/release/task-api

# Windows PowerShell
$env:DATABASE_URL = "sqlite:tasks.db?mode=rwc"; .\\target\\release\\task-api.exe`,
    },
    { type: 'h2', text: 'Step 3: Package it with Docker' },
    {
      type: 'p',
      text: 'A container bundles your binary with a minimal operating system, so it runs the same on your laptop, in CI, and on any cloud. A **multi-stage** build compiles in a large image that has the Rust toolchain, then copies only the finished binary into a small runtime image.',
    },
    {
      type: 'code',
      language: 'text',
      title: '.dockerignore',
      code: `target
.git
.env
*.db`,
    },
    {
      type: 'code',
      language: 'dockerfile',
      title: 'Dockerfile',
      code: `# syntax=docker/dockerfile:1

# ---- Build stage: full Rust toolchain ----
FROM rust:1-bookworm AS builder
WORKDIR /app
COPY . .
# Cache mounts keep downloaded crates and compiled dependencies between builds.
RUN --mount=type=cache,target=/usr/local/cargo/registry \\
    --mount=type=cache,target=/app/target \\
    cargo build --release --locked \\
    && cp target/release/task-api /usr/local/bin/task-api

# ---- Runtime stage: small image, no compiler ----
FROM debian:bookworm-slim
RUN apt-get update \\
    && apt-get install -y --no-install-recommends ca-certificates \\
    && rm -rf /var/lib/apt/lists/*
RUN useradd --system --uid 10001 app && mkdir /data && chown app /data

COPY --from=builder /usr/local/bin/task-api /usr/local/bin/task-api

USER app
ENV APP_HOST=0.0.0.0 \\
    APP_PORT=3000 \\
    DATABASE_URL=sqlite:/data/tasks.db?mode=rwc
VOLUME /data
EXPOSE 3000
CMD ["task-api"]`,
    },
    {
      type: 'list',
      items: [
        '**`ca-certificates`** lets the app verify HTTPS certificates when it calls external APIs. Without it, every `reqwest` call to an `https://` URL fails.',
        '**A non-root user** limits the damage if the app is ever compromised.',
        '**`/data` as a volume** keeps the SQLite file when the container is replaced.',
        'Migrations are embedded by `sqlx::migrate!()` at compile time, so the runtime image needs no SQL files.',
      ],
    },
    {
      type: 'code',
      language: 'shell',
      code: `docker build -t task-api .
docker run --rm -p 3000:3000 -v task-data:/data --name task-api task-api

curl http://127.0.0.1:3000/health
docker stop task-api   # sends SIGTERM: watch the "shut down cleanly" log line`,
    },
    {
      type: 'code',
      language: 'yaml',
      title: 'compose.yaml',
      code: `services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      LOG_LEVEL: info
      TODO_API_URL: https://jsonplaceholder.typicode.com
    volumes:
      - task-data:/data
    restart: unless-stopped

volumes:
  task-data:`,
    },
    {
      type: 'p',
      text: 'With `compose.yaml`, `docker compose up --build` builds and starts everything, and `docker compose down` stops it. This is also how you would add a PostgreSQL service next to the API.',
    },
    { type: 'h2', text: 'Step 4: Continuous integration with GitHub Actions' },
    {
      type: 'p',
      text: '**CI** runs your checks on every push and pull request, so broken code never reaches `main`. Commit this file and GitHub runs it automatically.',
    },
    {
      type: 'code',
      language: 'yaml',
      title: '.github/workflows/ci.yml',
      code: `name: CI

on:
  push:
    branches: [main]
  pull_request:

env:
  CARGO_TERM_COLOR: always

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt, clippy
      - uses: Swatinem/rust-cache@v2

      - name: Check formatting
        run: cargo fmt --all --check
      - name: Lint
        run: cargo clippy --all-targets --locked -- -D warnings
      - name: Test
        run: cargo test --locked

  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check dependencies for known vulnerabilities
        run: |
          cargo install cargo-audit --locked
          cargo audit

  docker:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build image
        run: docker build -t task-api .`,
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Why -D warnings?',
      text: 'It turns every compiler and Clippy warning into an error in CI. Warnings then get fixed when they appear, instead of piling up until nobody reads them.',
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'Run cargo fmt before your first push',
      text: 'The code in these lessons is laid out to read well on a web page. `rustfmt` will reorder some imports and re-wrap long lines, so the **Check formatting** step fails until you run `cargo fmt` (or save each file with format-on-save enabled, as in the setup lesson). The code behaves the same either way.',
    },
    { type: 'h2', text: 'Step 5: Deploy' },
    {
      type: 'list',
      items: [
        '**Container platforms** (Fly.io, Railway, Render, Google Cloud Run, AWS ECS, Azure Container Apps): push the image, set the environment variables, and point the platform\'s health check at `/health`.',
        '**A Linux server (VPS)**: copy the release binary and run it as a systemd service (below), usually behind a reverse proxy such as Caddy or nginx that handles HTTPS.',
        '**Kubernetes**: use the same image, with `/health` as the liveness and readiness probe. Graceful shutdown already handles SIGTERM.',
      ],
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'SQLite needs a persistent disk',
      text: 'Serverless container platforms (such as Cloud Run) delete the container filesystem on restart, and run several copies at once. Only use SQLite where you can attach a persistent volume to a single instance. Otherwise switch to a managed PostgreSQL database, as described in the database lesson.',
    },
    {
      type: 'code',
      language: 'ini',
      title: '/etc/systemd/system/task-api.service',
      code: `[Unit]
Description=task-api
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/task-api
Environment=APP_HOST=127.0.0.1
Environment=APP_PORT=3000
Environment=DATABASE_URL=sqlite:/var/lib/task-api/tasks.db?mode=rwc
# Creates /var/lib/task-api, owned by a throwaway unprivileged user.
StateDirectory=task-api
DynamicUser=yes
Restart=on-failure

[Install]
WantedBy=multi-user.target`,
    },
    {
      type: 'code',
      language: 'shell',
      code: `sudo systemctl daemon-reload
sudo systemctl enable --now task-api
journalctl -u task-api -f     # follow the logs`,
    },
    {
      type: 'p',
      text: 'Here the app listens on `127.0.0.1` because the reverse proxy on the same machine is the only thing that should reach it directly.',
    },
    { type: 'h2', text: 'Building for other platforms' },
    {
      type: 'code',
      language: 'shell',
      code: `rustup target add x86_64-unknown-linux-musl
cargo build --release --target x86_64-unknown-linux-musl   # a fully static Linux binary

cargo install cross --locked
cross build --release --target aarch64-unknown-linux-gnu    # ARM servers, via Docker`,
    },
    {
      type: 'p',
      text: 'Cross-compiling crates that contain C code (like SQLite) needs a C compiler for the target too. `cross` handles that for you inside Docker. From Windows, the simplest route to a Linux binary is usually the Docker build above, or letting CI build it.',
    },
    { type: 'h2', text: 'Sharing crates and tools' },
    {
      type: 'code',
      language: 'shell',
      code: `cargo install --path .        # install your own binary into ~/.cargo/bin

cargo login                   # paste an API token from crates.io
cargo publish --dry-run       # check the package without uploading
cargo publish                 # publish a library for everyone`,
    },
    {
      type: 'p',
      text: 'Publishing requires `description` and `license` in `[package]`, and a published version can never be changed or deleted (only "yanked"). Double-check that `.env` and other private files are excluded; `cargo package --list` shows exactly what would be uploaded.',
    },
    { type: 'h2', text: 'Release checklist' },
    {
      type: 'list',
      items: [
        '`cargo fmt --check`, `cargo clippy -- -D warnings`, and `cargo test` pass in CI.',
        '`Cargo.lock` is committed, and production builds use `--locked`.',
        'No secrets in the repository or the image; all settings come from environment variables.',
        'The server binds to `0.0.0.0` in containers and shuts down gracefully on SIGTERM.',
        '`/health` exists, and the platform\'s health check uses it.',
        'Logs are structured, and error responses never leak internal details.',
        '`cargo audit` reports no known vulnerabilities.',
        'The version in `Cargo.toml` is bumped and tagged: `git tag v0.1.0 && git push --tags`.',
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      title: '🦀 You built a real Rust service',
      text: 'Across this Projects track you installed and configured Rust, built a REST API with axum, stored data with SQLx, integrated an external API with reqwest, tested it with mocks and fake servers, and packaged it for production. From here, try adding authentication (JWT with `jsonwebtoken`), OpenAPI docs (`utoipa`), or rate limiting (`tower_governor`).',
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Add a `GET /version` route that returns `env!("CARGO_PKG_VERSION")`. Build the Docker image, run it with `compose.yaml`, create a task, run `docker compose down` and then `up` again, and confirm the task survived. Finally, push to GitHub and get the CI workflow green.',
    },
    {
      type: 'quiz',
      question: 'The container starts and logs "listening on http://127.0.0.1:3000", but `curl http://127.0.0.1:3000/health` from your computer fails. Why?',
      options: [
        'Docker does not support port 3000',
        'Inside the container, 127.0.0.1 only accepts connections from the container itself; the server must bind to 0.0.0.0',
        'The release build removed the /health route',
        'curl cannot reach Rust servers without HTTPS',
      ],
      answer: 1,
      explanation: '`127.0.0.1` is the loopback address of **wherever the program runs**. In a container, that is the container itself, so the forwarded port has nothing to connect to. Setting `APP_HOST=0.0.0.0` (as the Dockerfile does) listens on all interfaces.',
    },
  ],
}
