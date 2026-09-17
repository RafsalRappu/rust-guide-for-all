export default {
  slug: 'getting-started',
  level: 'beginner',
  title: 'Getting Started with Rust',
  summary: 'What Rust is, why people love it, installing the toolchain, and writing your first program.',
  sections: [
    {
      type: 'p',
      text: '**Rust** is a programming language focused on three things: **speed**, **memory safety**, and **fearless concurrency**. It runs as fast as C and C++, but its compiler rules out whole categories of bugs (crashes, data races, dangling pointers) before your program ever runs.',
    },
    {
      type: 'p',
      text: 'People use Rust for command-line tools, web servers, game engines, embedded devices, browsers, operating systems, and WebAssembly. It has been voted the "most admired" language in developer surveys for years running.',
    },
    {
      type: 'callout',
      variant: 'note',
      title: 'No install needed to follow along',
      text: 'Every example marked **▶ Run in Playground** opens in the official Rust Playground in your browser. You can read this whole course without installing anything, then install Rust when you want to build real projects.',
    },
    { type: 'h2', text: 'Installing Rust' },
    {
      type: 'p',
      text: 'Rust is installed and updated with a tool called `rustup`. On macOS or Linux, run this in a terminal:',
    },
    {
      type: 'code',
      language: 'shell',
      title: 'macOS / Linux',
      code: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`,
    },
    {
      type: 'p',
      text: 'On Windows, download and run `rustup-init.exe` from rust-lang.org/tools/install. Then confirm the install worked:',
    },
    {
      type: 'code',
      language: 'shell',
      code: `rustc --version
cargo --version`,
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Need the full setup?',
      text: 'The **Setting Up Your Rust Environment** lesson in the Projects level covers the Windows C++ Build Tools, editor setup with rust-analyzer, managing toolchains, and fixes for the most common install errors.',
    },
    { type: 'h2', text: 'Your first project with Cargo' },
    {
      type: 'p',
      text: '**Cargo** is Rust\'s build tool and package manager. It creates projects, compiles them, runs tests, and downloads libraries (which Rust calls **crates**).',
    },
    {
      type: 'code',
      language: 'shell',
      code: `cargo new hello_rust
cd hello_rust
cargo run`,
    },
    {
      type: 'p',
      text: 'Cargo generated a `src/main.rs` file for you. Here it is:',
    },
    {
      type: 'code',
      title: 'src/main.rs',
      runnable: true,
      code: `fn main() {
    println!("Hello, world!");
}`,
      output: 'Hello, world!',
    },
    {
      type: 'list',
      items: [
        '`fn main()` declares the **main function**, where every Rust program starts.',
        '`println!` prints a line of text. The `!` means it is a **macro**, not a regular function. Macros are covered in the Expert section; for now, just remember the `!`.',
        'Statements end with a semicolon `;`.',
      ],
    },
    { type: 'h2', text: 'Printing values' },
    {
      type: 'p',
      text: 'Curly braces `{}` inside the string are placeholders. You can put a variable name directly inside them:',
    },
    {
      type: 'code',
      runnable: true,
      code: `fn main() {
    let name = "Ferris";
    let age = 8;
    println!("Hi, I'm {name} and I'm {age} years old.");
    println!("{} + {} = {}", 2, 3, 2 + 3);
}`,
      output: `Hi, I'm Ferris and I'm 8 years old.
2 + 3 = 5`,
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Open the example above in the Playground. Change it to print your own name, and add a third line that prints the result of `7 * 6`.',
    },
    {
      type: 'quiz',
      question: 'Why does `println!` end with an exclamation mark?',
      options: [
        'It makes the output louder',
        'It marks a macro rather than a normal function',
        'It means the line might panic',
        'It is required on the last line of `main`',
      ],
      answer: 1,
      explanation: 'The `!` tells you `println!` is a **macro**. Macros generate code at compile time, which lets `println!` accept a variable number of arguments.',
    },
  ],
}
