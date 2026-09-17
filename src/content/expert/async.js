export default {
  slug: 'async',
  level: 'expert',
  title: 'Async Rust',
  summary: 'async/await, futures, the Tokio runtime, and running thousands of tasks concurrently.',
  sections: [
    {
      type: 'p',
      text: 'Threads are great for CPU-heavy work, but each costs memory and switching time. A web server handling 10,000 connections spends most of its time **waiting** on the network. **Async** code lets a small number of threads juggle a huge number of waiting tasks.',
    },
    { type: 'h2', text: 'async, await, and futures' },
    {
      type: 'list',
      items: [
        '`async fn` returns a **future**: a value that represents work that will finish later.',
        'Futures are **lazy**. Calling an `async fn` does nothing until the future is `.await`ed.',
        '`.await` pauses the current task until the future is ready, letting other tasks run meanwhile.',
        'Rust\'s standard library defines futures but no **runtime** to run them. You choose one. **Tokio** is the most widely used.',
      ],
    },
    {
      type: 'code',
      language: 'toml',
      title: 'Cargo.toml',
      code: `[dependencies]
tokio = { version = "1", features = ["full"] }`,
    },
    { type: 'h2', text: 'Sequential vs concurrent' },
    {
      type: 'code',
      runnable: true,
      code: `use std::time::{Duration, Instant};
use tokio::time::sleep;

async fn fetch(name: &str, ms: u64) -> String {
    sleep(Duration::from_millis(ms)).await; // simulates a network call
    format!("{name} finished after {ms}ms")
}

#[tokio::main]
async fn main() {
    // One after another: about 400ms total
    let start = Instant::now();
    let a = fetch("A", 200).await;
    let b = fetch("B", 200).await;
    println!("{a}");
    println!("{b}");
    println!("sequential took >= 400ms? {}", start.elapsed().as_millis() >= 400);

    // At the same time: about 200ms total
    let start = Instant::now();
    let (c, d) = tokio::join!(fetch("C", 200), fetch("D", 200));
    println!("{c}");
    println!("{d}");
    println!("concurrent took < 400ms? {}", start.elapsed().as_millis() < 400);
}`,
      output: `A finished after 200ms
B finished after 200ms
sequential took >= 400ms? true
C finished after 200ms
D finished after 200ms
concurrent took < 400ms? true`,
    },
    { type: 'h2', text: 'Spawning tasks and timeouts' },
    {
      type: 'p',
      text: '`tokio::spawn` starts an independent task, similar to a very lightweight thread. Tokio also provides async-aware timers, channels, locks, file I/O, and networking.',
    },
    {
      type: 'code',
      runnable: true,
      code: `use tokio::time::{sleep, timeout, Duration};

#[tokio::main]
async fn main() {
    let mut handles = Vec::new();
    for id in 1..=3 {
        handles.push(tokio::spawn(async move {
            sleep(Duration::from_millis(50 * id)).await;
            id * 10
        }));
    }

    let mut results = Vec::new();
    for handle in handles {
        results.push(handle.await.unwrap());
    }
    println!("results: {:?}", results);

    let slow_operation = sleep(Duration::from_secs(5));
    match timeout(Duration::from_millis(100), slow_operation).await {
        Ok(_) => println!("finished in time"),
        Err(_) => println!("timed out!"),
    }
}`,
      output: `results: [10, 20, 30]
timed out!`,
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'Never block inside async code',
      text: 'Calling `std::thread::sleep` or doing heavy CPU work in an async task freezes every other task on that thread. Use `tokio::time::sleep`, async I/O, and move blocking work to `tokio::task::spawn_blocking`.',
    },
    { type: 'h2', text: 'A real example: a tiny web server' },
    {
      type: 'p',
      text: 'With the `axum` crate (built on Tokio), a JSON API takes only a few lines:',
    },
    {
      type: 'code',
      title: 'src/main.rs',
      code: `use axum::{routing::get, Json, Router};
use serde::Serialize;

#[derive(Serialize)]
struct Health {
    status: &'static str,
}

async fn health() -> Json<Health> {
    Json(Health { status: "ok" })
}

#[tokio::main]
async fn main() {
    let app = Router::new().route("/health", get(health));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}`,
    },
    {
      type: 'callout',
      variant: 'note',
      title: 'The async ecosystem',
      text: '`axum` / `actix-web` for web servers, `reqwest` for HTTP clients, `sqlx` for databases, `tonic` for gRPC. All of them run on Tokio. The **Projects** level uses axum, reqwest, and sqlx to build this server into a complete, tested task manager API.',
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Use `tokio::select!` to race two `fetch` calls with different delays and print only the winner. Then use a `tokio::sync::mpsc` channel to send results from three spawned tasks back to `main`.',
    },
    {
      type: 'quiz',
      question: 'What happens when you call an `async fn` without `.await`ing its result?',
      options: [
        'It runs in the background automatically',
        'It runs immediately but the result is discarded',
        'Nothing: the future does no work until polled',
        'The program deadlocks',
      ],
      answer: 2,
      explanation: 'Rust futures are **lazy**. The compiler warns "futures do nothing unless you `.await` or poll them". Use `.await`, `join!`, or `tokio::spawn` to actually run them.',
    },
  ],
}
