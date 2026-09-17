export default {
  slug: 'variables',
  level: 'beginner',
  title: 'Variables & Mutability',
  summary: 'Declaring values with let, why variables are immutable by default, shadowing, and constants.',
  sections: [
    {
      type: 'p',
      text: 'You create a variable with `let`. Rust usually **infers** the type from the value, so you rarely need to write it yourself.',
    },
    {
      type: 'code',
      runnable: true,
      code: `fn main() {
    let apples = 5;
    println!("I have {apples} apples");
}`,
      output: 'I have 5 apples',
    },
    { type: 'h2', text: 'Immutable by default' },
    {
      type: 'p',
      text: 'Here is the first surprise for most newcomers: once a variable has a value, **you cannot change it**. This code does not compile:',
    },
    {
      type: 'code',
      title: 'Does not compile',
      runnable: true,
      code: `fn main() {
    let score = 10;
    score = 20; // error[E0384]: cannot assign twice to immutable variable
    println!("{score}");
}`,
    },
    {
      type: 'p',
      text: 'To allow changes, opt in with `mut`:',
    },
    {
      type: 'code',
      runnable: true,
      code: `fn main() {
    let mut score = 10;
    println!("Score: {score}");
    score = 20;
    println!("Score: {score}");
}`,
      output: `Score: 10
Score: 20`,
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Why immutable by default?',
      text: 'When a value cannot change, you do not have to wonder what else in the program might have modified it. `mut` is a visible signal to readers: "this value will change, so watch it."',
    },
    { type: 'h2', text: 'Shadowing' },
    {
      type: 'p',
      text: 'You can declare a **new** variable with the same name as an old one. The new one "shadows" the old. Unlike `mut`, shadowing can even change the type:',
    },
    {
      type: 'code',
      runnable: true,
      code: `fn main() {
    let spaces = "   ";        // a string
    let spaces = spaces.len(); // now a number
    println!("There are {spaces} spaces");

    let x = 5;
    {
        let x = x * 2; // shadows only inside this block
        println!("Inner x: {x}");
    }
    println!("Outer x: {x}");
}`,
      output: `There are 3 spaces
Inner x: 10
Outer x: 5`,
    },
    { type: 'h2', text: 'Constants' },
    {
      type: 'p',
      text: 'Constants use `const`, are **always** immutable, **must** have a type annotation, and are named in `SCREAMING_SNAKE_CASE` by convention. Their value must be known at compile time.',
    },
    {
      type: 'code',
      runnable: true,
      code: `const SECONDS_PER_HOUR: u32 = 60 * 60;

fn main() {
    println!("An hour has {SECONDS_PER_HOUR} seconds");
}`,
      output: 'An hour has 3600 seconds',
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Run the "Does not compile" example in the Playground and read the error message carefully. Rust\'s compiler errors are famously helpful: this one even suggests the exact fix.',
    },
    {
      type: 'quiz',
      question: 'Which of these lets a variable change from a string to a number?',
      options: ['`let mut`', 'Shadowing with a second `let`', '`const`', 'None, Rust never allows it'],
      answer: 1,
      explanation: 'Shadowing creates a brand-new variable that happens to reuse the name, so it can have a different type. `let mut` allows changing the **value**, but never the **type**.',
    },
  ],
}
