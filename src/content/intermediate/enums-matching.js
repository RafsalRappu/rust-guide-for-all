export default {
  slug: 'enums-matching',
  level: 'intermediate',
  title: 'Enums & Pattern Matching',
  summary: 'Types that can be one of several variants, Option instead of null, and the match expression.',
  sections: [
    {
      type: 'p',
      text: 'A struct says "this AND that". An **enum** says "this OR that". Each possible value is a **variant**, and unlike enums in many languages, Rust variants can carry their own data.',
    },
    {
      type: 'code',
      runnable: true,
      code: `#[derive(Debug)]
enum Shape {
    Circle { radius: f64 },
    Rectangle { width: f64, height: f64 },
    Triangle(f64, f64), // base, height
}

fn area(shape: &Shape) -> f64 {
    match shape {
        Shape::Circle { radius } => 3.14159 * radius * radius,
        Shape::Rectangle { width, height } => width * height,
        Shape::Triangle(base, height) => 0.5 * base * height,
    }
}

fn main() {
    let shapes = [
        Shape::Circle { radius: 1.0 },
        Shape::Rectangle { width: 3.0, height: 4.0 },
        Shape::Triangle(6.0, 2.0),
    ];
    for s in &shapes {
        println!("{:?} has area {:.2}", s, area(s));
    }
}`,
      output: `Circle { radius: 1.0 } has area 3.14
Rectangle { width: 3.0, height: 4.0 } has area 12.00
Triangle(6.0, 2.0) has area 6.00`,
    },
    { type: 'h2', text: 'match must be exhaustive' },
    {
      type: 'p',
      text: 'A `match` compares a value against **patterns** and runs the first arm that fits. The compiler checks that you handled **every** possible case. Add a new variant to `Shape` and every `match` that forgot it becomes a compile error, which is exactly what you want when refactoring.',
    },
    {
      type: 'code',
      runnable: true,
      code: `fn describe(n: i32) -> &'static str {
    match n {
        0 => "zero",
        1 | 2 | 3 => "small",
        4..=9 => "medium",
        x if x < 0 => "negative",
        _ => "large", // _ matches anything else
    }
}

fn main() {
    for n in [0, 2, 7, -5, 100] {
        println!("{n}: {}", describe(n));
    }
}`,
      output: `0: zero
2: small
7: medium
-5: negative
100: large`,
    },
    { type: 'h2', text: 'Option: Rust has no null' },
    {
      type: 'p',
      text: 'Null references have been called the "billion-dollar mistake". Rust does not have null. A value that might be absent is wrapped in the `Option` enum from the standard library:',
    },
    {
      type: 'code',
      code: `enum Option<T> {
    Some(T), // there is a value
    None,    // there is no value
}`,
    },
    {
      type: 'p',
      text: 'An `Option<i32>` is a different type from `i32`, so you **cannot** accidentally use a maybe-missing value as if it were definitely there. The compiler makes you handle `None`.',
    },
    {
      type: 'code',
      runnable: true,
      code: `fn find_index(items: &[&str], target: &str) -> Option<usize> {
    for (i, item) in items.iter().enumerate() {
        if *item == target {
            return Some(i);
        }
    }
    None
}

fn main() {
    let pets = ["cat", "dog", "crab"];

    match find_index(&pets, "crab") {
        Some(i) => println!("Found crab at index {i}"),
        None => println!("No crab here"),
    }

    // if let: when you only care about one pattern
    if let Some(i) = find_index(&pets, "dog") {
        println!("Found dog at index {i}");
    }

    // helpful Option methods
    let missing = find_index(&pets, "owl");
    println!("owl index or default: {}", missing.unwrap_or(999));
    println!("is owl present? {}", missing.is_some());
}`,
      output: `Found crab at index 2
Found dog at index 1
owl index or default: 999
is owl present? false`,
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'Be careful with unwrap()',
      text: '`.unwrap()` returns the value inside `Some`, but **panics** (crashes) on `None`. It is fine in quick experiments and tests. In real code, prefer `match`, `if let`, `unwrap_or`, or `?` (next-next lesson).',
    },
    { type: 'h2', text: 'let else' },
    {
      type: 'code',
      runnable: true,
      code: `fn parse_age(input: &str) -> u32 {
    let Ok(age) = input.parse::<u32>() else {
        println!("'{input}' is not a valid age, using 0");
        return 0;
    };
    age
}

fn main() {
    println!("{}", parse_age("42"));
    println!("{}", parse_age("forty-two"));
}`,
      output: `42
'forty-two' is not a valid age, using 0
0`,
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Create `enum TrafficLight { Red, Yellow, Green }` and a method `fn duration(&self) -> u32` that returns how many seconds each light lasts, using `match`.',
    },
    {
      type: 'quiz',
      question: 'What happens if a `match` on an enum does not handle one of its variants?',
      options: [
        'That variant silently does nothing',
        'It panics at runtime when that variant appears',
        'The program does not compile',
        'Rust falls through to the next arm',
      ],
      answer: 2,
      explanation: '`match` must be **exhaustive**. Missing a variant produces error E0004 "non-exhaustive patterns", listing exactly which cases you forgot.',
    },
  ],
}
