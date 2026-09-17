export default {
  slug: 'unsafe-ffi',
  level: 'expert',
  title: 'Unsafe Rust & FFI',
  summary: 'What unsafe really unlocks, building safe abstractions on top of it, and calling C code.',
  sections: [
    {
      type: 'p',
      text: 'The compiler is conservative: it rejects some programs that are actually correct, because it cannot prove they are. And some tasks, like talking to hardware or C libraries, cannot be checked at all. `unsafe` is how you tell the compiler: "I have checked this myself."',
    },
    {
      type: 'callout',
      variant: 'note',
      title: 'unsafe does NOT turn off the borrow checker',
      text: 'Inside an `unsafe` block, all the normal rules still apply. It only unlocks five extra abilities: 1. dereference a **raw pointer**, 2. call an **unsafe function**, 3. access or modify a **mutable static**, 4. implement an **unsafe trait**, 5. read fields of a **union**.',
    },
    { type: 'h2', text: 'Raw pointers' },
    {
      type: 'p',
      text: 'Raw pointers (`*const T` and `*mut T`) are like C pointers: they can be null, dangle, or alias. **Creating** one is safe. **Dereferencing** one is what requires `unsafe`.',
    },
    {
      type: 'code',
      runnable: true,
      code: `fn main() {
    let mut num = 5;

    let r1 = &raw const num; // *const i32
    let r2 = &raw mut num;   // *mut i32

    // SAFETY: both pointers come from a live local variable,
    // and nothing else accesses \`num\` while we use them.
    unsafe {
        *r2 += 1;
        println!("r1 points to {}", *r1);
    }
}`,
      output: 'r1 points to 6',
    },
    { type: 'h2', text: 'Safe abstractions over unsafe code' },
    {
      type: 'p',
      text: 'The goal is never "write lots of unsafe code". It is to wrap a **small, carefully checked** unsafe block inside a **safe** API. The standard library does this everywhere. Here is a simplified version of `split_at_mut`, which the borrow checker cannot express with safe code because it returns two mutable borrows of one slice:',
    },
    {
      type: 'code',
      runnable: true,
      code: `use std::slice;

fn split_at_mut(values: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
    let len = values.len();
    let ptr = values.as_mut_ptr();

    assert!(mid <= len, "mid out of bounds");

    // SAFETY: \`mid <= len\` was checked above, so both halves are in bounds,
    // and the two ranges do not overlap, so the mutable borrows never alias.
    unsafe {
        (
            slice::from_raw_parts_mut(ptr, mid),
            slice::from_raw_parts_mut(ptr.add(mid), len - mid),
        )
    }
}

fn main() {
    let mut v = vec![1, 2, 3, 4, 5, 6];
    let (left, right) = split_at_mut(&mut v, 3);
    left[0] = 100;
    right[0] = 400;
    println!("{:?}", v);
}`,
      output: '[100, 2, 3, 400, 5, 6]',
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Always write a SAFETY comment',
      text: 'By convention, every `unsafe` block gets a `// SAFETY:` comment explaining **why** the invariants hold. Reviewers check the reasoning, and `cargo clippy` can require these comments.',
    },
    { type: 'h2', text: 'Calling C: FFI' },
    {
      type: 'p',
      text: 'The **Foreign Function Interface** lets Rust call functions written in other languages. Declare them in an `unsafe extern "C"` block. Calling them is unsafe, because the compiler cannot verify code it cannot see.',
    },
    {
      type: 'code',
      runnable: true,
      code: `unsafe extern "C" {
    fn abs(input: i32) -> i32; // from the C standard library
}

fn main() {
    // SAFETY: \`abs\` is defined for every i32 except i32::MIN.
    let result = unsafe { abs(-3) };
    println!("abs(-3) = {result}");
}`,
      output: 'abs(-3) = 3',
    },
    {
      type: 'p',
      text: 'Going the other way, you can expose Rust functions to C. `no_mangle` keeps the function name unchanged in the compiled library:',
    },
    {
      type: 'code',
      title: 'src/lib.rs (built as a cdylib)',
      code: `#[unsafe(no_mangle)]
pub extern "C" fn add_numbers(a: i32, b: i32) -> i32 {
    a + b
}`,
    },
    {
      type: 'callout',
      variant: 'note',
      title: 'Tools that generate FFI glue for you',
      text: '`bindgen` generates Rust declarations from C headers. `cxx` gives safe C++ interop. `PyO3` builds Python extensions, `napi-rs` builds Node.js addons, and `wasm-bindgen` connects Rust to JavaScript in the browser.',
    },
    { type: 'h2', text: 'Using unsafe responsibly' },
    {
      type: 'list',
      items: [
        'Keep unsafe blocks **as small as possible** and wrap them in safe functions.',
        'Document every assumption in a `// SAFETY:` comment.',
        'Prefer safe alternatives: `AtomicU32` or `Mutex` instead of `static mut`, slices instead of pointer arithmetic.',
        'Run tests under **Miri** (`cargo +nightly miri test`), which detects undefined behavior in unsafe code.',
        'Remember that a bug in unsafe code can cause crashes anywhere in the program, not just inside the block.',
      ],
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Call the C function `strlen` via FFI. Declare it as `fn strlen(s: *const std::ffi::c_char) -> usize;`, create a C string with `c"hello"`, and pass `.as_ptr()`. Then wrap it in a safe `fn c_len(s: &std::ffi::CStr) -> usize`.',
    },
    {
      type: 'quiz',
      question: 'Which of these requires an `unsafe` block?',
      options: [
        'Creating a raw pointer with `&raw const x`',
        'Dereferencing a raw pointer',
        'Using `Rc<RefCell<T>>`',
        'Spawning a thread',
      ],
      answer: 1,
      explanation: 'Creating raw pointers is safe; they are just numbers. **Dereferencing** them is what can cause undefined behavior, so that requires `unsafe`.',
    },
    {
      type: 'callout',
      variant: 'note',
      title: '🦀 You finished the course!',
      text: 'You have gone from `println!` to unsafe code. Next steps: read **The Rust Programming Language** book, work through **Rustlings** exercises, try **Advent of Code** in Rust, and build something real, such as a CLI tool with `clap` or a web API with `axum`.',
    },
  ],
}
