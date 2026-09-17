export default {
  slug: 'setup',
  level: 'projects',
  title: 'Setting Up Your Rust Environment',
  summary: 'Install Rust on Windows, macOS, or Linux, manage toolchains, set up your editor, and fix the most common install problems.',
  sections: [
    {
      type: 'p',
      text: 'Until now you could learn everything in the Playground. To build real projects you need Rust on your own machine. This lesson walks through a complete, professional setup, so you get it right the first time.',
    },
    {
      type: 'list',
      items: [
        '**rustup**: installs and updates Rust itself, and switches between versions.',
        '**rustc**: the compiler. You rarely call it directly.',
        '**cargo**: the build tool and package manager. You use it for almost everything.',
        '**A linker**: Rust needs a system linker to produce executables. This is the part that most often goes wrong.',
      ],
    },
    { type: 'h2', text: 'Installing on Windows' },
    {
      type: 'p',
      text: 'On Windows, Rust uses the Microsoft C++ linker by default, so you need the **Visual Studio C++ Build Tools**. Recent versions of the installer offer to set them up for you.',
    },
    {
      type: 'list',
      items: [
        'Download and run `rustup-init.exe` from rust-lang.org/tools/install.',
        'If it says the Visual Studio prerequisites are missing, choose the option to install them. It opens the Visual Studio installer with **Desktop development with C++** selected.',
        'Back in the rustup prompt, press Enter to accept the default installation.',
        '**Close and reopen your terminal** so the new `PATH` takes effect.',
      ],
    },
    {
      type: 'p',
      text: 'If you prefer a package manager, `winget` does the same thing:',
    },
    {
      type: 'code',
      language: 'shell',
      title: 'Windows (PowerShell)',
      code: `winget install Rustlang.Rustup`,
    },
    { type: 'h2', text: 'Installing on macOS and Linux' },
    {
      type: 'p',
      text: 'First install a C toolchain, which provides the linker. Then run the official install script.',
    },
    {
      type: 'code',
      language: 'shell',
      title: 'macOS',
      code: `xcode-select --install
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`,
    },
    {
      type: 'code',
      language: 'shell',
      title: 'Linux (Debian / Ubuntu)',
      code: `sudo apt update && sudo apt install -y build-essential pkg-config libssl-dev
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"`,
    },
    {
      type: 'callout',
      variant: 'note',
      title: 'Why pkg-config and libssl-dev?',
      text: 'You do not need them for "Hello, world". Many crates that talk to the network (such as `reqwest` with its default features) link to OpenSSL on Linux, and installing these now saves a confusing build error later. On Fedora, use `sudo dnf install gcc pkgconf-pkg-config openssl-devel`.',
    },
    { type: 'h2', text: 'Check that everything works' },
    {
      type: 'code',
      language: 'shell',
      code: `rustc --version
cargo --version
rustup show`,
    },
    {
      type: 'code',
      language: 'text',
      title: 'Example output',
      code: `rustc 1.85.0 (4d91de4e4 2025-02-17)
cargo 1.85.0 (d73d2caf9 2024-12-31)
Default host: x86_64-pc-windows-msvc
...
active toolchain: stable-x86_64-pc-windows-msvc (default)`,
    },
    {
      type: 'p',
      text: 'Your version numbers will be newer. What matters is that all three commands run. Everything rustup installs lives in `~/.cargo` and `~/.rustup` (on Windows, `%USERPROFILE%\\.cargo` and `%USERPROFILE%\\.rustup`).',
    },
    { type: 'h2', text: 'Managing toolchains' },
    {
      type: 'p',
      text: 'Rust ships a new **stable** release every six weeks. rustup keeps you current and lets you install other channels side by side.',
    },
    {
      type: 'code',
      language: 'shell',
      code: `rustup update                       # update every installed toolchain
rustup toolchain install nightly    # install the nightly channel too
cargo +nightly build                # use nightly for one command
rustup default stable               # choose the default toolchain
rustup component add rustfmt clippy # formatter and linter
rustup target add wasm32-unknown-unknown  # compile for another platform
rustup doc --book                   # open "The Rust Book" offline`,
    },
    {
      type: 'p',
      text: 'To make sure everyone on a team (and your CI server) builds with the same compiler, commit a `rust-toolchain.toml` file at the root of the project. rustup reads it automatically and installs that version if needed.',
    },
    {
      type: 'code',
      language: 'toml',
      title: 'rust-toolchain.toml',
      code: `[toolchain]
channel = "1.85.0"          # or "stable" to always use the latest
components = ["rustfmt", "clippy"]`,
    },
    { type: 'h2', text: 'Setting up your editor' },
    {
      type: 'p',
      text: '**rust-analyzer** is the official language server. It gives you autocomplete, inline type hints, go-to-definition, and errors as you type. It works in VS Code, RustRover, Zed, Neovim, Helix, and others.',
    },
    {
      type: 'list',
      items: [
        '**VS Code**: install the `rust-analyzer` extension (publisher: rust-lang). For TOML files, add **Even Better TOML**.',
        '**Debugging in VS Code**: install **CodeLLDB**. On Windows with the MSVC toolchain, the Microsoft **C/C++** extension debugger also works well.',
        '**RustRover** (JetBrains) is a full Rust IDE with debugging built in.',
      ],
    },
    {
      type: 'code',
      language: 'json',
      title: '.vscode/settings.json',
      code: `{
  "editor.formatOnSave": true,
  "rust-analyzer.check.command": "clippy",
  "[rust]": {
    "editor.defaultFormatter": "rust-lang.rust-analyzer"
  }
}`,
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Open the project folder, not a single file',
      text: 'rust-analyzer finds your code through `Cargo.toml`. If autocomplete does nothing, make sure you opened the folder that contains `Cargo.toml` (or a parent workspace), not just `main.rs`.',
    },
    { type: 'h2', text: 'Creating projects' },
    {
      type: 'code',
      language: 'shell',
      code: `cargo new my_app          # a binary (program) in a new folder
cargo new my_lib --lib    # a library
cd existing_folder
cargo init                # turn an existing folder into a Cargo project`,
    },
    {
      type: 'code',
      language: 'text',
      title: 'What cargo new creates',
      code: `my_app/
├── .git/          # cargo new also starts a Git repository
├── .gitignore     # ignores /target
├── Cargo.toml     # project name, version, dependencies
└── src/
    └── main.rs    # fn main() { println!("Hello, world!"); }`,
    },
    {
      type: 'p',
      text: 'Build output goes into `target/`. It can grow to several gigabytes on big projects, and `cargo clean` deletes it safely.',
    },
    { type: 'h2', text: 'Fixing common install problems' },
    {
      type: 'list',
      items: [
        '**`cargo: command not found`** or **`cargo is not recognized`**: open a new terminal. If it still fails, add `~/.cargo/bin` (Windows: `%USERPROFILE%\\.cargo\\bin`) to your `PATH`.',
        '**`linker link.exe not found`** (Windows): the C++ Build Tools are missing. Run the Visual Studio Installer and add **Desktop development with C++**.',
        '**`linker cc not found`** (Linux/macOS): install `build-essential` or run `xcode-select --install`.',
        '**`failed to run custom build command for openssl-sys`** (Linux): install `pkg-config` and `libssl-dev`.',
        '**Downloads fail behind a company proxy**: set `HTTPS_PROXY` (and `HTTP_PROXY`) before running `rustup` or `cargo`.',
        '**The first build is slow**: Cargo compiles every dependency once. Later builds reuse that work and are much faster.',
      ],
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Install Rust, then run `cargo new hello_setup`, open the folder in your editor, and hover over `println!` to confirm rust-analyzer is working. Add a `rust-toolchain.toml` that pins `stable` with `clippy`, and run `cargo clippy`.',
    },
    {
      type: 'quiz',
      question: 'On Windows, `cargo build` fails with "linker `link.exe` not found". What is the fix?',
      options: [
        'Reinstall rustup with the nightly toolchain',
        'Install the Visual Studio C++ Build Tools ("Desktop development with C++")',
        'Delete the `target` folder and build again',
        'Add `link.exe` to `Cargo.toml` under `[dependencies]`',
      ],
      answer: 1,
      explanation: 'The default Windows toolchain (`x86_64-pc-windows-msvc`) uses Microsoft\'s linker, which comes with the **C++ Build Tools**. Rust itself installed fine; it just has nothing to link your program with.',
    },
  ],
}
