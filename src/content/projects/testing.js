export default {
  slug: 'testing',
  level: 'projects',
  title: 'Testing & Mocking',
  summary: 'Unit tests, HTTP tests without a network, mocks with mockall, fake servers with wiremock, and a real SQLite test database.',
  sections: [
    {
      type: 'p',
      text: '**task-api** now stores data and calls an external service. Before shipping it, you want tests that prove it works and keep proving it every time the code changes. Good tests are **fast**, **deterministic** (same result every run), and **never touch the real internet**.',
    },
    {
      type: 'list',
      items: [
        '**Unit tests**: check one function or type in isolation. Milliseconds each; you will have the most of these.',
        '**Handler tests with mocks**: run the HTTP layer with fake collaborators, so you can force rare cases like "the upstream API is down".',
        '**Integration tests**: drive the whole router with real requests and responses, entirely in memory.',
        '**Contract tests with a fake server**: point the real HTTP client at a local mock server to test status codes, JSON parsing, and errors.',
        '**Database tests**: run the real SQL against a throwaway in-memory SQLite database.',
      ],
    },
    { type: 'h2', text: 'Step 1: Test dependencies' },
    {
      type: 'code',
      language: 'shell',
      code: `cargo add --dev tower --features util
cargo add --dev http-body-util mockall wiremock`,
    },
    {
      type: 'code',
      language: 'toml',
      title: 'Cargo.toml',
      code: `[dev-dependencies]
http-body-util = "0.1"   # read response bodies in tests
mockall = "0.15"         # generate mock implementations of traits
tower = { version = "0.5", features = ["util"] }  # ServiceExt::oneshot
wiremock = "0.6"         # a real HTTP server that returns canned responses`,
    },
    {
      type: 'code',
      language: 'text',
      title: 'Where tests live',
      code: `task-api/
├── src/
│   ├── repo.rs         // #[cfg(test)] mod tests { ... }  unit tests
│   └── routes.rs       // #[cfg(test)] mod tests { ... }  handler tests with mockall
└── tests/              // each file is a separate crate that uses only your public API
    ├── api.rs          // whole-router tests + wiremock
    ├── todo_client.rs  // HTTP client contract tests with wiremock
    └── sqlite_repo.rs  // real SQL against in-memory SQLite`,
    },
    { type: 'h2', text: 'Step 2: Unit tests for business rules' },
    {
      type: 'p',
      text: 'Start with the logic that does not depend on anything: validation. Press **Run** and the Playground runs `cargo test` for you.',
    },
    {
      type: 'code',
      runnable: true,
      title: 'src/repo.rs (tests)',
      code: `#[derive(Debug, PartialEq)]
pub enum StoreError {
    NotFound(i64),
    EmptyTitle,
}

pub fn clean_title(title: &str) -> Result<String, StoreError> {
    let title = title.trim();
    if title.is_empty() {
        return Err(StoreError::EmptyTitle);
    }
    Ok(title.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn trims_surrounding_whitespace() {
        assert_eq!(clean_title("  Buy milk \\n"), Ok("Buy milk".to_string()));
    }

    #[test]
    fn rejects_blank_titles() {
        for input in ["", "   ", "\\t\\n"] {
            assert_eq!(clean_title(input), Err(StoreError::EmptyTitle), "input: {input:?}");
        }
    }

    #[test]
    fn keeps_inner_spaces() {
        assert_eq!(clean_title("a  b").unwrap(), "a  b");
    }
}`,
    },
    {
      type: 'code',
      language: 'text',
      title: 'cargo test',
      code: `running 3 tests
test tests::keeps_inner_spaces ... ok
test tests::rejects_blank_titles ... ok
test tests::trims_surrounding_whitespace ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out`,
    },
    {
      type: 'list',
      items: [
        '`cargo test blank` runs only tests whose name contains "blank".',
        '`cargo test -- --nocapture` shows `println!` output from passing tests.',
        '`cargo test --test api` runs only `tests/api.rs`.',
        'Name tests as sentences describing behavior. A failure then reads like a bug report.',
      ],
    },
    { type: 'h2', text: 'Step 3: What a mock is (by hand)' },
    {
      type: 'p',
      text: 'A **mock** (or **fake**) is a stand-in for something your code depends on. In Rust the trick is always the same: code depends on a **trait**, production passes the real type, and tests pass a fake that returns canned answers and records how it was called. Here is the idea with no extra crates. Errors are plain `String`s to keep it short.',
    },
    {
      type: 'code',
      runnable: true,
      code: `use async_trait::async_trait;

#[derive(Debug, Clone, PartialEq)]
pub struct RemoteTodo {
    pub id: i64,
    pub title: String,
    pub completed: bool,
}

#[async_trait]
pub trait TodoApi: Send + Sync {
    async fn todos_for_user(&self, user_id: i64) -> Result<Vec<RemoteTodo>, String>;
}

/// The code under test only knows the trait, never the real HTTP client.
pub async fn open_titles(api: &dyn TodoApi, user_id: i64) -> Result<Vec<String>, String> {
    let todos = api.todos_for_user(user_id).await?;
    Ok(todos.into_iter().filter(|t| !t.completed).map(|t| t.title).collect())
}

#[cfg(test)]
mod tests {
    use std::sync::Mutex;

    use super::*;

    /// A hand-written fake: returns a canned response and records every call.
    struct FakeTodoApi {
        response: Result<Vec<RemoteTodo>, String>,
        calls: Mutex<Vec<i64>>,
    }

    #[async_trait]
    impl TodoApi for FakeTodoApi {
        async fn todos_for_user(&self, user_id: i64) -> Result<Vec<RemoteTodo>, String> {
            self.calls.lock().unwrap().push(user_id);
            self.response.clone()
        }
    }

    fn todo(id: i64, title: &str, completed: bool) -> RemoteTodo {
        RemoteTodo { id, title: title.to_string(), completed }
    }

    #[tokio::test]
    async fn keeps_only_open_todos() {
        let api = FakeTodoApi {
            response: Ok(vec![todo(1, "write tests", false), todo(2, "ship it", true)]),
            calls: Mutex::new(Vec::new()),
        };

        let titles = open_titles(&api, 7).await.unwrap();

        assert_eq!(titles, vec!["write tests"]);
        assert_eq!(*api.calls.lock().unwrap(), vec![7]); // called once, with user 7
    }

    #[tokio::test]
    async fn passes_errors_through() {
        let api = FakeTodoApi {
            response: Err("503 Service Unavailable".to_string()),
            calls: Mutex::new(Vec::new()),
        };

        let result = open_titles(&api, 1).await;

        assert_eq!(result, Err("503 Service Unavailable".to_string()));
    }
}`,
    },
    { type: 'h2', text: 'Step 4: Generated mocks with mockall' },
    {
      type: 'p',
      text: 'Hand-written fakes get tedious as traits grow. **mockall** generates a `MockTraitName` type for you, with methods to set expectations: which arguments are allowed, how many calls, and what to return. First, put the external API behind a trait in task-api:',
    },
    {
      type: 'code',
      title: 'src/todo_client.rs (additions)',
      code: `use async_trait::async_trait;

// automock only in test builds, and it must come BEFORE #[async_trait].
#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait TodoApi: Send + Sync {
    async fn todos_for_user(&self, user_id: i64) -> Result<Vec<RemoteTodo>, ApiError>;
}

#[async_trait]
impl TodoApi for TodoClient {
    async fn todos_for_user(&self, user_id: i64) -> Result<Vec<RemoteTodo>, ApiError> {
        TodoClient::todos_for_user(self, user_id).await // calls the inherent method
    }
}`,
    },
    {
      type: 'code',
      title: 'src/lib.rs and src/main.rs (changes)',
      code: `// lib.rs: the state holds "any TodoApi" instead of the concrete client
#[derive(Clone)]
pub struct AppState {
    pub repo: Arc<dyn TaskRepository>,
    pub todos: Arc<dyn TodoApi>,
}

// main.rs
let state = AppState {
    repo: Arc::new(SqliteRepo::new(pool)),
    todos: Arc::new(TodoClient::new(todo_api_url)?),
};`,
    },
    {
      type: 'p',
      text: 'Now test the import handler through the real router. `oneshot` (from `tower::ServiceExt`) sends one request straight into the `Router` in memory: no port, no network, no server startup.',
    },
    {
      type: 'code',
      title: 'src/routes.rs (bottom of the file)',
      code: `#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use axum::{
        body::Body,
        http::{Request, StatusCode},
    };
    use http_body_util::BodyExt;
    use mockall::predicate::eq;
    use tower::ServiceExt;

    use crate::repo::{MemoryRepo, TaskRepository};
    use crate::todo_client::{ApiError, MockTodoApi, RemoteTodo};
    use crate::{app, AppState};

    fn remote(id: i64, title: &str, completed: bool) -> RemoteTodo {
        RemoteTodo { user_id: 1, id, title: title.to_string(), completed }
    }

    async fn post(state: AppState, uri: &str) -> (StatusCode, serde_json::Value) {
        let request = Request::builder().method("POST").uri(uri).body(Body::empty()).unwrap();
        let response = app(state).oneshot(request).await.unwrap();
        let status = response.status();
        let bytes = response.into_body().collect().await.unwrap().to_bytes();
        (status, serde_json::from_slice(&bytes).unwrap())
    }

    #[tokio::test]
    async fn import_saves_remote_todos() {
        let mut api = MockTodoApi::new();
        api.expect_todos_for_user()
            .with(eq(1))  // fails the test if called with another user id
            .times(1)     // fails the test if called zero or several times
            .returning(|_| Ok(vec![remote(1, "from remote", false), remote(2, "already done", true)]));

        let repo = Arc::new(MemoryRepo::default());
        let state = AppState { repo: repo.clone(), todos: Arc::new(api) };

        let (status, body) = post(state, "/tasks/import/1").await;

        assert_eq!(status, StatusCode::OK);
        assert_eq!(body["imported"], 2);
        let done = repo.list(Some(true)).await.unwrap();
        assert_eq!(done.len(), 1);
        assert_eq!(done[0].title, "already done");
    }

    #[tokio::test]
    async fn upstream_failure_returns_502() {
        let mut api = MockTodoApi::new();
        api.expect_todos_for_user().returning(|_| {
            Err(ApiError::Status {
                status: reqwest::StatusCode::SERVICE_UNAVAILABLE,
                body: "down for maintenance".to_string(),
            })
        });

        let state = AppState { repo: Arc::new(MemoryRepo::default()), todos: Arc::new(api) };

        let (status, body) = post(state, "/tasks/import/1").await;

        assert_eq!(status, StatusCode::BAD_GATEWAY);
        assert_eq!(body["error"], "upstream service unavailable");
    }
}`,
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Mocks, fakes, or the real thing?',
      text: 'Notice the test uses a **mock** for the external API but the real in-memory `MemoryRepo` for storage. Mock things that are slow, flaky, or outside your control. When a simple, fast real implementation exists, use it: tests that lean on too many mocks end up testing the mocks.',
    },
    { type: 'h2', text: 'Step 5: Integration tests for the whole API' },
    {
      type: 'p',
      text: 'Files in `tests/` are compiled as separate crates that import `task_api` like any user would. They exercise real routing, JSON parsing, status codes, and error bodies.',
    },
    {
      type: 'code',
      title: 'tests/api.rs',
      code: `use std::sync::Arc;

use axum::{
    body::Body,
    http::{Request, StatusCode},
    Router,
};
use http_body_util::BodyExt;
use serde_json::{json, Value};
use tower::ServiceExt;
use wiremock::matchers::{method, path, query_param};
use wiremock::{Mock, MockServer, ResponseTemplate};

use task_api::{app, repo::MemoryRepo, todo_client::TodoClient, AppState};

fn test_app(todo_api_url: &str) -> Router {
    app(AppState {
        repo: Arc::new(MemoryRepo::default()),
        todos: Arc::new(TodoClient::new(todo_api_url).unwrap()),
    })
}

async fn send(app: &Router, method: &str, uri: &str, body: Option<Value>) -> (StatusCode, Value) {
    let builder = Request::builder().method(method).uri(uri);
    let request = match body {
        Some(json) => builder
            .header("content-type", "application/json")
            .body(Body::from(json.to_string()))
            .unwrap(),
        None => builder.body(Body::empty()).unwrap(),
    };

    // Cloning a Router is cheap and shares the same state.
    let response = app.clone().oneshot(request).await.unwrap();
    let status = response.status();
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    let body: Value = serde_json::from_slice(&bytes)
        .unwrap_or_else(|_| Value::String(String::from_utf8_lossy(&bytes).into_owned()));
    (status, body)
}

#[tokio::test]
async fn full_task_lifecycle() {
    let app = test_app("http://unused.invalid");

    let (status, created) = send(&app, "POST", "/tasks", Some(json!({ "title": "Write tests" }))).await;
    assert_eq!(status, StatusCode::CREATED);
    assert_eq!(created, json!({ "id": 1, "title": "Write tests", "done": false }));

    let (status, updated) = send(&app, "PATCH", "/tasks/1", Some(json!({ "done": true }))).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(updated["done"], true);

    let (_, done) = send(&app, "GET", "/tasks?done=true", None).await;
    assert_eq!(done.as_array().unwrap().len(), 1);

    let (status, _) = send(&app, "DELETE", "/tasks/1", None).await;
    assert_eq!(status, StatusCode::NO_CONTENT);

    let (status, body) = send(&app, "GET", "/tasks/1", None).await;
    assert_eq!(status, StatusCode::NOT_FOUND);
    assert_eq!(body, json!({ "error": "task 1 not found" }));
}

#[tokio::test]
async fn rejects_blank_title_with_422() {
    let app = test_app("http://unused.invalid");

    let (status, body) = send(&app, "POST", "/tasks", Some(json!({ "title": "   " }))).await;

    assert_eq!(status, StatusCode::UNPROCESSABLE_ENTITY);
    assert_eq!(body["error"], "title must not be empty");
}

#[tokio::test]
async fn imports_from_a_mock_server() {
    // wiremock starts a real HTTP server on a random local port.
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/todos"))
        .and(query_param("userId", "1"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!([
            { "userId": 1, "id": 1, "title": "first", "completed": false },
            { "userId": 1, "id": 2, "title": "second", "completed": true }
        ])))
        .expect(1) // checked automatically when the server is dropped
        .mount(&server)
        .await;

    let app = test_app(&server.uri());

    let (status, body) = send(&app, "POST", "/tasks/import/1", None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body, json!({ "imported": 2 }));

    let (_, tasks) = send(&app, "GET", "/tasks", None).await;
    assert_eq!(tasks.as_array().unwrap().len(), 2);
}`,
    },
    { type: 'h2', text: 'Step 6: Contract tests for the HTTP client' },
    {
      type: 'p',
      text: 'mockall replaced the whole client, so it cannot tell you whether `TodoClient` builds the right URL or parses the JSON correctly. wiremock can: the **real** client makes **real** HTTP requests, just to a local server you control.',
    },
    {
      type: 'code',
      title: 'tests/todo_client.rs',
      code: `use serde_json::json;
use wiremock::matchers::{method, path, query_param};
use wiremock::{Mock, MockServer, ResponseTemplate};

use task_api::todo_client::{ApiError, TodoClient};

#[tokio::test]
async fn parses_todos_from_the_api() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/todos"))
        .and(query_param("userId", "3"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!([
            { "userId": 3, "id": 41, "title": "mocked todo", "completed": true }
        ])))
        .expect(1)
        .mount(&server)
        .await;

    let client = TodoClient::new(server.uri()).unwrap();
    let todos = client.todos_for_user(3).await.unwrap();

    assert_eq!(todos.len(), 1);
    assert_eq!(todos[0].title, "mocked todo");
    assert!(todos[0].completed);
}

#[tokio::test]
async fn reports_error_status_and_body() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .respond_with(ResponseTemplate::new(429).set_body_string("slow down"))
        .mount(&server)
        .await;

    let client = TodoClient::new(server.uri()).unwrap();
    let err = client.todos_for_user(1).await.unwrap_err();

    match err {
        ApiError::Status { status, body } => {
            assert_eq!(status.as_u16(), 429);
            assert_eq!(body, "slow down");
        }
        other => panic!("expected a status error, got {other:?}"),
    }
}`,
    },
    { type: 'h2', text: 'Step 7: Testing the real SQL' },
    {
      type: 'p',
      text: 'Mocks cannot catch a typo in a SQL query. For that, run `SqliteRepo` against a fresh in-memory database with the real migrations applied. It is still fast, and nothing is left on disk.',
    },
    {
      type: 'code',
      title: 'tests/sqlite_repo.rs',
      code: `use sqlx::sqlite::SqlitePoolOptions;

use task_api::repo::{StoreError, TaskRepository};
use task_api::sqlite_repo::SqliteRepo;

async fn test_repo() -> SqliteRepo {
    // Each in-memory connection is its own empty database, so allow exactly one.
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .unwrap();
    sqlx::migrate!().run(&pool).await.unwrap();
    SqliteRepo::new(pool)
}

#[tokio::test]
async fn create_update_and_filter() {
    let repo = test_repo().await;

    let task = repo.create("persist me").await.unwrap();
    repo.create("still open").await.unwrap();
    repo.update(task.id, Some("renamed"), Some(true)).await.unwrap();

    let done = repo.list(Some(true)).await.unwrap();
    assert_eq!(done.len(), 1);
    assert_eq!(done[0].title, "renamed");
    assert_eq!(repo.list(None).await.unwrap().len(), 2);
}

#[tokio::test]
async fn missing_rows_are_not_found() {
    let repo = test_repo().await;

    assert_eq!(repo.get(99).await, Err(StoreError::NotFound(99)));
    assert_eq!(repo.delete(99).await, Err(StoreError::NotFound(99)));
}`,
    },
    {
      type: 'code',
      language: 'text',
      title: 'cargo test (summary)',
      code: `     Running unittests src/lib.rs
test routes::tests::import_saves_remote_todos ... ok
test routes::tests::upstream_failure_returns_502 ... ok
     Running tests/api.rs
test full_task_lifecycle ... ok
test imports_from_a_mock_server ... ok
test rejects_blank_title_with_422 ... ok
     Running tests/sqlite_repo.rs
test create_update_and_filter ... ok
test missing_rows_are_not_found ... ok
     Running tests/todo_client.rs
test parses_todos_from_the_api ... ok
test reports_error_status_and_body ... ok`,
    },
    {
      type: 'callout',
      variant: 'note',
      title: 'Going further',
      text: '`cargo install cargo-nextest` gives a faster test runner with clearer output (`cargo nextest run`). `cargo install cargo-llvm-cov` measures coverage (`cargo llvm-cov --html`). For PostgreSQL, the `#[sqlx::test]` attribute creates and deletes a separate database for every test.',
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Add a wiremock test where the server returns `200` with invalid JSON (`set_body_string("not json")`) and assert that `todos_for_user` returns `ApiError::Http`. Then add a handler test proving that importing a remote todo with a blank title returns 422 and saves nothing.',
    },
    {
      type: 'quiz',
      question: 'Why can `tests/api.rs` not use `MockTodoApi`, while the tests inside `src/routes.rs` can?',
      options: [
        'mockall only works with async code inside src/',
        'Integration tests cannot use traits',
        '`#[cfg_attr(test, automock)]` only applies when the library itself is compiled for its own unit tests; files in `tests/` link to the normal library build',
        'wiremock and mockall cannot be used in the same project',
      ],
      answer: 2,
      explanation: '`cfg(test)` is true only while compiling a crate\'s **own** unit tests. Each file in `tests/` is a separate crate that links to the library built **without** `cfg(test)`, so the generated mock does not exist there. That is why the integration tests use wiremock instead.',
    },
  ],
}
