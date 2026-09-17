export default {
  slug: 'data-types',
  level: 'beginner',
  title: 'Data Types',
  summary: 'Integers, floats, booleans, characters, tuples, and arrays: the building blocks of every Rust program.',
  sections: [
    {
      type: 'p',
      text: 'Rust is **statically typed**: every value has a type that the compiler knows before the program runs. Types come in two families: **scalar** (a single value) and **compound** (a group of values).',
    },
    { type: 'h2', text: 'Integers' },
    {
      type: 'p',
      text: 'Integer types are named by whether they can be negative and how many bits they use. `i` means signed (can be negative); `u` means unsigned (zero or positive).',
    },
    {
      type: 'list',
      items: [
        '`i8`, `i16`, `i32`, `i64`, `i128`: signed. `i32` is the default.',
        '`u8`, `u16`, `u32`, `u64`, `u128`: unsigned. `u8` holds 0 to 255.',
        '`isize` / `usize`: sized to your machine (64 bits on most computers). Used for indexing collections.',
      ],
    },
    {
      type: 'code',
      runnable: true,
      code: `fn main() {
    let year: u16 = 2026;
    let temperature: i8 = -12;
    let population = 8_100_000_000_u64; // underscores improve readability
    println!("{year} {temperature} {population}");
}`,
      output: '2026 -12 8100000000',
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'Integer overflow',
      text: 'Putting `256` into a `u8` is a compile error if Rust can see it. At runtime, overflow **panics** in debug builds and wraps around in release builds. Use methods like `checked_add` or `saturating_add` when overflow is possible.',
    },
    { type: 'h2', text: 'Floats, booleans, and characters' },
    {
      type: 'code',
      runnable: true,
      code: `fn main() {
    let pi: f64 = 3.14159;    // f64 is the default float
    let is_rusty: bool = true;
    let crab: char = '🦀';   // char is a Unicode scalar, in single quotes

    println!("{pi} {is_rusty} {crab}");
    println!("10 / 3 = {}", 10 / 3);       // integer division
    println!("10.0 / 3.0 = {}", 10.0 / 3.0);
}`,
      output: `3.14159 true 🦀
10 / 3 = 3
10.0 / 3.0 = 3.3333333333333335`,
    },
    { type: 'h2', text: 'Tuples' },
    {
      type: 'p',
      text: 'A **tuple** groups a fixed number of values that can have **different** types. Pull values out by destructuring, or with a dot and an index.',
    },
    {
      type: 'code',
      runnable: true,
      code: `fn main() {
    let person: (&str, u32, bool) = ("Ada", 36, true);

    let (name, age, _) = person; // destructure; _ ignores a value
    println!("{name} is {age}");
    println!("Active? {}", person.2);
}`,
      output: `Ada is 36
Active? true`,
    },
    { type: 'h2', text: 'Arrays' },
    {
      type: 'p',
      text: 'An **array** holds a fixed number of values of the **same** type. Its length is part of its type: `[i32; 5]` means "five `i32`s". If you need a list that can grow, use `Vec`, covered in the Collections lesson.',
    },
    {
      type: 'code',
      runnable: true,
      code: `fn main() {
    let days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    let zeros = [0; 4]; // [0, 0, 0, 0]

    println!("First day: {}", days[0]);
    println!("Length: {}", days.len());
    println!("Zeros: {:?}", zeros); // {:?} is "debug" formatting
}`,
      output: `First day: Mon
Length: 5
Zeros: [0, 0, 0, 0]`,
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Out-of-bounds access is caught',
      text: 'Reading `days[10]` does not return garbage memory like it might in C. Rust checks the index and **panics** with a clear message instead.',
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Create a tuple holding a city name, its population as `u32`, and whether it is a capital. Print each part using destructuring.',
    },
    {
      type: 'quiz',
      question: 'What is the type of `[1.5, 2.5, 3.5]`?',
      options: ['`Vec<f64>`', '`[f64; 3]`', '`(f64, f64, f64)`', '`[f32]`'],
      answer: 1,
      explanation: 'Square brackets create an **array**. Float literals default to `f64`, and there are 3 elements, so the type is `[f64; 3]`.',
    },
  ],
}
