# Rust, for Everyone 🦀

A complete, hands-on Rust course built as a React app. It is designed for every kind of learner: people who have never programmed, developers coming from Python, JavaScript, or C++, and experienced Rustaceans who want the deep end.

## Features

- **27 lessons across 5 levels**: Beginner → Intermediate → Advanced → Expert → Projects
- **A hands-on Projects track**: install and configure Rust, then build, test, mock, and ship a task manager REST API
- **Runnable examples**: every "▶ Run in Playground" button opens the code in the official Rust Playground, so no install is needed
- **Expected output** shown under each example
- **Quizzes** at the end of every lesson, with explanations
- **Interactive ownership visualizer** that steps through stack and heap memory
- **"Where should I start?" paths** for different backgrounds
- **Progress tracking** saved in your browser
- Light and dark themes, and a mobile-friendly layout

## Getting started

Requires [Node.js](https://nodejs.org/) 20 or newer.

```bash
npm install
npm run dev
```

Then open the URL printed in the terminal (usually http://localhost:5173).

| Command           | What it does                         |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the dev server with hot reload |
| `npm run build`   | Build for production into `dist/`    |
| `npm run preview` | Preview the production build         |
| `npm run lint`    | Lint the code                        |

## Curriculum

| Level        | Lessons                                                                                              |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| Beginner     | Getting Started · Variables & Mutability · Data Types · Functions & Control Flow · Ownership         |
| Intermediate | References & Borrowing · Structs & Methods · Enums & Pattern Matching · Collections · Error Handling |
| Advanced     | Generics · Traits · Lifetimes · Closures & Iterators · Modules, Crates & Cargo                       |
| Expert       | Smart Pointers · Fearless Concurrency · Async Rust · Macros · Unsafe Rust & FFI                      |
| Projects     | Environment Setup · Configuring Cargo & Your App · Project: Task Manager API · Adding a Database · Calling External APIs · Testing & Mocking · Shipping to Production |

## Project structure

```
src/
├── main.jsx                  # Router + theme and progress providers
├── App.jsx                   # Routes
├── index.css                 # All styles (theme tokens, layout, code highlighting)
├── data/levels.js            # The 5 levels
├── content/
│   ├── index.js              # Lesson order and lookup helpers
│   ├── beginner/*.js         # One file per lesson
│   ├── intermediate/*.js
│   ├── advanced/*.js
│   ├── expert/*.js
│   └── projects/*.js         # Setup, configuration, and the task manager API project
├── components/
│   ├── Layout.jsx            # Sidebar + top bar shell
│   ├── Sidebar.jsx
│   ├── LessonView.jsx        # Renders a lesson from its content file
│   ├── CodeBlock.jsx         # Rust syntax highlighting, copy, Run in Playground
│   ├── Quiz.jsx
│   ├── Callout.jsx
│   ├── RichText.jsx          # Inline `code` and **bold** in lesson text
│   └── OwnershipVisualizer.jsx
├── context/
│   ├── ProgressContext.jsx   # Completed lessons (localStorage)
│   └── ThemeContext.jsx      # Light/dark theme
└── pages/
    ├── Home.jsx
    └── NotFound.jsx
```

## Adding a lesson

Lessons are plain data, so you do not need to write any React to add one.

1. Create a file such as `src/content/intermediate/my-lesson.js`:

   ```js
   export default {
     slug: 'my-lesson',
     level: 'intermediate',
     title: 'My Lesson',
     summary: 'One sentence describing the lesson.',
     sections: [
       { type: 'p', text: 'Text with `inline code` and **bold**.' },
       { type: 'h2', text: 'A heading' },
       { type: 'list', items: ['First point', 'Second point'] },
       {
         type: 'code',
         runnable: true,
         code: 'fn main() {\n    println!("hi");\n}',
         output: 'hi',
       },
       { type: 'callout', variant: 'tip', title: 'Tip', text: '...' },
       {
         type: 'quiz',
         question: '...',
         options: ['A', 'B', 'C'],
         answer: 1,
         explanation: '...',
       },
     ],
   }
   ```

2. Import it in `src/content/index.js` and add it to the `LESSONS` array where it belongs.

Callout variants are `tip`, `warning`, `challenge`, and `note`. Code blocks accept `language` (`rust` by default; other values such as `shell` or `toml` are shown without highlighting) and an optional `title`. Give a code block the title `Does not compile` when it intentionally shows a compiler error.
