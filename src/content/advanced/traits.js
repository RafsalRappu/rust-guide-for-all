export default {
  slug: 'traits',
  level: 'advanced',
  title: 'Traits',
  summary: 'Defining shared behavior, trait bounds, static vs dynamic dispatch, and implementing standard traits.',
  sections: [
    {
      type: 'p',
      text: 'A **trait** describes behavior that types can share, similar to an interface in Java, C#, or TypeScript. Any type can implement a trait by providing its methods. A trait can also include **default** implementations.',
    },
    {
      type: 'code',
      runnable: true,
      code: `trait Summary {
    fn author(&self) -> String;

    // default implementation, which types may override
    fn summarize(&self) -> String {
        format!("(Read more from {}...)", self.author())
    }
}

struct Article {
    title: String,
    author: String,
}

struct Post {
    username: String,
}

impl Summary for Article {
    fn author(&self) -> String {
        self.author.clone()
    }
    fn summarize(&self) -> String {
        format!("{}, by {}", self.title, self.author)
    }
}

impl Summary for Post {
    fn author(&self) -> String {
        format!("@{}", self.username)
    }
    // uses the default summarize()
}

fn notify(item: &impl Summary) {
    println!("Breaking news! {}", item.summarize());
}

fn main() {
    let article = Article {
        title: String::from("Rust ships a new edition"),
        author: String::from("Ferris"),
    };
    let post = Post { username: String::from("rustlang") };

    notify(&article);
    notify(&post);
}`,
      output: `Breaking news! Rust ships a new edition, by Ferris
Breaking news! (Read more from @rustlang...)`,
    },
    { type: 'h2', text: 'Three ways to write a trait bound' },
    {
      type: 'code',
      code: `// 1. impl Trait: shortest, great for simple cases
fn notify(item: &impl Summary) { /* ... */ }

// 2. Generic with a bound: needed when two params must be the SAME type
fn notify_both<T: Summary>(a: &T, b: &T) { /* ... */ }

// 3. where clause: best for several bounds
fn report<T>(item: &T) where T: Summary + std::fmt::Display { /* ... */ }

// impl Trait also works in return position
fn make_summary() -> impl Summary {
    Post { username: String::from("crab") }
}`,
    },
    { type: 'h2', text: 'Trait objects: dyn Trait' },
    {
      type: 'p',
      text: 'Generics require one concrete type per use. To keep **different** types in the same collection, use a **trait object** such as `Box<dyn Animal>`. The method to call is looked up at runtime (dynamic dispatch), which is slightly slower but far more flexible.',
    },
    {
      type: 'code',
      runnable: true,
      code: `trait Animal {
    fn name(&self) -> &str;
    fn speak(&self) -> String;
}

struct Dog;
struct Crab { claws: u8 }

impl Animal for Dog {
    fn name(&self) -> &str { "Dog" }
    fn speak(&self) -> String { String::from("Woof!") }
}

impl Animal for Crab {
    fn name(&self) -> &str { "Crab" }
    fn speak(&self) -> String { "Click! ".repeat(self.claws as usize) }
}

fn main() {
    let zoo: Vec<Box<dyn Animal>> = vec![Box::new(Dog), Box::new(Crab { claws: 2 })];
    for animal in &zoo {
        println!("{} says {}", animal.name(), animal.speak().trim_end());
    }
}`,
      output: `Dog says Woof!
Crab says Click! Click!`,
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Static or dynamic dispatch?',
      text: 'Prefer generics / `impl Trait` (static dispatch, zero-cost) by default. Reach for `dyn Trait` when you need a mixed collection, a plugin system, or want to cut compile times and binary size.',
    },
    { type: 'h2', text: 'Implementing standard traits' },
    {
      type: 'p',
      text: 'Much of Rust\'s power comes from implementing standard-library traits. Some can be **derived** automatically. Others, like `Display` and the operator traits, you write yourself:',
    },
    {
      type: 'code',
      runnable: true,
      code: `use std::fmt;
use std::ops::Add;

#[derive(Debug, Clone, Copy, PartialEq)]
struct Vec2 {
    x: f64,
    y: f64,
}

impl Add for Vec2 {
    type Output = Vec2;
    fn add(self, other: Vec2) -> Vec2 {
        Vec2 { x: self.x + other.x, y: self.y + other.y }
    }
}

impl fmt::Display for Vec2 {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

fn main() {
    let a = Vec2 { x: 1.0, y: 2.0 };
    let b = Vec2 { x: 0.5, y: -1.0 };
    let c = a + b; // uses our Add impl

    println!("{a} + {b} = {c}");          // Display
    println!("{:?}", c);                  // Debug (derived)
    println!("{}", c == Vec2 { x: 1.5, y: 1.0 }); // PartialEq (derived)
}`,
      output: `(1, 2) + (0.5, -1) = (1.5, 1)
Vec2 { x: 1.5, y: 1.0 }
true`,
    },
    {
      type: 'list',
      items: [
        '`Debug`, `Clone`, `Copy`, `PartialEq`, `Eq`, `Hash`, `PartialOrd`, `Ord`, `Default`: usually derived.',
        '`Display`: human-readable formatting with `{}`.',
        '`From` / `Into`: conversions between types.',
        '`Iterator`: makes your type usable in `for` loops and with iterator adapters.',
        '`Add`, `Sub`, `Mul`, `Index`, ...: operator overloading.',
      ],
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'The orphan rule',
      text: 'You may implement a trait for a type only if **the trait or the type** is defined in your crate. You can implement `Display` for your `Vec2`, or your `Summary` for `String`, but not `Display` for `Vec<i32>`. This keeps different crates from conflicting.',
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Define `trait Area { fn area(&self) -> f64; }`, implement it for `Circle` and `Square`, then compute the total area of a `Vec<Box<dyn Area>>`.',
    },
    {
      type: 'quiz',
      question: 'When do you need `Box<dyn Trait>` instead of a generic `T: Trait`?',
      options: [
        'Whenever a function takes a trait',
        'When storing values of different concrete types together',
        'When the trait has default methods',
        'Never; they are equivalent',
      ],
      answer: 1,
      explanation: 'A `Vec<T>` holds one concrete type. To hold a `Dog` and a `Crab` in the same `Vec`, you need trait objects, which use dynamic dispatch at runtime.',
    },
  ],
}
