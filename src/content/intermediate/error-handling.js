export default {
  slug: 'error-handling',
  level: 'intermediate',
  title: 'Error Handling',
  summary: 'Recoverable errors with Result, the ? operator, custom error types, and when to panic.',
  sections: [
    {
      type: 'p',
      text: 'Rust has no exceptions. Instead it splits errors into two kinds:',
    },
    {
      type: 'list',
      items: [
        '**Unrecoverable**: a bug, such as an out-of-bounds index. The program calls `panic!` and stops.',
        '**Recoverable**: something that can reasonably go wrong, such as a missing file or bad user input. The function returns a `Result`, and the caller decides what to do.',
      ],
    },
    { type: 'h2', text: 'Result<T, E>' },
    {
      type: 'code',
      code: `enum Result<T, E> {
    Ok(T),  // success, holding a value of type T
    Err(E), // failure, holding an error of type E
}`,
    },
    {
      type: 'code',
      runnable: true,
      code: `fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err(String::from("cannot divide by zero"))
    } else {
        Ok(a / b)
    }
}

fn main() {
    for (a, b) in [(10.0, 2.0), (1.0, 0.0)] {
        match divide(a, b) {
            Ok(result) => println!("{a} / {b} = {result}"),
            Err(e) => println!("Error: {e}"),
        }
    }
}`,
      output: `10 / 2 = 5
Error: cannot divide by zero`,
    },
    { type: 'h2', text: 'The ? operator' },
    {
      type: 'p',
      text: 'Writing a `match` for every call gets tedious. Put `?` after a `Result`: if it is `Ok`, you get the value; if it is `Err`, the function **returns that error immediately**. It works on `Option` too, returning `None` early.',
    },
    {
      type: 'code',
      runnable: true,
      code: `use std::num::ParseIntError;

fn sum_strings(a: &str, b: &str) -> Result<i32, ParseIntError> {
    let x: i32 = a.trim().parse()?; // returns early with the error on failure
    let y: i32 = b.trim().parse()?;
    Ok(x + y)
}

fn main() {
    println!("{:?}", sum_strings("20", " 22 "));
    println!("{:?}", sum_strings("20", "abc"));
}`,
      output: `Ok(42)
Err(ParseIntError { kind: InvalidDigit })`,
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'main can return a Result too',
      text: 'Declare `fn main() -> Result<(), Box<dyn std::error::Error>>` and you can use `?` directly inside `main`. `Box<dyn Error>` means "any kind of error", which is convenient for applications.',
    },
    { type: 'h2', text: 'Custom error types' },
    {
      type: 'p',
      text: 'Libraries usually define an enum of everything that can go wrong. Implementing `Display` gives a readable message, and implementing `From` lets `?` convert other errors into yours automatically.',
    },
    {
      type: 'code',
      runnable: true,
      code: `use std::fmt;
use std::num::ParseIntError;

#[derive(Debug)]
enum AgeError {
    NotANumber(ParseIntError),
    TooOld(u32),
}

impl fmt::Display for AgeError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AgeError::NotANumber(e) => write!(f, "not a number ({e})"),
            AgeError::TooOld(age) => write!(f, "{age} is not a realistic age"),
        }
    }
}

impl std::error::Error for AgeError {}

impl From<ParseIntError> for AgeError {
    fn from(e: ParseIntError) -> Self {
        AgeError::NotANumber(e)
    }
}

fn parse_age(input: &str) -> Result<u32, AgeError> {
    let age: u32 = input.parse()?; // ParseIntError becomes AgeError via From
    if age > 150 {
        return Err(AgeError::TooOld(age));
    }
    Ok(age)
}

fn main() {
    for input in ["36", "abc", "200"] {
        match parse_age(input) {
            Ok(age) => println!("Valid age: {age}"),
            Err(e) => println!("Invalid input '{input}': {e}"),
        }
    }
}`,
      output: `Valid age: 36
Invalid input 'abc': not a number (invalid digit found in string)
Invalid input '200': 200 is not a realistic age`,
    },
    {
      type: 'callout',
      variant: 'note',
      title: 'Crates that remove the boilerplate',
      text: 'In real projects, the `thiserror` crate generates `Display` and `From` for library error enums, and `anyhow` gives applications an easy catch-all error type with context messages.',
    },
    { type: 'h2', text: 'When to panic' },
    {
      type: 'list',
      items: [
        'Use `panic!`, `unwrap()`, or `expect("reason")` in examples, prototypes, and tests.',
        'Use them when a failure would mean a **bug in your own code**, something that should be impossible.',
        'Return a `Result` whenever failure depends on the outside world: files, networks, or user input.',
      ],
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Write `fn average(nums: &[&str]) -> Result<f64, String>` that parses every string as `f64` and returns an error if the list is empty or any item fails to parse.',
    },
    {
      type: 'quiz',
      question: 'What does `?` do when applied to an `Err` value?',
      options: [
        'Panics with the error message',
        'Ignores the error and continues',
        'Returns the error from the current function',
        'Converts it into `None`',
      ],
      answer: 2,
      explanation: '`?` **propagates** the error: it returns early from the enclosing function, converting the error with `From` if needed. The function must itself return a `Result` (or `Option`).',
    },
  ],
}
