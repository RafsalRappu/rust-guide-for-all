export default {
  slug: 'lifetimes',
  level: 'advanced',
  title: 'Lifetimes',
  summary: 'How the compiler proves references are always valid, and how to annotate lifetimes when it needs help.',
  sections: [
    {
      type: 'p',
      text: 'Every reference has a **lifetime**: the stretch of code during which it is valid. Most of the time the compiler works lifetimes out on its own. When it cannot, you add **lifetime annotations**. They do not change how long anything lives; they **describe relationships** between references so the compiler can check them.',
    },
    { type: 'h2', text: 'When annotations are needed' },
    {
      type: 'code',
      title: 'Does not compile',
      code: `fn longest(x: &str, y: &str) -> &str {  // error[E0106]: missing lifetime specifier
    if x.len() >= y.len() { x } else { y }
}`,
    },
    {
      type: 'p',
      text: 'The returned reference comes from either `x` or `y`, and the compiler cannot tell which. We tell it: "the result lives at least as long as **both** inputs". Lifetime names start with an apostrophe, usually `\'a`.',
    },
    {
      type: 'code',
      runnable: true,
      code: `fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() >= y.len() { x } else { y }
}

fn main() {
    let a = String::from("a long string");
    {
        let b = String::from("short");
        let result = longest(a.as_str(), b.as_str());
        println!("Longest: {result}");
    }
}`,
      output: 'Longest: a long string',
    },
    {
      type: 'p',
      text: 'Now the compiler can catch a real bug. Here `result` might point into `b`, but `b` is freed before `result` is used:',
    },
    {
      type: 'code',
      title: 'Does not compile',
      runnable: true,
      code: `fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() >= y.len() { x } else { y }
}

fn main() {
    let a = String::from("a long string");
    let result;
    {
        let b = String::from("short");
        result = longest(a.as_str(), b.as_str()); // error[E0597]: \`b\` does not live long enough
    }
    println!("Longest: {result}");
}`,
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Read \'a as a constraint, not a timer',
      text: '`<\'a>` means: "pick the overlap where every reference marked `\'a` is valid; the return value is only usable inside that overlap". The compiler then verifies every caller respects it.',
    },
    { type: 'h2', text: 'Structs that hold references' },
    {
      type: 'p',
      text: 'A struct that stores a reference needs a lifetime parameter. It guarantees the struct cannot outlive the data it borrows:',
    },
    {
      type: 'code',
      runnable: true,
      code: `struct Excerpt<'a> {
    part: &'a str,
}

impl<'a> Excerpt<'a> {
    fn announce(&self, message: &str) -> &str {
        println!("Attention: {message}");
        self.part
    }
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.').next().unwrap();
    let excerpt = Excerpt { part: first_sentence };
    println!("Excerpt: {}", excerpt.announce("new excerpt"));
}`,
      output: `Attention: new excerpt
Excerpt: Call me Ishmael`,
    },
    { type: 'h2', text: 'Elision: why you rarely write lifetimes' },
    {
      type: 'p',
      text: 'The compiler applies three **lifetime elision rules** before asking you for annotations:',
    },
    {
      type: 'list',
      items: [
        '**Rule 1:** each reference parameter gets its own lifetime.',
        '**Rule 2:** if there is exactly one input lifetime, it is used for all outputs. That is why `fn first_word(s: &str) -> &str` needs no annotations.',
        '**Rule 3:** if a method takes `&self` or `&mut self`, the output gets the lifetime of `self`. That is why `announce` above needs none.',
      ],
    },
    { type: 'h2', text: "The 'static lifetime" },
    {
      type: 'p',
      text: '`\'static` means the reference can live for the entire program. All string literals are `&\'static str` because they are stored directly in the program binary.',
    },
    {
      type: 'code',
      code: `let greeting: &'static str = "I live forever";`,
    },
    {
      type: 'callout',
      variant: 'warning',
      title: "Don't reach for 'static to silence errors",
      text: 'When the compiler suggests `\'static`, it is usually a sign the design needs to change: return an owned value (`String` instead of `&str`), or restructure so the data lives long enough.',
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Write `struct Parser<\'a> { input: &\'a str }` with a method `fn words(&self) -> Vec<&\'a str>` that splits the input on whitespace. Notice the returned words borrow from the original input, not from the `Parser`.',
    },
    {
      type: 'quiz',
      question: 'Why does `fn first(s: &str) -> &str` compile without any lifetime annotation?',
      options: [
        'String slices are always `\'static`',
        'There is only one input reference, so elision rule 2 applies',
        'Lifetimes are optional for functions',
        'The compiler copies the string',
      ],
      answer: 1,
      explanation: 'With exactly one input lifetime, the compiler assigns that lifetime to the output automatically. You would write `fn first<\'a>(s: &\'a str) -> &\'a str` to get the same meaning.',
    },
  ],
}
