export default {
  slug: 'concurrency',
  level: 'expert',
  title: 'Fearless Concurrency',
  summary: 'Threads, message passing with channels, shared state with Arc and Mutex, and the Send and Sync traits.',
  sections: [
    {
      type: 'p',
      text: 'Concurrency bugs such as data races are notoriously hard to find, because they appear only sometimes. Rust\'s ownership and type system turn most of them into **compile-time errors**. The community calls this **fearless concurrency**.',
    },
    { type: 'h2', text: 'Spawning threads' },
    {
      type: 'p',
      text: '`thread::spawn` runs a closure on a new OS thread and returns a `JoinHandle`. Calling `.join()` waits for the thread and returns its result. The `move` keyword gives the closure ownership of values it uses, because the thread might outlive the current function.',
    },
    {
      type: 'code',
      runnable: true,
      code: `use std::thread;
use std::time::Duration;

fn main() {
    let handles: Vec<_> = (1..=3)
        .map(|id| {
            thread::spawn(move || {
                thread::sleep(Duration::from_millis(10 * id));
                format!("worker {id} done")
            })
        })
        .collect();

    for handle in handles {
        println!("{}", handle.join().unwrap());
    }
}`,
      output: `worker 1 done
worker 2 done
worker 3 done`,
    },
    { type: 'h2', text: 'Scoped threads: borrowing without move' },
    {
      type: 'p',
      text: '`thread::scope` guarantees that every thread finishes before the scope ends, so threads can safely **borrow** local data:',
    },
    {
      type: 'code',
      runnable: true,
      code: `use std::thread;

fn main() {
    let data = vec![1, 2, 3, 4, 5, 6];
    let (left, right) = data.split_at(3);

    let (a, b) = thread::scope(|s| {
        let h1 = s.spawn(|| left.iter().sum::<i32>());
        let h2 = s.spawn(|| right.iter().sum::<i32>());
        (h1.join().unwrap(), h2.join().unwrap())
    });

    println!("left = {a}, right = {b}, total = {}", a + b);
}`,
      output: 'left = 6, right = 15, total = 21',
    },
    { type: 'h2', text: 'Message passing with channels' },
    {
      type: 'p',
      text: '"Do not communicate by sharing memory; share memory by communicating." A **channel** has a sending half (`tx`) and a receiving half (`rx`). Sending a value moves ownership to the receiver, so two threads can never touch it at once.',
    },
    {
      type: 'code',
      runnable: true,
      code: `use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    for id in 0..3 {
        let tx = tx.clone(); // mpsc = multiple producers, single consumer
        thread::spawn(move || {
            tx.send(format!("hello from thread {id}")).unwrap();
        });
    }
    drop(tx); // close the original sender so the loop below can finish

    let mut messages: Vec<String> = rx.iter().collect();
    messages.sort(); // threads finish in any order
    for m in messages {
        println!("{m}");
    }
}`,
      output: `hello from thread 0
hello from thread 1
hello from thread 2`,
    },
    { type: 'h2', text: 'Shared state with Arc<Mutex<T>>' },
    {
      type: 'p',
      text: 'When threads really need the same data, wrap it in a `Mutex` (only one thread can access it at a time) and share the mutex with `Arc` (an atomically reference-counted pointer that is safe across threads). The lock releases automatically when the guard is dropped.',
    },
    {
      type: 'code',
      runnable: true,
      code: `use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..8 {
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            for _ in 0..1000 {
                *counter.lock().unwrap() += 1;
            }
        }));
    }

    for h in handles {
        h.join().unwrap();
    }
    println!("Final count: {}", *counter.lock().unwrap());
}`,
      output: 'Final count: 8000',
    },
    { type: 'h2', text: 'The compiler stops the mistakes' },
    {
      type: 'p',
      text: 'Try sharing an `Rc` across threads and the code is rejected, because `Rc` updates its count without synchronization:',
    },
    {
      type: 'code',
      title: 'Does not compile',
      runnable: true,
      code: `use std::rc::Rc;
use std::thread;

fn main() {
    let data = Rc::new(5);
    let clone = Rc::clone(&data);
    thread::spawn(move || {
        // error[E0277]: \`Rc<i32>\` cannot be sent between threads safely
        println!("{clone}");
    });
}`,
    },
    {
      type: 'callout',
      variant: 'note',
      title: 'Send and Sync',
      text: 'These two marker traits power it all. `Send`: the value can be **moved** to another thread. `Sync`: the value can be **shared by reference** between threads. The compiler implements them automatically for types built from safe parts. `Rc` and `RefCell` are not `Sync`, which is why they are rejected above.',
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Data parallelism with rayon',
      text: 'For CPU-heavy work over collections, the `rayon` crate turns `.iter()` into `.par_iter()` and spreads the work over all cores, with the same safety guarantees.',
    },
    {
      type: 'callout',
      variant: 'challenge',
      title: 'Try it yourself',
      text: 'Split the numbers 1 to 1,000,000 into 4 chunks and sum each chunk on its own thread using `thread::scope`. Check that the total equals `500000500000` (use `u64`).',
    },
    {
      type: 'quiz',
      question: 'Which type should you use to share a mutable counter between threads?',
      options: ['`Rc<RefCell<u32>>`', '`Arc<Mutex<u32>>`', '`Box<u32>`', '`&mut u32`'],
      answer: 1,
      explanation: '`Arc` provides thread-safe shared ownership and `Mutex` provides synchronized mutation. `Rc` and `RefCell` are single-threaded only, and the compiler will reject them.',
    },
  ],
}
