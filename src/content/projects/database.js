export default {
  slug: 'database',
  level: 'projects',
  title: 'Adding a Database with SQLx',
  summary: 'Move task-api from memory to SQLite: a repository trait, migrations, connection pools, and safe parameterized queries.',
  sections: [
    {
      type: 'p',
      text: 'Right now every task disappears when the server restarts. In this lesson, **task-api** stores tasks in **SQLite** using **SQLx**, an async SQL toolkit. SQLite needs no server and is just a file, so it is perfect for learning. The same code moves to PostgreSQL with a few small changes.',
    },
    { type: 'h2', text: 'Step 1: Describe storage with a trait' },
    {
      type: 'p',
      text: 'Before touching SQL, define **what** storage must do as a trait. Handlers will depend on the trait, not on a concrete type. That lets you swap memory for SQLite now, and swap in a mock during tests in a later lesson.',
    },
    {
      type: 'code',
      language: 'shell',
      code: `cargo add async-trait`,
    },
    {
      type: 'p',
      text: 'Two small changes from the previous lesson: ids become `i64`, because SQLite stores signed 64-bit integers, and the old `TaskStore` becomes `MemoryRepo`, one implementation of the trait. `#[async_trait]` lets trait methods be `async` and still be used through `Arc<dyn TaskRepository>`.',
    },
    {
      type: 'code',
      runnable: true,
      title: 'src/repo.rs',
      code: `use std::collections::BTreeMap;
use std::sync::{Arc, Mutex};

use async_trait::async_trait;

#[derive(Debug, Clone, PartialEq)]
pub struct Task {
    pub id: i64,
    pub title: String,
    pub done: bool,
}

#[derive(Debug, PartialEq)]
pub enum StoreError {
    NotFound(i64),
    EmptyTitle,
}

#[async_trait]
pub trait TaskRepository: Send + Sync {
    async fn create(&self, title: &str) -> Result<Task, StoreError>;
    async fn list(&self, done: Option<bool>) -> Result<Vec<Task>, StoreError>;
    async fn get(&self, id: i64) -> Result<Task, StoreError>;
    async fn update(&self, id: i64, title: Option<&str>, done: Option<bool>) -> Result<Task, StoreError>;
    async fn delete(&self, id: i64) -> Result<(), StoreError>;
}

pub fn clean_title(title: &str) -> Result<String, StoreError> {
    let title = title.trim();
    if title.is_empty() {
        return Err(StoreError::EmptyTitle);
    }
    Ok(title.to_string())
}

#[derive(Default)]
struct Inner {
    tasks: BTreeMap<i64, Task>,
    last_id: i64,
}

#[derive(Default)]
pub struct MemoryRepo {
    inner: Mutex<Inner>,
}

#[async_trait]
impl TaskRepository for MemoryRepo {
    async fn create(&self, title: &str) -> Result<Task, StoreError> {
        let title = clean_title(title)?;
        let mut inner = self.inner.lock().unwrap();
        inner.last_id += 1;
        let task = Task { id: inner.last_id, title, done: false };
        inner.tasks.insert(task.id, task.clone());
        Ok(task)
    }

    async fn list(&self, done: Option<bool>) -> Result<Vec<Task>, StoreError> {
        let inner = self.inner.lock().unwrap();
        Ok(inner.tasks.values().filter(|t| done.is_none_or(|d| t.done == d)).cloned().collect())
    }

    async fn get(&self, id: i64) -> Result<Task, StoreError> {
        let inner = self.inner.lock().unwrap();
        inner.tasks.get(&id).cloned().ok_or(StoreError::NotFound(id))
    }

    async fn update(&self, id: i64, title: Option<&str>, done: Option<bool>) -> Result<Task, StoreError> {
        let mut inner = self.inner.lock().unwrap();
        let task = inner.tasks.get_mut(&id).ok_or(StoreError::NotFound(id))?;
        if let Some(title) = title {
            task.title = clean_title(title)?;
        }
        if let Some(done) = done {
            task.done = done;
        }
        Ok(task.clone())
    }

    async fn delete(&self, id: i64) -> Result<(), StoreError> {
        let mut inner = self.inner.lock().unwrap();
        inner.tasks.remove(&id).map(|_| ()).ok_or(StoreError::NotFound(id))
    }
}

// Code that only knows the trait works with any storage.
async fn demo(repo: Arc<dyn TaskRepository>) -> Result<(), StoreError> {
    let first = repo.create("Learn SQL").await?;
    repo.create("Write migrations").await?;
    repo.update(first.id, None, Some(true)).await?;
    println!("all: {:?}", repo.list(None).await?);
    println!("done: {:?}", repo.list(Some(true)).await?);
    repo.delete(first.id).await?;
    println!("after delete: {:?}", repo.get(first.id).await);
    Ok(())
}

#[tokio::main]
async fn main() {
    let repo: Arc<dyn TaskRepository> = Arc::new(MemoryRepo::default());
    if let Err(e) = demo(repo).await {
        println!("error: {e:?}");
    }
}`,
      output: `all: [Task { id: 1, title: "Learn SQL", done: true }, Task { id: 2, title: "Write migrations", done: false }]
done: [Task { id: 1, title: "Learn SQL", done: true }]
after delete: Err(NotFound(1))`,
    },
    {
      type: 'p',
      text: 'In the project, `repo.rs` has no `demo` or `main`. `Task` also derives `serde::Serialize` (for JSON) and `sqlx::FromRow` (for reading database rows), which you add in the next steps.',
    },
    { type: 'h2', text: 'Step 2: Add SQLx and the migration tool' },
    {
      type: 'code',
      language: 'shell',
      code: `cargo add sqlx --features runtime-tokio,sqlite
cargo add dotenvy
cargo install sqlx-cli --no-default-features --features sqlite`,
    },
    {
      type: 'code',
      language: 'shell',
      title: '.env',
      code: `DATABASE_URL=sqlite:tasks.db?mode=rwc`,
    },
    {
      type: 'p',
      text: '`mode=rwc` means read, write, and **create** the file if it does not exist. Add `tasks.db` to `.gitignore` along with `.env`.',
    },
    { type: 'h2', text: 'Step 3: Create the table with a migration' },
    {
      type: 'p',
      text: 'A **migration** is a versioned SQL file that changes the schema. Migrations run in order and are recorded in the database, so every environment ends up with exactly the same tables.',
    },
    {
      type: 'code',
      language: 'shell',
      code: `sqlx database create
sqlx migrate add create_tasks`,
    },
    {
      type: 'code',
      language: 'sql',
      title: 'migrations/20260101120000_create_tasks.sql',
      code: `CREATE TABLE IF NOT EXISTS tasks (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT    NOT NULL CHECK (length(trim(title)) > 0),
    done  BOOLEAN NOT NULL DEFAULT FALSE
);`,
    },
    {
      type: 'p',
      text: 'The timestamp in the file name is generated for you. Never edit a migration that has already run somewhere; add a new one instead (for example `sqlx migrate add add_due_date`).',
    },
    { type: 'h2', text: 'Step 4: Implement the trait for SQLite' },
    {
      type: 'code',
      title: 'src/repo.rs (changes)',
      code: `#[derive(Debug, Clone, PartialEq, serde::Serialize, sqlx::FromRow)]
pub struct Task {
    pub id: i64,
    pub title: String,
    pub done: bool,
}

#[derive(Debug, PartialEq)]
pub enum StoreError {
    NotFound(i64),
    EmptyTitle,
    Database(String),
}

impl From<sqlx::Error> for StoreError {
    fn from(err: sqlx::Error) -> Self {
        StoreError::Database(err.to_string())
    }
}`,
    },
    {
      type: 'code',
      title: 'src/sqlite_repo.rs',
      code: `use async_trait::async_trait;
use sqlx::SqlitePool;

use crate::repo::{clean_title, StoreError, Task, TaskRepository};

pub struct SqliteRepo {
    pool: SqlitePool,
}

impl SqliteRepo {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl TaskRepository for SqliteRepo {
    async fn create(&self, title: &str) -> Result<Task, StoreError> {
        let title = clean_title(title)?;
        let task = sqlx::query_as::<_, Task>(
            "INSERT INTO tasks (title) VALUES (?) RETURNING id, title, done",
        )
        .bind(title)
        .fetch_one(&self.pool)
        .await?;
        Ok(task)
    }

    async fn list(&self, done: Option<bool>) -> Result<Vec<Task>, StoreError> {
        let tasks = sqlx::query_as::<_, Task>(
            "SELECT id, title, done FROM tasks WHERE (? IS NULL OR done = ?) ORDER BY id",
        )
        .bind(done)
        .bind(done)
        .fetch_all(&self.pool)
        .await?;
        Ok(tasks)
    }

    async fn get(&self, id: i64) -> Result<Task, StoreError> {
        sqlx::query_as::<_, Task>("SELECT id, title, done FROM tasks WHERE id = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?
            .ok_or(StoreError::NotFound(id))
    }

    async fn update(&self, id: i64, title: Option<&str>, done: Option<bool>) -> Result<Task, StoreError> {
        let title = title.map(clean_title).transpose()?;
        sqlx::query_as::<_, Task>(
            "UPDATE tasks SET title = COALESCE(?, title), done = COALESCE(?, done)
             WHERE id = ? RETURNING id, title, done",
        )
        .bind(title)
        .bind(done)
        .bind(id)
        .fetch_optional(&self.pool)
        .await?
        .ok_or(StoreError::NotFound(id))
    }

    async fn delete(&self, id: i64) -> Result<(), StoreError> {
        let result = sqlx::query("DELETE FROM tasks WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        if result.rows_affected() == 0 {
            return Err(StoreError::NotFound(id));
        }
        Ok(())
    }
}`,
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'Always bind, never format',
      text: 'Pass values with `.bind(...)`, never with `format!` into the SQL string. Bound values are sent separately from the query, so input like `x\'); DROP TABLE tasks; --` is stored as plain text instead of being run as SQL (a **SQL injection** attack).',
    },
    { type: 'h2', text: 'Step 5: Wire it into the app' },
    {
      type: 'p',
      text: 'The shared state becomes "any repository". Handlers now `.await` repository calls, and ids are `i64`. The request structs and `health` stay the same. Delete `src/store.rs` (replaced by `repo.rs`), and in `src/error.rs` change `use crate::store::StoreError;` to `use crate::repo::StoreError;`.',
    },
    {
      type: 'code',
      title: 'src/lib.rs',
      code: `pub mod error;
pub mod repo;
pub mod routes;
pub mod sqlite_repo;

use std::sync::Arc;

use axum::{routing::get, Router};

use repo::TaskRepository;

pub type AppState = Arc<dyn TaskRepository>;

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
      type: 'code',
      title: 'src/routes.rs (handlers)',
      code: `use crate::repo::{StoreError, Task};
use crate::AppState;

// CreateTask, UpdateTask, ListParams and health() are unchanged.

pub async fn list_tasks(
    State(repo): State<AppState>,
    Query(params): Query<ListParams>,
) -> Result<Json<Vec<Task>>, StoreError> {
    repo.list(params.done).await.map(Json)
}

pub async fn create_task(
    State(repo): State<AppState>,
    Json(input): Json<CreateTask>,
) -> Result<(StatusCode, Json<Task>), StoreError> {
    let task = repo.create(&input.title).await?;
    Ok((StatusCode::CREATED, Json(task)))
}

pub async fn get_task(
    State(repo): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<Task>, StoreError> {
    repo.get(id).await.map(Json)
}

pub async fn update_task(
    State(repo): State<AppState>,
    Path(id): Path<i64>,
    Json(input): Json<UpdateTask>,
) -> Result<Json<Task>, StoreError> {
    repo.update(id, input.title.as_deref(), input.done).await.map(Json)
}

pub async fn delete_task(
    State(repo): State<AppState>,
    Path(id): Path<i64>,
) -> Result<StatusCode, StoreError> {
    repo.delete(id).await?;
    Ok(StatusCode::NO_CONTENT)
}`,
    },
    {
      type: 'code',
      title: 'src/error.rs (new match arm)',
      code: `StoreError::Database(detail) => {
    // Log the real cause, but never leak database details to clients.
    tracing::error!(%detail, "database error");
    (StatusCode::INTERNAL_SERVER_ERROR, "internal server error".to_string())
}`,
    },
    {
      type: 'code',
      title: 'src/main.rs',
      code: `use std::sync::Arc;

use sqlx::sqlite::SqlitePoolOptions;
use task_api::{app, sqlite_repo::SqliteRepo, AppState};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt().init();

    let database_url = std::env::var("DATABASE_URL")?;
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    // Embeds ./migrations into the binary and applies any that have not run yet.
    sqlx::migrate!().run(&pool).await?;

    let state: AppState = Arc::new(SqliteRepo::new(pool));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await?;
    tracing::info!("listening on http://127.0.0.1:3000");
    axum::serve(listener, app(state)).await?;
    Ok(())
}`,
    },
    {
      type: 'p',
      text: 'Run `cargo run`, create a few tasks with the curl commands from the previous lesson, stop the server, and start it again. The tasks are still there.',
    },
    {
      type: 'list',
      items: [
        '**Connection pool**: opening a database connection is slow, so the pool keeps a few open and lends them to requests. `SqlitePool` is cheap to clone and safe to share.',
        '**`fetch_one`** expects exactly one row, **`fetch_optional`** zero or one, **`fetch_all`** any number, and **`execute`** runs a statement that returns no rows.',
        '**`RETURNING`** gives back the inserted or updated row in the same query, so there is no second `SELECT`.',
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Compile-time checked SQL',
      text: 'The `sqlx::query_as!` macro (with `!`) checks your SQL and column types against the real database **while compiling**, so a typo in a column name becomes a compile error. It needs `DATABASE_URL` at build time; run `cargo sqlx prepare` and commit the `.sqlx` folder so CI can build without a database.',
    },
    {
      type: 'callout',
      variant: 'note',
      title: 'Moving to PostgreSQL',
      text: 'Change the feature to `postgres`, use `PgPool` and `PgPoolOptions`, write placeholders as `$1`, `$2` instead of `?`, and use `BIGSERIAL PRIMARY KEY` in the migration. For a local server, run `docker run -e POSTGRES_PASSWORD=secret -p 5432:5432 postgres:17` and set `DATABASE_URL=postgres://postgres:secret@localhost/tasks`.',
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Write a second migration that adds a nullable `due_date TEXT` column. Add `due_date: Option<String>` to `Task`, accept it in `CreateTask`, and add a `GET /tasks?overdue=true` filter that compares `due_date` with `date(\'now\')`.',
    },
    {
      type: 'quiz',
      question: 'Why does `SqliteRepo` use `.bind(title)` instead of building the query with `format!`?',
      options: [
        'bind is faster to type',
        'format! cannot be used inside async functions',
        'Bound parameters are sent separately from the SQL, which prevents SQL injection',
        'SQLite does not support string literals',
      ],
      answer: 2,
      explanation: 'With `.bind`, the database always treats the value as **data**, never as SQL code. Formatting user input into a query string lets an attacker change what the query does.',
    },
  ],
}
