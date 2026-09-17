export default {
  slug: 'structs',
  level: 'intermediate',
  title: 'Structs & Methods',
  summary: 'Grouping related data into your own types, and attaching behavior with impl blocks.',
  sections: [
    {
      type: 'p',
      text: 'A **struct** lets you name and group related values into a single type. Each piece of data is a **field** with its own name and type.',
    },
    {
      type: 'code',
      runnable: true,
      code: `struct User {
    username: String,
    email: String,
    active: bool,
    sign_in_count: u64,
}

fn main() {
    let mut user = User {
        username: String::from("ferris"),
        email: String::from("ferris@example.com"),
        active: true,
        sign_in_count: 1,
    };

    user.sign_in_count += 1; // the whole instance must be mut
    println!("{} ({}) has signed in {} times", user.username, user.email, user.sign_in_count);
    println!("Active: {}", user.active);
}`,
      output: `ferris (ferris@example.com) has signed in 2 times
Active: true`,
    },
    { type: 'h2', text: 'Handy shorthands' },
    {
      type: 'code',
      runnable: true,
      code: `#[derive(Debug)]
struct User {
    username: String,
    email: String,
    active: bool,
}

fn build_user(username: String, email: String) -> User {
    // field init shorthand: \`username\` instead of \`username: username\`
    User { username, email, active: true }
}

fn main() {
    let u1 = build_user(String::from("ada"), String::from("ada@example.com"));

    // struct update syntax: copy the remaining fields from u1
    let u2 = User { email: String::from("grace@example.com"), ..u1 };

    println!("{:#?}", u2);
}`,
      output: `User {
    username: "ada",
    email: "grace@example.com",
    active: true,
}`,
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'What is #[derive(Debug)]?',
      text: 'Structs cannot be printed with `{}` by default. `#[derive(Debug)]` asks the compiler to generate debug printing, so you can use `{:?}` (compact) or `{:#?}` (pretty). Note that `..u1` moved `username` out of `u1`, so `u1` cannot be used as a whole afterwards.',
    },
    { type: 'h2', text: 'Tuple structs and unit structs' },
    {
      type: 'code',
      code: `struct Color(u8, u8, u8);   // tuple struct: fields have no names
struct Meters(f64);         // "newtype": gives meaning to a plain number
struct AlwaysEqual;         // unit struct: no fields at all

let black = Color(0, 0, 0);
let distance = Meters(42.0);
println!("{}", black.0);`,
    },
    { type: 'h2', text: 'Methods with impl' },
    {
      type: 'p',
      text: '**Methods** are functions attached to a type, defined inside an `impl` block. Their first parameter is `self`, which is the instance the method is called on.',
    },
    {
      type: 'list',
      items: [
        '`&self`: borrow the instance to read it (most common).',
        '`&mut self`: borrow the instance to modify it.',
        '`self`: take ownership, usually to transform the instance into something else.',
        'No `self` at all: an **associated function**, called with `Type::name()`. `new` is the conventional constructor.',
      ],
    },
    {
      type: 'code',
      runnable: true,
      code: `#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn new(width: u32, height: u32) -> Self {
        Self { width, height }
    }

    fn square(size: u32) -> Self {
        Self { width: size, height: size }
    }

    fn area(&self) -> u32 {
        self.width * self.height
    }

    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }

    fn scale(&mut self, factor: u32) {
        self.width *= factor;
        self.height *= factor;
    }
}

fn main() {
    let mut big = Rectangle::new(30, 50);
    let small = Rectangle::square(10);

    println!("Area: {}", big.area());
    println!("Can hold small? {}", big.can_hold(&small));

    big.scale(2);
    println!("Scaled: {:?}", big);
}`,
      output: `Area: 1500
Can hold small? true
Scaled: Rectangle { width: 60, height: 100 }`,
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Add a `perimeter(&self) -> u32` method and an `is_square(&self) -> bool` method to `Rectangle`, then call both from `main`.',
    },
    {
      type: 'quiz',
      question: 'Which method signature lets you change a field of the struct?',
      options: ['`fn grow(self)`', '`fn grow(&self)`', '`fn grow(&mut self)`', '`fn grow()`'],
      answer: 2,
      explanation: '`&mut self` borrows the instance mutably. `self` would also allow changes, but it consumes the instance, so the caller could not use it afterwards.',
    },
  ],
}
