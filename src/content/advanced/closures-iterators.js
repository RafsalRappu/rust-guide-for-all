export default {
  slug: 'closures-iterators',
  level: 'advanced',
  title: 'Closures & Iterators',
  summary: 'Anonymous functions that capture their environment, and the lazy iterator chains Rust code is famous for.',
  sections: [
    { type: 'h2', text: 'Closures' },
    {
      type: 'p',
      text: 'A **closure** is an anonymous function you can store in a variable or pass to another function. Parameters go between pipes `|...|`. Unlike `fn` items, closures can **capture** variables from the surrounding scope.',
    },
    {
      type: 'code',
      runnable: true,
      code: `fn main() {
    let bonus = 10;
    let add_bonus = |score: u32| score + bonus; // captures \`bonus\` by reference
    println!("{}", add_bonus(85));

    let mut count = 0;
    let mut increment = || count += 1; // captures \`count\` mutably
    increment();
    increment();
    println!("count = {count}");

    let name = String::from("Ferris");
    let consume = move || name; // \`move\` takes ownership of \`name\`
    let owned = consume();
    println!("got {owned}");
}`,
      output: `95
count = 2
got Ferris`,
    },
    {
      type: 'p',
      text: 'Depending on what a closure does with captured values, it implements one or more of three traits. Functions that accept closures use them as bounds:',
    },
    {
      type: 'list',
      items: [
        '`Fn`: only reads captured values. Can be called any number of times.',
        '`FnMut`: modifies captured values. Can be called many times, but needs `mut`.',
        '`FnOnce`: moves captured values out. Can be called only once.',
      ],
    },
    {
      type: 'code',
      runnable: true,
      code: `fn apply_twice<F: Fn(i32) -> i32>(f: F, value: i32) -> i32 {
    f(f(value))
}

fn make_multiplier(factor: i32) -> impl Fn(i32) -> i32 {
    move |x| x * factor
}

fn main() {
    println!("{}", apply_twice(|x| x + 3, 10));
    let triple = make_multiplier(3);
    println!("{}", apply_twice(&triple, 2));
}`,
      output: `16
18`,
    },
    { type: 'h2', text: 'Iterators' },
    {
      type: 'p',
      text: 'An **iterator** produces a sequence of values, one at a time. You build a pipeline with **adapters** like `map` and `filter`, then run it with a **consumer** like `collect`, `sum`, or a `for` loop.',
    },
    {
      type: 'code',
      runnable: true,
      code: `fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    let even_squares: Vec<i32> = numbers
        .iter()
        .filter(|&&n| n % 2 == 0)
        .map(|&n| n * n)
        .collect();
    println!("even squares: {:?}", even_squares);

    let total: i32 = numbers.iter().sum();
    println!("sum: {total}");
    println!("any > 9? {}", numbers.iter().any(|&n| n > 9));
    println!("first multiple of 4: {:?}", numbers.iter().find(|&&n| n % 4 == 0));

    let names = ["ada", "grace", "linus"];
    for (i, name) in names.iter().enumerate() {
        println!("{}. {}", i + 1, name.to_uppercase());
    }

    let lengths: Vec<(&str, usize)> = names.iter().map(|n| (*n, n.len())).collect();
    println!("{:?}", lengths);
}`,
      output: `even squares: [4, 16, 36, 64, 100]
sum: 55
any > 9? true
first multiple of 4: Some(4)
1. ADA
2. GRACE
3. LINUS
[("ada", 3), ("grace", 5), ("linus", 5)]`,
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Iterators are lazy and fast',
      text: 'Adapters like `map` and `filter` do nothing until a consumer pulls values through. The compiler optimizes these chains into tight loops, often matching a hand-written `for` loop. This is another zero-cost abstraction.',
    },
    { type: 'h2', text: 'iter, iter_mut, into_iter' },
    {
      type: 'list',
      items: [
        '`.iter()` yields `&T`: borrow each item.',
        '`.iter_mut()` yields `&mut T`: modify each item in place.',
        '`.into_iter()` yields `T`: consume the collection and take ownership of each item.',
      ],
    },
    { type: 'h2', text: 'Your own iterator' },
    {
      type: 'p',
      text: 'Implement the `Iterator` trait by defining `next`. Every adapter in the standard library then works on your type for free:',
    },
    {
      type: 'code',
      runnable: true,
      code: `struct Countdown {
    n: u32,
}

impl Iterator for Countdown {
    type Item = u32;

    fn next(&mut self) -> Option<u32> {
        if self.n == 0 {
            None
        } else {
            self.n -= 1;
            Some(self.n + 1)
        }
    }
}

fn main() {
    let all: Vec<u32> = Countdown { n: 5 }.collect();
    println!("{:?}", all);

    let odd_sum: u32 = Countdown { n: 5 }.filter(|n| n % 2 == 1).sum();
    println!("sum of odd values: {odd_sum}");
}`,
      output: `[5, 4, 3, 2, 1]
sum of odd values: 9`,
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Given `let words = vec!["apple", "bob", "kayak", "rust", "level"];`, use one iterator chain to collect every palindrome, uppercased, into a `Vec<String>`. (Hint: compare `w.chars().rev()` with `w.chars()` using `.eq()`.)',
    },
    {
      type: 'quiz',
      question: 'What does `vec![1, 2, 3].iter().map(|x| x * 2);` do on its own?',
      options: [
        'Returns `[2, 4, 6]`',
        'Doubles the vector in place',
        'Nothing: iterators are lazy until consumed',
        'Prints 2, 4, 6',
      ],
      answer: 2,
      explanation: '`map` only builds an adapter. No work happens until something consumes it, such as `.collect()`. The compiler even warns: "unused `Map` that must be used".',
    },
  ],
}
