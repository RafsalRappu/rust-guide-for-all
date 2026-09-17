export default {
  slug: 'smart-pointers',
  level: 'expert',
  title: 'Smart Pointers: Box, Rc & RefCell',
  summary: 'Heap allocation, shared ownership, interior mutability, and running code on drop.',
  sections: [
    {
      type: 'p',
      text: 'A **smart pointer** is a struct that acts like a reference but adds extra abilities and ownership rules. You have already used two: `String` and `Vec<T>`. This lesson covers the ones you reach for when plain ownership and borrowing are not enough.',
    },
    { type: 'h2', text: 'Box<T>: put a value on the heap' },
    {
      type: 'p',
      text: '`Box<T>` stores its value on the heap and owns it. Its most important use is **recursive types**: a type that contains itself would have infinite size, but a `Box` always has a fixed pointer size.',
    },
    {
      type: 'code',
      runnable: true,
      code: `#[derive(Debug)]
enum List {
    Cons(i32, Box<List>),
    Nil,
}

use List::{Cons, Nil};

fn sum(list: &List) -> i32 {
    match list {
        Cons(value, rest) => value + sum(rest),
        Nil => 0,
    }
}

fn main() {
    let list = Cons(1, Box::new(Cons(2, Box::new(Cons(3, Box::new(Nil))))));
    println!("{:?}", list);
    println!("sum = {}", sum(&list));
}`,
      output: `Cons(1, Cons(2, Cons(3, Nil)))
sum = 6`,
    },
    {
      type: 'p',
      text: 'Other common uses: moving a very large value without copying it, and trait objects like `Box<dyn Error>` or `Box<dyn Fn()>`.',
    },
    { type: 'h2', text: 'Rc<T>: shared ownership' },
    {
      type: 'p',
      text: 'Sometimes one value really has several owners, such as a node shared by multiple parts of a graph. `Rc<T>` ("reference counted") keeps a count of owners and frees the value when the last one is dropped. `Rc::clone` only increments the count; it does not copy the data.',
    },
    {
      type: 'code',
      runnable: true,
      code: `use std::rc::Rc;

fn main() {
    let shared = Rc::new(String::from("shared config"));
    println!("count after new: {}", Rc::strong_count(&shared));

    let a = Rc::clone(&shared);
    {
        let b = Rc::clone(&shared);
        println!("count with a and b: {}", Rc::strong_count(&shared));
        println!("b sees: {b}");
    }
    println!("count after b dropped: {}", Rc::strong_count(&shared));
    println!("a sees: {a}");
}`,
      output: `count after new: 1
count with a and b: 3
b sees: shared config
count after b dropped: 2
a sees: shared config`,
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'Rc gives shared, read-only access',
      text: '`Rc<T>` only hands out immutable references, and it is **single-threaded**. For threads, use `Arc<T>` (next lesson). Two `Rc`s pointing at each other form a cycle that is never freed; break cycles with `Weak<T>`.',
    },
    { type: 'h2', text: 'RefCell<T>: interior mutability' },
    {
      type: 'p',
      text: '`RefCell<T>` moves the borrowing rules from compile time to **runtime**. It lets you mutate data through a shared reference with `.borrow_mut()`. If you break the rules (for example, two active `borrow_mut` calls), the program panics instead of failing to compile.',
    },
    {
      type: 'p',
      text: 'Combining the two, `Rc<RefCell<T>>`, gives you data with multiple owners that any of them can change:',
    },
    {
      type: 'code',
      runnable: true,
      code: `use std::cell::RefCell;
use std::rc::Rc;

#[derive(Debug)]
struct Account {
    balance: i64,
}

fn main() {
    let account = Rc::new(RefCell::new(Account { balance: 100 }));

    let alice = Rc::clone(&account);
    let bob = Rc::clone(&account);

    alice.borrow_mut().balance -= 30;
    bob.borrow_mut().balance += 50;

    println!("Final balance: {}", account.borrow().balance);
    println!("{:?}", account);
}`,
      output: `Final balance: 120
RefCell { value: Account { balance: 120 } }`,
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Try the simpler tools first',
      text: '`Rc<RefCell<T>>` is powerful but moves errors to runtime. Prefer plain ownership, `&mut` borrows, or restructuring your data (for example, storing items in a `Vec` and referring to them by index) before reaching for it.',
    },
    { type: 'h2', text: 'Drop: code that runs on cleanup' },
    {
      type: 'p',
      text: 'Implementing the `Drop` trait lets you run code when a value goes out of scope. This is how files close, locks release, and memory frees automatically. Values are dropped in **reverse** order of creation.',
    },
    {
      type: 'code',
      runnable: true,
      code: `struct Noisy(&'static str);

impl Drop for Noisy {
    fn drop(&mut self) {
        println!("Dropping {}", self.0);
    }
}

fn main() {
    let _a = Noisy("a");
    let _b = Noisy("b");
    let c = Noisy("c");
    drop(c); // drop early with std::mem::drop
    println!("end of main");
}`,
      output: `Dropping c
end of main
Dropping b
Dropping a`,
    },
    { type: 'h2', text: 'Which one do I need?' },
    {
      type: 'list',
      items: [
        '`Box<T>`: one owner, value on the heap. Recursive types and trait objects.',
        '`Rc<T>`: many owners, read-only, single thread.',
        '`Arc<T>`: many owners, read-only, across threads.',
        '`RefCell<T>`: mutate through `&T`, checked at runtime, single thread.',
        '`Mutex<T>` / `RwLock<T>`: mutate through `&T`, across threads.',
        '`Cell<T>`: like `RefCell` for small `Copy` values, with no borrowing at all.',
      ],
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Model a family tree: `struct Person { name: String, children: RefCell<Vec<Rc<Person>>> }`. Create a parent with two children, then print each child\'s name and the parent\'s `Rc::strong_count`.',
    },
    {
      type: 'quiz',
      question: 'What happens if you call `borrow_mut()` on a `RefCell` that already has an active mutable borrow?',
      options: [
        'Compile error',
        'The program panics at runtime',
        'The second borrow waits for the first',
        'Both borrows succeed',
      ],
      answer: 1,
      explanation: '`RefCell` enforces the borrowing rules at **runtime**. Breaking them panics. Use `try_borrow_mut()` if you want a `Result` instead.',
    },
  ],
}
