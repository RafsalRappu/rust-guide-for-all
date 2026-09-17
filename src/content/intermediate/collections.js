export default {
  slug: 'collections',
  level: 'intermediate',
  title: 'Collections: Vec, String & HashMap',
  summary: 'The three growable collections you will use in almost every Rust program.',
  sections: [
    {
      type: 'p',
      text: 'Arrays and tuples have a fixed size. The standard library\'s **collections** store their data on the heap, so they can grow and shrink while the program runs.',
    },
    { type: 'h2', text: 'Vec<T>: a growable list' },
    {
      type: 'code',
      runnable: true,
      code: `fn main() {
    let mut scores: Vec<i32> = Vec::new();
    scores.push(90);
    scores.push(72);
    scores.push(85);

    let names = vec!["Ada", "Grace", "Linus"]; // vec! macro

    println!("First score: {}", scores[0]);          // panics if out of range
    println!("Tenth score: {:?}", scores.get(9));    // returns Option instead

    for s in &mut scores {
        *s += 5; // * dereferences to change the value in place
    }
    println!("Curved: {:?}", scores);

    scores.sort();
    println!("Sorted: {:?}, len {}", scores, scores.len());
    println!("Names: {}", names.join(", "));

    if let Some(last) = scores.pop() {
        println!("Popped {last}");
    }
}`,
      output: `First score: 90
Tenth score: None
Curved: [95, 77, 90]
Sorted: [77, 90, 95], len 3
Names: Ada, Grace, Linus
Popped 95`,
    },
    { type: 'h2', text: 'String vs &str' },
    {
      type: 'p',
      text: 'Rust has two main string types, and knowing which to use removes a lot of confusion:',
    },
    {
      type: 'list',
      items: [
        '`String`: owned, growable, heap-allocated text. Use it when you need to build or keep text.',
        '`&str`: a borrowed view into text (a "string slice"). String literals like `"hi"` are `&str`. Use it for function parameters.',
      ],
    },
    {
      type: 'code',
      runnable: true,
      code: `fn main() {
    let mut s = String::from("Hello");
    s.push(',');
    s.push_str(" world");

    let exclaim = s.clone() + "!";              // + takes ownership of the left side
    let formatted = format!("{s} / {exclaim}"); // format! never takes ownership
    println!("{formatted}");

    println!("Upper: {}", s.to_uppercase());
    println!("Contains 'world'? {}", s.contains("world"));
    println!("Replaced: {}", s.replace("world", "Rust"));

    for word in "the quick brown fox".split_whitespace() {
        print!("[{word}] ");
    }
    println!();

    let crab = "héllo🦀";
    println!("bytes: {}, chars: {}", crab.len(), crab.chars().count());
}`,
      output: `Hello, world / Hello, world!
Upper: HELLO, WORLD
Contains 'world'? true
Replaced: Hello, Rust
[the] [quick] [brown] [fox]
bytes: 10, chars: 6`,
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'You cannot index a String with s[0]',
      text: 'Rust strings are UTF-8, and a single character can take 1 to 4 bytes (`é` takes 2, `🦀` takes 4). So `s[0]` is not allowed. Use `s.chars()` to walk characters, or `s.chars().nth(0)` to get one.',
    },
    { type: 'h2', text: 'HashMap<K, V>: key-value lookup' },
    {
      type: 'code',
      runnable: true,
      code: `use std::collections::HashMap;

fn main() {
    let mut stock: HashMap<String, u32> = HashMap::new();
    stock.insert(String::from("apples"), 12);
    stock.insert(String::from("pears"), 4);

    match stock.get("apples") {
        Some(count) => println!("Apples in stock: {count}"),
        None => println!("No apples"),
    }

    // Count words with the entry API
    let text = "red blue red green blue red";
    let mut counts = HashMap::new();
    for word in text.split_whitespace() {
        *counts.entry(word).or_insert(0) += 1;
    }

    let mut sorted: Vec<_> = counts.into_iter().collect();
    sorted.sort_by(|a, b| b.1.cmp(&a.1)); // most frequent first
    println!("{:?}", sorted);
}`,
      output: `Apples in stock: 12
[("red", 3), ("blue", 2), ("green", 1)]`,
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'HashMap order is random',
      text: 'Iterating a `HashMap` gives entries in no particular order, and it can change between runs. That is why the example sorts before printing. Use `BTreeMap` when you need keys kept in sorted order.',
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Given `vec![3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]`, print the average, the median (sort a copy first), and the most common value (use a `HashMap`).',
    },
    {
      type: 'quiz',
      question: 'What is the best parameter type for a function that only reads some text?',
      options: ['`String`', '`&String`', '`&str`', '`Vec<char>`'],
      answer: 2,
      explanation: '`&str` accepts string literals **and** borrowed `String`s (via automatic deref), and does not take ownership. `String` would force callers to give up or clone their text.',
    },
  ],
}
