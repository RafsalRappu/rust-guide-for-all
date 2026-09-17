export default {
  slug: 'ownership',
  level: 'beginner',
  title: 'Ownership',
  summary: "Rust's most important idea: how it manages memory safely without a garbage collector.",
  sections: [
    {
      type: 'p',
      text: 'Every program has to manage memory. Some languages (Python, JavaScript, Go, Java) use a **garbage collector** that cleans up in the background. Others (C, C++) make **you** free memory by hand, which leads to crashes and security bugs when you get it wrong.',
    },
    {
      type: 'p',
      text: 'Rust takes a third path, called **ownership**. It is a small set of rules that the compiler checks. If your code breaks a rule, it does not compile. Your program pays no runtime cost for this.',
    },
    {
      type: 'callout',
      variant: 'note',
      title: 'The three rules of ownership',
      text: '1. Each value in Rust has an **owner**. 2. There can only be **one owner at a time**. 3. When the owner goes **out of scope**, the value is dropped (its memory is freed).',
    },
    { type: 'h2', text: 'Stack and heap, briefly' },
    {
      type: 'p',
      text: 'Values with a known, fixed size (like `i32` or `bool`) live on the **stack**, which is fast and cleaned up automatically. Values that can grow, like a `String`, keep their contents on the **heap**. The variable on the stack holds a pointer to that heap memory. Ownership rules exist mainly to decide **who frees the heap memory, and when**.',
    },
    { type: 'h2', text: 'Move: ownership changes hands' },
    {
      type: 'p',
      text: 'Step through this visualizer to see what happens in memory, line by line:',
    },
    { type: 'widget', name: 'ownership' },
    {
      type: 'p',
      text: 'When you write `let s2 = s1;` for a `String`, Rust does not copy the heap data (that could be expensive). It **moves** ownership to `s2` and treats `s1` as invalid. Only one owner remains, so the memory is freed exactly once.',
    },
    {
      type: 'code',
      title: 'Does not compile',
      runnable: true,
      code: `fn main() {
    let s1 = String::from("hello");
    let s2 = s1;
    println!("{s1}, world!"); // error[E0382]: borrow of moved value: \`s1\`
}`,
    },
    { type: 'h2', text: 'Clone: an explicit deep copy' },
    {
      type: 'code',
      runnable: true,
      code: `fn main() {
    let s1 = String::from("hello");
    let s2 = s1.clone();
    println!("s1 = {s1}, s2 = {s2}");
}`,
      output: 's1 = hello, s2 = hello',
    },
    { type: 'h2', text: 'Copy types are different' },
    {
      type: 'p',
      text: 'Simple stack-only types such as integers, floats, `bool`, `char`, and tuples of those implement the `Copy` trait. Assigning them makes a cheap copy, so the original stays usable:',
    },
    {
      type: 'code',
      runnable: true,
      code: `fn main() {
    let x = 5;
    let y = x; // copied, not moved
    println!("x = {x}, y = {y}");
}`,
      output: 'x = 5, y = 5',
    },
    { type: 'h2', text: 'Functions take ownership too' },
    {
      type: 'p',
      text: 'Passing a value into a function moves it, exactly like assignment. Returning a value moves ownership back out:',
    },
    {
      type: 'code',
      runnable: true,
      code: `fn take(s: String) {
    println!("I own: {s}");
} // s is dropped here

fn give() -> String {
    String::from("a gift")
}

fn main() {
    let a = String::from("hello");
    take(a);
    // println!("{a}"); // would fail: a was moved into take()

    let b = give();
    println!("I received {b}");
}`,
      output: `I own: hello
I received a gift`,
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Feeling boxed in?',
      text: 'Moving a value into every function you call would be very annoying. The next lesson, **References & Borrowing**, shows how to let a function use a value without taking ownership of it.',
    },
    {
      type: 'quiz',
      question: 'After `let a = vec![1, 2, 3]; let b = a;`, which is true?',
      options: [
        'Both `a` and `b` can be used',
        '`a` is invalid; `b` owns the vector',
        '`b` is a deep copy of `a`',
        'It does not compile',
      ],
      answer: 1,
      explanation: '`Vec` stores its data on the heap and is not `Copy`, so assignment **moves** ownership to `b`. Using `a` afterwards is a compile error. Use `a.clone()` if you need two independent copies.',
    },
  ],
}
