export default {
  slug: 'calling-apis',
  level: 'projects',
  title: 'Calling External APIs',
  summary: 'Integrate a third-party REST API with reqwest: typed JSON, a reusable client, timeouts, auth headers, retries, and clean upstream errors.',
  sections: [
    {
      type: 'p',
      text: 'Real services rarely live alone. They call payment providers, weather services, GitHub, or another team\'s API. In this lesson **task-api** gets a new feature: **import tasks from a remote todo service**. We will use **JSONPlaceholder** (jsonplaceholder.typicode.com), a free fake REST API made for exactly this kind of practice.',
    },
    { type: 'h2', text: 'Step 1: Your first request' },
    {
      type: 'code',
      language: 'shell',
      code: `cargo add reqwest --features json
cargo add thiserror`,
    },
    {
      type: 'p',
      text: 'Describe the JSON you expect as a struct and let serde do the parsing. `rename_all = "camelCase"` maps the API\'s `userId` to Rust\'s `user_id`.',
    },
    {
      type: 'code',
      title: 'Try it in a scratch project',
      code: `use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)] // the fields are only read by {:#?} below
struct RemoteTodo {
    user_id: i64,
    id: i64,
    title: String,
    completed: bool,
}

#[tokio::main]
async fn main() -> Result<(), reqwest::Error> {
    let todo: RemoteTodo = reqwest::get("https://jsonplaceholder.typicode.com/todos/1")
        .await?
        .json()
        .await?;
    println!("{todo:#?}");
    Ok(())
}`,
      output: `RemoteTodo {
    user_id: 1,
    id: 1,
    title: "delectus aut autem",
    completed: false,
}`,
    },
    {
      type: 'callout',
      variant: 'note',
      title: 'Why no Run button?',
      text: 'The Rust Playground blocks network access, so examples that call real APIs must run on your machine. The retry example further down has no network calls, so it runs in the Playground.',
    },
    {
      type: 'list',
      items: [
        'Fields in the JSON that your struct does not mention are **ignored**, so the API can add fields without breaking you.',
        'A field that might be missing should be `Option<T>`, or marked `#[serde(default)]`.',
        'If the JSON does not match (wrong type, missing required field), `.json()` returns an error instead of guessing.',
      ],
    },
    { type: 'h2', text: 'Step 2: A reusable, typed API client' },
    {
      type: 'p',
      text: '`reqwest::get` builds a new client on every call. In a real service, create **one** `reqwest::Client` and reuse it: it keeps connections open and shares TLS sessions. `Client` is cheap to clone because it is reference-counted inside. Wrapping it in your own `TodoClient` gives the rest of the app a clear, typed interface.',
    },
    {
      type: 'code',
      title: 'src/todo_client.rs',
      code: `use std::time::Duration;

use serde::{de::DeserializeOwned, Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoteTodo {
    pub user_id: i64,
    pub id: i64,
    pub title: String,
    pub completed: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NewRemoteTodo<'a> {
    pub user_id: i64,
    pub title: &'a str,
    pub completed: bool,
}

#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("request failed: {0}")]
    Http(#[from] reqwest::Error),
    #[error("remote API returned {status}: {body}")]
    Status { status: reqwest::StatusCode, body: String },
}

#[derive(Clone)]
pub struct TodoClient {
    http: reqwest::Client,
    base_url: String,
}

impl TodoClient {
    pub fn new(base_url: impl Into<String>) -> Result<Self, ApiError> {
        let http = reqwest::Client::builder()
            .timeout(Duration::from_secs(10)) // never wait forever on someone else's server
            .connect_timeout(Duration::from_secs(3))
            .user_agent(concat!(env!("CARGO_PKG_NAME"), "/", env!("CARGO_PKG_VERSION")))
            .build()?;
        Ok(Self { http, base_url: base_url.into() })
    }

    pub async fn todos_for_user(&self, user_id: i64) -> Result<Vec<RemoteTodo>, ApiError> {
        let url = format!("{}/todos?userId={user_id}", self.base_url);
        let response = self.http.get(url).send().await?;
        Self::parse(response).await
    }

    pub async fn create_todo(&self, todo: &NewRemoteTodo<'_>) -> Result<RemoteTodo, ApiError> {
        let url = format!("{}/todos", self.base_url);
        let response = self.http.post(url).json(todo).send().await?;
        Self::parse(response).await
    }

    // A 404 or 500 is not a network error, so reqwest does not fail on its own.
    // Check the status first and keep the body: it usually explains what went wrong.
    async fn parse<T: DeserializeOwned>(response: reqwest::Response) -> Result<T, ApiError> {
        let status = response.status();
        if !status.is_success() {
            let body = response.text().await.unwrap_or_default();
            return Err(ApiError::Status { status, body });
        }
        Ok(response.json().await?)
    }
}

#[tokio::main]
async fn main() -> Result<(), ApiError> {
    let client = TodoClient::new("https://jsonplaceholder.typicode.com")?;

    let todos = client.todos_for_user(1).await?;
    println!("user 1 has {} todos, first: {:?}", todos.len(), todos[0].title);

    let new_todo = NewRemoteTodo { user_id: 1, title: "Learn reqwest", completed: false };
    let created = client.create_todo(&new_todo).await?;
    println!("created remote todo {} for user {}", created.id, created.user_id);
    Ok(())
}`,
      output: `user 1 has 20 todos, first: "delectus aut autem"
created remote todo 201 for user 1`,
    },
    {
      type: 'p',
      text: 'The `main` at the bottom is only for trying the client in a scratch project; leave it out of task-api. JSONPlaceholder pretends to save the new todo and returns it with id `201`, but nothing is really stored.',
    },
    { type: 'h2', text: 'Authentication and secrets' },
    {
      type: 'p',
      text: 'Most real APIs need a key or token. Read it from the environment (see the configuration lesson), send it as a default header, and mark it **sensitive** so it never shows up in debug output or logs.',
    },
    {
      type: 'code',
      title: 'Adding a bearer token',
      code: `use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION};

fn authed_client(token: &str) -> Result<reqwest::Client, Box<dyn std::error::Error>> {
    let mut auth = HeaderValue::from_str(&format!("Bearer {token}"))?;
    auth.set_sensitive(true);

    let mut headers = HeaderMap::new();
    headers.insert(AUTHORIZATION, auth);

    Ok(reqwest::Client::builder().default_headers(headers).build()?)
}

fn main() {
    let token = std::env::var("TODO_API_TOKEN").unwrap_or_else(|_| "dev-token".to_string());
    let _client = authed_client(&token).expect("valid client");
    println!("client ready");
}`,
    },
    { type: 'h2', text: 'Retrying failures that are temporary' },
    {
      type: 'p',
      text: 'Networks fail. A timeout, **429 Too Many Requests**, or **503 Service Unavailable** often succeeds a moment later. Retry those a few times with a growing delay (**exponential backoff**). Do not retry a **400** or **404**: the answer will not change.',
    },
    {
      type: 'code',
      runnable: true,
      code: `use std::future::Future;
use std::time::Duration;

async fn retry<T, E, Fut>(mut attempts: u32, mut operation: impl FnMut() -> Fut) -> Result<T, E>
where
    Fut: Future<Output = Result<T, E>>,
    E: std::fmt::Display,
{
    let mut delay = Duration::from_millis(100);
    loop {
        match operation().await {
            Ok(value) => return Ok(value),
            Err(err) if attempts > 1 => {
                println!("attempt failed: {err}; retrying in {delay:?}");
                tokio::time::sleep(delay).await;
                delay *= 2;
                attempts -= 1;
            }
            Err(err) => return Err(err),
        }
    }
}

#[tokio::main]
async fn main() {
    // A fake remote call that fails twice, then succeeds.
    let mut calls = 0;
    let result: Result<&str, String> = retry(4, || {
        calls += 1;
        let n = calls;
        async move {
            if n < 3 {
                Err(format!("503 Service Unavailable (call {n})"))
            } else {
                Ok("payload")
            }
        }
    })
    .await;
    println!("result: {result:?} after {calls} calls");
}`,
      output: `attempt failed: 503 Service Unavailable (call 1); retrying in 100ms
attempt failed: 503 Service Unavailable (call 2); retrying in 200ms
result: Ok("payload") after 3 calls`,
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'Be careful retrying POST',
      text: 'Retrying a `GET` is safe. Retrying a `POST` that timed out might create the same order or payment twice, because the first request may have succeeded. Only retry non-idempotent calls when the API supports an idempotency key. For production, the `reqwest-middleware` and `reqwest-retry` crates package these rules up.',
    },
    { type: 'h2', text: 'Step 3: Use the client inside task-api' },
    {
      type: 'p',
      text: 'The app state now holds two things, so `AppState` becomes a struct. In the existing handlers, change `State(repo): State<AppState>` to `State(state): State<AppState>` and `repo.` to `state.repo.`.',
    },
    {
      type: 'code',
      title: 'src/lib.rs (changes)',
      code: `pub mod todo_client;

use todo_client::TodoClient;

#[derive(Clone)]
pub struct AppState {
    pub repo: Arc<dyn TaskRepository>,
    pub todos: TodoClient,
}

// In app(): import both routing helpers with use axum::routing::{get, post};
// then add the import route:
//     .route("/tasks/import/{user_id}", post(routes::import_tasks))`,
    },
    {
      type: 'p',
      text: 'The import handler can fail in two different ways: our database, or the remote API. An `AppError` enum combines them, and each maps to an honest status code. When the **upstream** service fails, answer **502 Bad Gateway**: the client did nothing wrong, and neither did your server.',
    },
    {
      type: 'code',
      title: 'src/error.rs (additions)',
      code: `use crate::todo_client::ApiError;

pub enum AppError {
    Store(StoreError),
    Upstream(ApiError),
}

impl From<StoreError> for AppError {
    fn from(err: StoreError) -> Self {
        AppError::Store(err)
    }
}

impl From<ApiError> for AppError {
    fn from(err: ApiError) -> Self {
        AppError::Upstream(err)
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        match self {
            AppError::Store(err) => err.into_response(),
            AppError::Upstream(err) => {
                tracing::error!(error = %err, "todo API call failed");
                let body = Json(json!({ "error": "upstream service unavailable" }));
                (StatusCode::BAD_GATEWAY, body).into_response()
            }
        }
    }
}`,
    },
    {
      type: 'code',
      title: 'src/routes.rs (new handler)',
      code: `// Add to the imports at the top of routes.rs:
use serde::Serialize;
use crate::error::AppError;

#[derive(Serialize)]
pub struct ImportSummary {
    pub imported: usize,
}

pub async fn import_tasks(
    State(state): State<AppState>,
    Path(user_id): Path<i64>,
) -> Result<Json<ImportSummary>, AppError> {
    let remote = state.todos.todos_for_user(user_id).await?;

    let mut imported = 0;
    for todo in remote {
        let task = state.repo.create(&todo.title).await?;
        if todo.completed {
            state.repo.update(task.id, None, Some(true)).await?;
        }
        imported += 1;
    }
    Ok(Json(ImportSummary { imported }))
}`,
    },
    {
      type: 'code',
      title: 'src/main.rs (changes)',
      code: `let todo_api_url = std::env::var("TODO_API_URL")
    .unwrap_or_else(|_| "https://jsonplaceholder.typicode.com".to_string());

let state = AppState {
    repo: Arc::new(SqliteRepo::new(pool)),
    todos: TodoClient::new(todo_api_url)?,
};`,
    },
    {
      type: 'code',
      language: 'shell',
      code: `curl -X POST http://127.0.0.1:3000/tasks/import/1
# {"imported":20}

curl "http://127.0.0.1:3000/tasks?done=true"
# the imported todos that were already completed`,
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'The base URL is configurable on purpose',
      text: 'Because `TodoClient` takes its base URL from `TODO_API_URL`, you can point it at a staging server, or at a **mock server** in tests. The next lesson does exactly that.',
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Wrap `todos_for_user` in the `retry` helper, but only retry when the error is a timeout (`reqwest::Error::is_timeout`) or a status of 429 or 5xx. Then add `GET /users/{id}` to task-api that fetches `/users/{id}` from JSONPlaceholder and returns just the name and email.',
    },
    {
      type: 'quiz',
      question: 'Why does `TodoClient::new` take the base URL as a parameter instead of hard-coding it?',
      options: [
        'reqwest requires it',
        'So the same client can target production, staging, or a mock server in tests',
        'Hard-coded strings are slower in Rust',
        'It makes the requests use HTTPS',
      ],
      answer: 1,
      explanation: 'Injecting the base URL (from config) keeps the client **testable and portable**. Tests can start a local mock server and point the client at it, with no real network calls.',
    },
  ],
}
