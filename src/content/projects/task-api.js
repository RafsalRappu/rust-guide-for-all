export default {
  slug: 'task-api',
  level: 'projects',
  title: 'Project: A Task Manager REST API',
  summary: 'Create a real project from scratch: a JSON REST API with axum, shared state, proper error responses, and full CRUD you can call with curl.',
  sections: [
    {
      type: 'p',
      text: 'Time to build something real. Over the next lessons you will grow one project, **task-api**, into a production-ready service. In this lesson it gets a complete in-memory REST API. Later lessons add a database, calls to an external API, tests with mocks, and deployment.',
    },
    {
      type: 'list',
      items: [
        '`GET /health`: is the service alive?',
        '`GET /tasks`: list tasks, optionally filtered with `?done=true`',
        '`POST /tasks`: create a task from JSON like `{"title": "Learn Rust"}`',
        '`GET /tasks/{id}`: fetch one task',
        '`PATCH /tasks/{id}`: change the title and/or mark it done',
        '`DELETE /tasks/{id}`: remove a task',
      ],
    },
    { type: 'h2', text: 'Step 1: Create the project' },
    {
      type: 'code',
      language: 'shell',
      code: `cargo new task-api
cd task-api
cargo add axum
cargo add tokio --features full
cargo add serde --features derive
cargo add serde_json
cargo add tracing tracing-subscriber`,
    },
    {
      type: 'code',
      language: 'toml',
      title: 'Cargo.toml (after cargo add)',
      code: `[package]
name = "task-api"
version = "0.1.0"
edition = "2024"

[dependencies]
axum = "0.8"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
tracing = "0.1"
tracing-subscriber = "0.3"`,
    },
    {
      type: 'p',
      text: 'Create these files. Keeping the HTTP layer separate from the business logic is what makes the project easy to test and to move onto a database later.',
    },
    {
      type: 'code',
      language: 'text',
      title: 'Project layout',
      code: `task-api/
├── Cargo.toml
└── src/
    ├── main.rs     // reads config, sets up logging, starts the server
    ├── lib.rs      // builds the Router, so tests can use it without a network
    ├── store.rs    // Task and TaskStore: pure business logic, no HTTP
    ├── error.rs    // turns StoreError into HTTP responses
    └── routes.rs   // HTTP handlers`,
    },
    { type: 'h2', text: 'Step 2: The business logic' },
    {
      type: 'p',
      text: '`store.rs` knows nothing about HTTP. It validates input and keeps tasks in a `BTreeMap`, so they come back sorted by id. It is shown here with a `main` so you can run it in the Playground; in the project, leave `main` out.',
    },
    {
      type: 'code',
      runnable: true,
      title: 'src/store.rs',
      code: `use std::collections::BTreeMap;

use serde::Serialize;

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct Task {
    pub id: u64,
    pub title: String,
    pub done: bool,
}

#[derive(Debug, PartialEq)]
pub enum StoreError {
    NotFound(u64),
    EmptyTitle,
}

#[derive(Default)]
pub struct TaskStore {
    tasks: BTreeMap<u64, Task>,
    next_id: u64,
}

fn clean_title(title: &str) -> Result<String, StoreError> {
    let title = title.trim();
    if title.is_empty() {
        return Err(StoreError::EmptyTitle);
    }
    Ok(title.to_string())
}

impl TaskStore {
    pub fn create(&mut self, title: &str) -> Result<Task, StoreError> {
        let title = clean_title(title)?;
        self.next_id += 1;
        let task = Task { id: self.next_id, title, done: false };
        self.tasks.insert(task.id, task.clone());
        Ok(task)
    }

    pub fn list(&self, done: Option<bool>) -> Vec<Task> {
        self.tasks
            .values()
            .filter(|task| done.is_none_or(|d| task.done == d))
            .cloned()
            .collect()
    }

    pub fn get(&self, id: u64) -> Result<Task, StoreError> {
        self.tasks.get(&id).cloned().ok_or(StoreError::NotFound(id))
    }

    pub fn update(&mut self, id: u64, title: Option<&str>, done: Option<bool>) -> Result<Task, StoreError> {
        let task = self.tasks.get_mut(&id).ok_or(StoreError::NotFound(id))?;
        if let Some(title) = title {
            task.title = clean_title(title)?;
        }
        if let Some(done) = done {
            task.done = done;
        }
        Ok(task.clone())
    }

    pub fn delete(&mut self, id: u64) -> Result<(), StoreError> {
        self.tasks.remove(&id).map(|_| ()).ok_or(StoreError::NotFound(id))
    }
}

fn main() {
    let mut store = TaskStore::default();
    store.create("Learn ownership").unwrap();
    let task = store.create("  Build an API  ").unwrap();
    println!("created: {}", serde_json::to_string(&task).unwrap());

    store.update(task.id, None, Some(true)).unwrap();
    println!("done: {:?}", store.list(Some(true)));
    println!("open count: {}", store.list(Some(false)).len());

    println!("empty title: {:?}", store.create("   "));
    println!("delete 42: {:?}", store.delete(42));
    println!("get 1: {:?}", store.get(1).map(|t| t.title));
}`,
      output: `created: {"id":2,"title":"Build an API","done":false}
done: [Task { id: 2, title: "Build an API", done: true }]
open count: 1
empty title: Err(EmptyTitle)
delete 42: Err(NotFound(42))
get 1: Ok("Learn ownership")`,
    },
    { type: 'h2', text: 'Step 3: Errors become HTTP responses' },
    {
      type: 'p',
      text: 'axum turns anything that implements `IntoResponse` into an HTTP response. Implementing it for `StoreError` means handlers can use `?` and still send the right status code with a JSON error body.',
    },
    {
      type: 'code',
      title: 'src/error.rs',
      code: `use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

use crate::store::StoreError;

impl IntoResponse for StoreError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            StoreError::NotFound(id) => (StatusCode::NOT_FOUND, format!("task {id} not found")),
            StoreError::EmptyTitle => (
                StatusCode::UNPROCESSABLE_ENTITY,
                "title must not be empty".to_string(),
            ),
        };
        (status, Json(json!({ "error": message }))).into_response()
    }
}`,
    },
    { type: 'h2', text: 'Step 4: Handlers and the router' },
    {
      type: 'p',
      text: 'Each handler declares what it needs using **extractors**: `State` for shared data, `Path` for the `{id}` in the URL, `Query` for `?done=true`, and `Json` for the request body. axum parses and validates them before your code runs.',
    },
    {
      type: 'code',
      title: 'src/routes.rs',
      code: `use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;

use crate::store::{StoreError, Task};
use crate::AppState;

#[derive(Deserialize)]
pub struct CreateTask {
    pub title: String,
}

#[derive(Deserialize)]
pub struct UpdateTask {
    pub title: Option<String>,
    pub done: Option<bool>,
}

#[derive(Deserialize)]
pub struct ListParams {
    pub done: Option<bool>,
}

pub async fn health() -> &'static str {
    "ok"
}

pub async fn list_tasks(
    State(state): State<AppState>,
    Query(params): Query<ListParams>,
) -> Json<Vec<Task>> {
    Json(state.lock().unwrap().list(params.done))
}

pub async fn create_task(
    State(state): State<AppState>,
    Json(input): Json<CreateTask>, // the body extractor must come last
) -> Result<(StatusCode, Json<Task>), StoreError> {
    let task = state.lock().unwrap().create(&input.title)?;
    Ok((StatusCode::CREATED, Json(task)))
}

pub async fn get_task(
    State(state): State<AppState>,
    Path(id): Path<u64>,
) -> Result<Json<Task>, StoreError> {
    state.lock().unwrap().get(id).map(Json)
}

pub async fn update_task(
    State(state): State<AppState>,
    Path(id): Path<u64>,
    Json(input): Json<UpdateTask>,
) -> Result<Json<Task>, StoreError> {
    state
        .lock()
        .unwrap()
        .update(id, input.title.as_deref(), input.done)
        .map(Json)
}

pub async fn delete_task(
    State(state): State<AppState>,
    Path(id): Path<u64>,
) -> Result<StatusCode, StoreError> {
    state.lock().unwrap().delete(id)?;
    Ok(StatusCode::NO_CONTENT)
}`,
    },
    {
      type: 'code',
      title: 'src/lib.rs',
      code: `pub mod error;
pub mod routes;
pub mod store;

use std::sync::{Arc, Mutex};

use axum::{routing::get, Router};

use store::TaskStore;

pub type AppState = Arc<Mutex<TaskStore>>;

pub fn app(state: AppState) -> Router {
    Router::new()
        .route("/health", get(routes::health))
        .route("/tasks", get(routes::list_tasks).post(routes::create_task))
        .route(
            "/tasks/{id}",
            get(routes::get_task)
                .patch(routes::update_task)
                .delete(routes::delete_task),
        )
        .with_state(state)
}`,
    },
    {
      type: 'callout',
      variant: 'note',
      title: 'A std Mutex inside async code?',
      text: 'Yes, as long as you never hold the lock across an `.await`. Every handler here locks, does quick in-memory work, and releases the lock in the same statement. Reach for `tokio::sync::Mutex` only when you must `.await` while holding the lock.',
    },
    { type: 'h2', text: 'Step 5: Start the server' },
    {
      type: 'code',
      title: 'src/main.rs',
      code: `use std::net::SocketAddr;
use std::sync::{Arc, Mutex};

use task_api::{app, store::TaskStore};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().init();

    let port: u16 = std::env::var("APP_PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3000);
    let addr = SocketAddr::from(([127, 0, 0, 1], port));

    let state = Arc::new(Mutex::new(TaskStore::default()));
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    tracing::info!("listening on http://{addr}");
    axum::serve(listener, app(state)).await.unwrap();
}`,
    },
    {
      type: 'p',
      text: 'The package is named `task-api`, so its library crate is `task_api` (Cargo swaps the dash for an underscore). That is why `main.rs` can write `use task_api::app`.',
    },
    { type: 'h2', text: 'Step 6: Call your API' },
    {
      type: 'p',
      text: 'Run `cargo run`, then use a second terminal. On Windows, run these in Git Bash, or type `curl.exe` instead of `curl` in PowerShell.',
    },
    {
      type: 'code',
      language: 'shell',
      code: `curl http://127.0.0.1:3000/health

curl -X POST http://127.0.0.1:3000/tasks \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Learn Rust"}'

curl http://127.0.0.1:3000/tasks

curl -X PATCH http://127.0.0.1:3000/tasks/1 \\
  -H "Content-Type: application/json" \\
  -d '{"done": true}'

curl "http://127.0.0.1:3000/tasks?done=true"

curl -i -X DELETE http://127.0.0.1:3000/tasks/1
curl -i http://127.0.0.1:3000/tasks/1`,
    },
    {
      type: 'code',
      language: 'text',
      title: 'Responses',
      code: `ok
{"id":1,"title":"Learn Rust","done":false}
[{"id":1,"title":"Learn Rust","done":false}]
{"id":1,"title":"Learn Rust","done":true}
[{"id":1,"title":"Learn Rust","done":true}]
HTTP/1.1 204 No Content
HTTP/1.1 404 Not Found
content-type: application/json
{"error":"task 1 not found"}`,
    },
    {
      type: 'code',
      language: 'shell',
      title: 'PowerShell alternative',
      code: `Invoke-RestMethod -Method Post -Uri http://127.0.0.1:3000/tasks \`
  -ContentType 'application/json' -Body '{"title": "Learn Rust"}'`,
    },
    {
      type: 'list',
      items: [
        'A body that is not valid JSON, or is missing `title`, gets **400** or **422** from axum automatically, before your handler runs.',
        'A request without `Content-Type: application/json` gets **415 Unsupported Media Type**.',
        'A non-numeric id such as `/tasks/abc` gets **400 Bad Request** from the `Path<u64>` extractor.',
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Log every request',
      text: 'Run `cargo add tower-http --features trace`, then add `.layer(tower_http::trace::TraceLayer::new_for_http())` to the router. With tracing set up, every request logs its method, path, status, and latency.',
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Add `GET /tasks/stats` that returns `{"total": 3, "done": 1, "open": 2}`. Put the counting logic in `TaskStore` and keep the handler to a single line. Then reject titles longer than 200 characters with a new `StoreError::TitleTooLong` that maps to status 422.',
    },
    {
      type: 'quiz',
      question: 'In `create_task`, why must `Json<CreateTask>` be the last argument?',
      options: [
        'Rust requires generic arguments to come last',
        'It reads (consumes) the request body, which can only happen once, after the other extractors',
        'axum sorts arguments alphabetically',
        'Otherwise the response would not be JSON',
      ],
      answer: 1,
      explanation: 'Extractors like `State`, `Path`, and `Query` only look at the request parts. `Json` **consumes the body**, so axum requires it to be the final extractor. Putting it earlier is a compile error.',
    },
  ],
}
