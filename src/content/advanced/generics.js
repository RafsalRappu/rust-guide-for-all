export default {
  slug: 'generics',
  level: 'advanced',
  title: 'Generics',
  summary: 'Writing one function or type that works for many types, with zero runtime cost.',
  sections: [
    {
      type: 'p',
      text: 'Suppose you write `largest_i32`, then need `largest_f64`, then `largest_char`. The logic is identical; only the type differs. **Generics** let you write it once, with a type parameter (conventionally `T`) standing in for the concrete type.',
    },
    {
      type: 'code',
      runnable: true,
      code: `fn largest<T: PartialOrd + Copy>(list: &[T]) -> T {
    let mut largest = list[0];
    for &item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}

fn main() {
    println!("{}", largest(&[34, 50, 25, 100, 65]));
    println!("{}", largest(&[1.5, 0.2, 9.9]));
    println!("{}", largest(&['r', 'u', 's', 't']));
}`,
      output: `100
9.9
u`,
    },
    {
      type: 'p',
      text: '`T: PartialOrd + Copy` is a **trait bound**. It says "T can be any type, as long as it can be compared with `>` and copied". Without the bound, the compiler would reject `item > largest`, because not every type can be compared. You will learn traits properly in the next lesson.',
    },
    { type: 'h2', text: 'Generic structs and enums' },
    {
      type: 'p',
      text: 'You have already used generic enums: `Option<T>` and `Result<T, E>`. Your own types can be generic the same way, and you can even add methods only for specific concrete types:',
    },
    {
      type: 'code',
      runnable: true,
      code: `#[derive(Debug)]
struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}

// Only available when T is f64
impl Point<f64> {
    fn distance_from_origin(&self) -> f64 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}

fn main() {
    let float_point = Point { x: 3.0, y: 4.0 };
    let int_point = Point { x: 5, y: 10 };

    println!("x = {}, distance = {}", float_point.x(), float_point.distance_from_origin());
    println!("{:?} has x = {}", int_point, int_point.x());
    // int_point.distance_from_origin(); // error: method not found for Point<{integer}>
}`,
      output: `x = 3, distance = 5
Point { x: 5, y: 10 } has x = 5`,
    },
    { type: 'h2', text: 'where clauses' },
    {
      type: 'p',
      text: 'When bounds get long, move them into a `where` clause so the signature stays readable:',
    },
    {
      type: 'code',
      code: `fn print_pair<A, B>(a: A, b: B)
where
    A: std::fmt::Display,
    B: std::fmt::Debug + Clone,
{
    println!("{a} and {:?}", b.clone());
}`,
    },
    { type: 'h2', text: 'Const generics' },
    {
      type: 'p',
      text: 'Type parameters can also be **values** known at compile time, most often array lengths:',
    },
    {
      type: 'code',
      runnable: true,
      code: `fn sum_array<const N: usize>(arr: [i32; N]) -> i32 {
    arr.iter().sum()
}

fn main() {
    println!("{}", sum_array([1, 2, 3]));
    println!("{}", sum_array([10, 20, 30, 40, 50]));
}`,
      output: `6
150`,
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Zero-cost: monomorphization',
      text: 'At compile time Rust generates a specialized copy of generic code for each concrete type you actually use (`largest::<i32>`, `largest::<f64>`, ...). This is called **monomorphization**. Generic code runs exactly as fast as hand-written code for each type. The trade-off is slightly longer compile times and larger binaries.',
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Write a generic `struct Pair<T> { a: T, b: T }` with a method `fn larger(&self) -> &T` that is only available when `T: PartialOrd`.',
    },
    {
      type: 'quiz',
      question: 'Why does `fn largest<T>(list: &[T]) -> T` fail to compile when it uses `>`?',
      options: [
        'Generic functions cannot use operators',
        'Nothing guarantees that `T` supports comparison',
        'Slices cannot be generic',
        'The return type must be `&T`',
      ],
      answer: 1,
      explanation: 'The compiler only lets you do what the bounds promise. Adding `T: PartialOrd` promises that `>` works, and `Copy` allows moving values out of the slice.',
    },
  ],
}
