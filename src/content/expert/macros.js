export default {
  slug: 'macros',
  level: 'expert',
  title: 'Macros',
  summary: 'Writing code that writes code: declarative macro_rules! and an introduction to procedural macros.',
  sections: [
    {
      type: 'p',
      text: 'You have used macros since your first lesson: `println!`, `vec!`, `format!`, `#[derive(Debug)]`. A macro runs at **compile time** and expands into ordinary Rust code. Macros can do things functions cannot, such as accept a variable number of arguments or generate new types and `impl` blocks.',
    },
    { type: 'h2', text: 'Declarative macros: macro_rules!' },
    {
      type: 'p',
      text: 'A `macro_rules!` macro matches the code you pass it against **patterns**, similar to `match`, and substitutes it into a template. `$x:expr` captures an expression and names it `$x`.',
    },
    {
      type: 'code',
      runnable: true,
      code: `macro_rules! square {
    ($x:expr) => {
        $x * $x
    };
}

// $( ... ),* repeats zero or more times, separated by commas
// $(,)? allows an optional trailing comma
macro_rules! hashmap {
    ($($key:expr => $value:expr),* $(,)?) => {{
        let mut map = ::std::collections::HashMap::new();
        $( map.insert($key, $value); )*
        map
    }};
}

// Several rules plus recursion
macro_rules! maximum {
    ($x:expr) => { $x };
    ($x:expr, $($rest:expr),+) => {{
        let a = $x;
        let b = maximum!($($rest),+);
        if a > b { a } else { b }
    }};
}

fn main() {
    println!("square!(2 + 3) = {}", square!(2 + 3));

    let ages = hashmap! {
        "Ada" => 36,
        "Grace" => 85,
    };
    println!("Grace is {}", ages["Grace"]);

    println!("max = {}", maximum!(3, 9, 4, 7));
}`,
      output: `square!(2 + 3) = 25
Grace is 85
max = 9`,
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Safer than C macros',
      text: 'In C, `#define SQUARE(x) x * x` turns `SQUARE(2 + 3)` into `2 + 3 * 2 + 3 = 11`. Rust macros work on parsed syntax, so `$x` stays one expression and the answer is 25. They are also **hygienic**: variables created inside a macro cannot clash with yours.',
    },
    { type: 'h2', text: 'Fragment specifiers' },
    {
      type: 'list',
      items: [
        '`expr`: an expression, like `2 + 3` or `foo()`',
        '`ident`: an identifier, like a variable or function name',
        '`ty`: a type, like `Vec<i32>`',
        '`pat`: a pattern, like `Some(x)`',
        '`block`: a `{ ... }` block',
        '`literal`: a literal, like `42` or `"hi"`',
        '`tt`: a single token tree, the most flexible option',
      ],
    },
    { type: 'h2', text: 'Generating code with ident' },
    {
      type: 'code',
      runnable: true,
      code: `macro_rules! make_struct {
    ($name:ident { $($field:ident: $ty:ty),* }) => {
        #[derive(Debug, Default)]
        struct $name {
            $($field: $ty),*
        }

        impl $name {
            fn field_names() -> Vec<&'static str> {
                vec![$(stringify!($field)),*]
            }
        }
    };
}

make_struct!(Player { name: String, score: u32, level: u8 });

fn main() {
    let p = Player { name: String::from("Ferris"), ..Default::default() };
    println!("{:?}", p);
    println!("fields: {:?}", Player::field_names());
}`,
      output: `Player { name: "Ferris", score: 0, level: 0 }
fields: ["name", "score", "level"]`,
    },
    { type: 'h2', text: 'Procedural macros' },
    {
      type: 'p',
      text: 'For more power, **procedural macros** are Rust functions that receive a stream of tokens and return new tokens. They live in their own crate with `proc-macro = true`, and usually use the `syn` (parsing) and `quote` (generating) crates. There are three kinds:',
    },
    {
      type: 'list',
      items: [
        '**Derive macros**: `#[derive(Serialize)]` generates trait impls for a struct or enum.',
        '**Attribute macros**: `#[tokio::main]` rewrites the item it is attached to.',
        '**Function-like macros**: `sqlx::query!("SELECT ...")` can even check SQL against a database at compile time.',
      ],
    },
    {
      type: 'code',
      title: 'hello_macro_derive/src/lib.rs',
      code: `use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

#[proc_macro_derive(HelloMacro)]
pub fn hello_macro_derive(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);
    let name = &ast.ident;

    quote! {
        impl #name {
            pub fn hello() {
                println!("Hello! My name is {}", stringify!(#name));
            }
        }
    }
    .into()
}`,
    },
    {
      type: 'callout',
      variant: 'note',
      title: 'See what a macro expands to',
      text: 'Install `cargo-expand` (`cargo install cargo-expand`) and run `cargo expand` to print your code with every macro fully expanded. It is the best way to understand or debug macros.',
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'Use macros sparingly',
      text: 'Macros are harder to read, harder to debug, and slower to compile than functions. Reach for a function or generic first, and use a macro only when those truly cannot express what you need.',
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Write `macro_rules! min_of` that works like `maximum!` above but returns the smallest value. Then write `macro_rules! assert_all_positive` that takes any number of expressions and panics with a helpful message if any are not positive.',
    },
    {
      type: 'quiz',
      question: 'Which kind of macro is `#[derive(Debug)]`?',
      options: ['A declarative `macro_rules!` macro', 'A procedural derive macro', 'An attribute macro', 'A function-like macro'],
      answer: 1,
      explanation: '`derive` attributes invoke **procedural derive macros**, which receive the struct or enum definition and generate trait implementations for it.',
    },
  ],
}
