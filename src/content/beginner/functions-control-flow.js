export default {
  slug: 'functions-control-flow',
  level: 'beginner',
  title: 'Functions & Control Flow',
  summary: 'Writing functions, the difference between statements and expressions, and if, loop, while, and for.',
  sections: [
    { type: 'h2', text: 'Functions' },
    {
      type: 'p',
      text: 'Functions are declared with `fn`. Function and variable names use `snake_case`. Every parameter **must** have a type, and a return type is written after `->`.',
    },
    {
      type: 'code',
      runnable: true,
      code: `fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn greet(name: &str) {
    println!("Hello, {name}!");
}

fn main() {
    greet("Rustacean");
    let total = add(2, 3);
    println!("2 + 3 = {total}");
}`,
      output: `Hello, Rustacean!
2 + 3 = 5`,
    },
    { type: 'h2', text: 'Expressions vs statements' },
    {
      type: 'p',
      text: 'Notice `add` has no `return` keyword and `a + b` has **no semicolon**. In Rust, almost everything is an **expression** that produces a value. The last expression in a block is the value of that block.',
    },
    {
      type: 'list',
      items: [
        '`a + b` is an **expression**: it produces a value.',
        '`a + b;` is a **statement**: the semicolon throws the value away and produces `()`, the empty "unit" value.',
      ],
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'The classic mistake',
      text: 'Adding a semicolon to the last line (`a + b;`) turns the function\'s result into `()`, and you get error E0308 "mismatched types". The compiler even suggests removing the semicolon.',
    },
    {
      type: 'p',
      text: 'You can still use `return` for early exits. Blocks being expressions also means you can compute a value inline:',
    },
    {
      type: 'code',
      runnable: true,
      code: `fn main() {
    let y = {
        let x = 3;
        x * x + 1 // no semicolon: this is the block's value
    };
    println!("y = {y}");
}`,
      output: 'y = 10',
    },
    { type: 'h2', text: 'if is an expression too' },
    {
      type: 'p',
      text: 'The condition must be a `bool`. Rust does not treat numbers as "truthy". Because `if` is an expression, you can assign its result directly:',
    },
    {
      type: 'code',
      runnable: true,
      code: `fn main() {
    let temperature = 28;

    if temperature > 30 {
        println!("Hot");
    } else if temperature > 20 {
        println!("Warm");
    } else {
        println!("Cool");
    }

    let label = if temperature % 2 == 0 { "even" } else { "odd" };
    println!("{temperature} is {label}");
}`,
      output: `Warm
28 is even`,
    },
    { type: 'h2', text: 'Loops' },
    {
      type: 'p',
      text: 'Rust has three loops. `loop` repeats forever until you `break`, and can even return a value. `while` runs while a condition is true. `for` iterates over anything iterable, and is what you will use most.',
    },
    {
      type: 'code',
      runnable: true,
      code: `fn main() {
    // loop with a value
    let mut counter = 0;
    let result = loop {
        counter += 1;
        if counter == 10 {
            break counter * 2;
        }
    };
    println!("loop result: {result}");

    // while
    let mut n = 3;
    while n > 0 {
        println!("{n}...");
        n -= 1;
    }
    println!("Liftoff!");

    // for over a range (1..=3 includes 3; 1..3 would not)
    for i in 1..=3 {
        println!("for: {i}");
    }

    // for over an array
    for fruit in ["apple", "banana"] {
        println!("I like {fruit}");
    }
}`,
      output: `loop result: 20
3...
2...
1...
Liftoff!
for: 1
for: 2
for: 3
I like apple
I like banana`,
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Write `fn is_prime(n: u32) -> bool` using a `for` loop over `2..n`, then print every prime from 1 to 30. (Hint: 0 and 1 are not prime.)',
    },
    {
      type: 'quiz',
      question: 'What does this function return?\n`fn f() -> i32 { let x = 5; x + 1; }`',
      options: ['`6`', '`5`', 'It does not compile', '`0`'],
      answer: 2,
      explanation: 'The semicolon after `x + 1` makes it a statement, so the block evaluates to `()`. That does not match the declared return type `i32`, so the compiler rejects it.',
    },
  ],
}
