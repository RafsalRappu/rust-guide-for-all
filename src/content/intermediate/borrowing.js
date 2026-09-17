export default {
  slug: 'borrowing',
  level: 'intermediate',
  title: 'References & Borrowing',
  summary: 'Using values without taking ownership, the borrowing rules, and slices.',
  sections: [
    {
      type: 'p',
      text: 'A **reference** lets you refer to a value without owning it. Creating a reference is called **borrowing**: you borrow the value, use it, and the owner keeps it. References are written with `&`.',
    },
    {
      type: 'code',
      runnable: true,
      code: `fn calculate_length(s: &String) -> usize {
    s.len()
} // s goes out of scope, but it doesn't own the String, so nothing is dropped

fn main() {
    let text = String::from("hello");
    let len = calculate_length(&text);
    println!("'{text}' has length {len}"); // text is still valid!
}`,
      output: "'hello' has length 5",
    },
    { type: 'h2', text: 'Mutable references' },
    {
      type: 'p',
      text: 'References are immutable by default. To let a function modify a borrowed value, both the variable and the reference must be `mut`:',
    },
    {
      type: 'code',
      runnable: true,
      code: `fn add_exclamation(s: &mut String) {
    s.push_str("!");
}

fn main() {
    let mut greeting = String::from("hello");
    add_exclamation(&mut greeting);
    println!("{greeting}");
}`,
      output: 'hello!',
    },
    { type: 'h2', text: 'The borrowing rules' },
    {
      type: 'callout',
      variant: 'note',
      title: 'At any given time, you can have EITHER:',
      text: '**Any number of immutable references** (`&T`), **or exactly one mutable reference** (`&mut T`). Never both at once. And references must always be **valid**: they can never outlive the value they point to.',
    },
    {
      type: 'p',
      text: 'This rule prevents **data races** at compile time: two pieces of code can never change the same data at the same time, and nobody can read data while it is being changed.',
    },
    {
      type: 'code',
      title: 'Does not compile',
      runnable: true,
      code: `fn main() {
    let mut s = String::from("hello");
    let r1 = &s;
    let r2 = &mut s; // error[E0502]: cannot borrow \`s\` as mutable because it is also borrowed as immutable
    println!("{r1}, {r2}");
}`,
    },
    {
      type: 'p',
      text: 'A borrow lasts only until the reference is **last used**, not until the end of the block. So this version compiles fine:',
    },
    {
      type: 'code',
      runnable: true,
      code: `fn main() {
    let mut s = String::from("hello");

    let r1 = &s;
    let r2 = &s;
    println!("{r1} and {r2}"); // r1 and r2 are not used after this

    let r3 = &mut s; // OK: no immutable borrows are still alive
    r3.push_str(", world");
    println!("{r3}");
}`,
      output: `hello and hello
hello, world`,
    },
    { type: 'h2', text: 'No dangling references' },
    {
      type: 'p',
      text: 'In C you can return a pointer to memory that has already been freed. Rust refuses:',
    },
    {
      type: 'code',
      title: 'Does not compile',
      code: `fn dangle() -> &String {  // error[E0106]: missing lifetime specifier
    let s = String::from("oops");
    &s
} // s is dropped here, so the reference would point at freed memory`,
    },
    {
      type: 'p',
      text: 'The fix is to return the `String` itself, moving ownership to the caller.',
    },
    { type: 'h2', text: 'Slices' },
    {
      type: 'p',
      text: 'A **slice** is a reference to part of a collection. `&str` is a string slice, and `&[T]` is a slice of an array or vector. Accepting `&str` instead of `&String` makes your functions work with both string literals and `String`s.',
    },
    {
      type: 'code',
      runnable: true,
      code: `fn first_word(s: &str) -> &str {
    match s.find(' ') {
        Some(i) => &s[..i],
        None => s,
    }
}

fn main() {
    let sentence = String::from("hello wonderful world");
    println!("First word: {}", first_word(&sentence));
    println!("First word: {}", first_word("rust is fun"));

    let numbers = [10, 20, 30, 40, 50];
    let middle: &[i32] = &numbers[1..4];
    println!("Middle: {:?}", middle);
}`,
      output: `First word: hello
First word: rust
Middle: [20, 30, 40]`,
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Write `fn largest(numbers: &[i32]) -> i32` that returns the biggest number in a slice, then call it with both an array and a `Vec`.',
    },
    {
      type: 'quiz',
      question: 'Which set of borrows can exist at the same time for one value?',
      options: [
        'Two `&mut` references',
        'One `&` and one `&mut`',
        'Three `&` references',
        'Any mix, as long as you are careful',
      ],
      answer: 2,
      explanation: 'You may have **many immutable** references **or one mutable** reference, never both. Three `&` borrows is perfectly fine.',
    },
  ],
}
