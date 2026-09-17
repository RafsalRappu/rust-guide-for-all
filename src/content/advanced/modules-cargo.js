export default {
  slug: 'modules-cargo',
  level: 'advanced',
  title: 'Modules, Crates & Cargo',
  summary: 'Organizing code into modules, controlling visibility, using external crates, and testing.',
  sections: [
    {
      type: 'p',
      text: 'As a program grows, you split it into pieces. Rust has a small set of terms for this:',
    },
    {
      type: 'list',
      items: [
        '**Package**: a Cargo project with a `Cargo.toml`. It contains one or more crates.',
        '**Crate**: one compilation unit. A **binary crate** has `main.rs`; a **library crate** has `lib.rs`.',
        '**Module**: a named namespace inside a crate, declared with `mod`.',
        '**Path**: how you name an item, such as `crate::garden::plant`.',
      ],
    },
    { type: 'h2', text: 'Modules and visibility' },
    {
      type: 'p',
      text: 'Everything is **private by default**. Mark items `pub` to expose them outside their module. For structs, each field needs its own `pub`.',
    },
    {
      type: 'code',
      runnable: true,
      code: `mod garden {
    pub mod vegetables {
        pub struct Carrot {
            pub length_cm: u32,
            secret: bool, // private: only code inside \`vegetables\` can touch it
        }

        impl Carrot {
            pub fn new(length_cm: u32) -> Self {
                Self { length_cm, secret: true }
            }

            pub fn is_secret(&self) -> bool {
                self.secret
            }
        }
    }

    pub fn plant() -> vegetables::Carrot {
        vegetables::Carrot::new(12)
    }
}

use garden::vegetables::Carrot;

fn main() {
    let carrot: Carrot = garden::plant();
    println!("Carrot: {}cm, secret: {}", carrot.length_cm, carrot.is_secret());
    // carrot.secret; // error[E0616]: field \`secret\` is private
}`,
      output: 'Carrot: 12cm, secret: true',
    },
    { type: 'h2', text: 'Splitting modules into files' },
    {
      type: 'p',
      text: 'In real projects, `mod garden;` (with a semicolon) tells the compiler to load the module from a file:',
    },
    {
      type: 'code',
      language: 'text',
      title: 'Project layout',
      code: `my_app/
├── Cargo.toml
└── src/
    ├── main.rs          // mod garden;
    ├── garden.rs        // pub mod vegetables;
    └── garden/
        └── vegetables.rs  // pub struct Carrot { ... }`,
    },
    {
      type: 'list',
      items: [
        '`use crate::garden::plant;` brings a path into scope from the crate root.',
        '`use super::something;` refers to the parent module.',
        '`pub use` re-exports an item, letting you design a clean public API.',
        '`pub(crate)` makes something visible anywhere in this crate, but not to users of your library.',
      ],
    },
    { type: 'h2', text: 'Using external crates' },
    {
      type: 'p',
      text: 'Libraries are published on **crates.io**. Add them with `cargo add`, which updates `Cargo.toml`:',
    },
    {
      type: 'code',
      language: 'shell',
      code: `cargo add serde --features derive
cargo add serde_json`,
    },
    {
      type: 'code',
      language: 'toml',
      title: 'Cargo.toml',
      code: `[package]
name = "my_app"
version = "0.1.0"
edition = "2024"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"`,
    },
    {
      type: 'code',
      title: 'src/main.rs',
      code: `use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
struct Config {
    name: String,
    port: u16,
}

fn main() -> Result<(), serde_json::Error> {
    let config: Config = serde_json::from_str(r#"{"name":"api","port":8080}"#)?;
    println!("{:?}", config);
    println!("{}", serde_json::to_string_pretty(&config)?);
    Ok(())
}`,
    },
    { type: 'h2', text: 'Testing' },
    {
      type: 'p',
      text: 'Tests live right next to the code. `#[cfg(test)]` means the module is only compiled when running `cargo test`.',
    },
    {
      type: 'code',
      title: 'src/lib.rs',
      code: `/// Adds two numbers.
///
/// \`\`\`
/// assert_eq!(my_app::add(2, 2), 4);
/// \`\`\`
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn adds_positive_numbers() {
        assert_eq!(add(2, 3), 5);
    }

    #[test]
    #[should_panic(expected = "overflow")]
    fn overflow_panics_in_debug() {
        let _ = add(i32::MAX, 1);
    }
}`,
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Doc comments are tested too',
      text: 'The code block inside the `///` doc comment is a **doc test**. `cargo test` compiles and runs it, so your documentation examples cannot silently go out of date.',
    },
    { type: 'h2', text: 'Cargo commands you will use every day' },
    {
      type: 'list',
      items: [
        '`cargo check`: type-check quickly without producing a binary.',
        '`cargo run` / `cargo build --release`: build and run, or build an optimized binary.',
        '`cargo test`: run unit, integration, and doc tests.',
        '`cargo fmt`: format code in the standard style.',
        '`cargo clippy`: a linter with hundreds of helpful suggestions.',
        '`cargo doc --open`: generate HTML docs for your crate and all dependencies.',
      ],
    },
    {
      type: 'callout',
      variant: 'note',
      title: 'Going deeper',
      text: 'Profiles, workspaces, features, `.cargo/config.toml`, environment variables, and logging are covered in **Configuring Cargo & Your App**. Integration tests and mocking are covered in **Testing & Mocking**. Both are in the Projects level.',
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Create a project with `cargo new shapes --lib`. Put a `Circle` in `src/circle.rs` with a public `area` method, expose it from `lib.rs` with `pub mod circle;`, and write two tests for it.',
    },
    {
      type: 'quiz',
      question: 'A struct is `pub`, but one of its fields is not. What can code outside the module do?',
      options: [
        'Read and write every field',
        'Use the type and its public fields, but not the private field',
        'Nothing: the whole struct stays private',
        'Read the private field but not write it',
      ],
      answer: 1,
      explanation: 'Visibility is per item. A `pub struct` exposes the type, but each field is private unless marked `pub`. That is also why the struct needs a public constructor like `new` when it has private fields.',
    },
  ],
}
