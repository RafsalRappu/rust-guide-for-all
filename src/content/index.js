// Course order is the order of this array. To add a lesson: create its file, import it here.
import gettingStarted from './beginner/getting-started'
import variables from './beginner/variables'
import dataTypes from './beginner/data-types'
import functionsControlFlow from './beginner/functions-control-flow'
import ownership from './beginner/ownership'

import borrowing from './intermediate/borrowing'
import structs from './intermediate/structs'
import enumsMatching from './intermediate/enums-matching'
import collections from './intermediate/collections'
import errorHandling from './intermediate/error-handling'

import generics from './advanced/generics'
import traits from './advanced/traits'
import lifetimes from './advanced/lifetimes'
import closuresIterators from './advanced/closures-iterators'
import modulesCargo from './advanced/modules-cargo'

import smartPointers from './expert/smart-pointers'
import concurrency from './expert/concurrency'
import asyncRust from './expert/async'
import macros from './expert/macros'
import unsafeFfi from './expert/unsafe-ffi'

import setup from './projects/setup'
import configuration from './projects/configuration'
import taskApi from './projects/task-api'
import database from './projects/database'
import callingApis from './projects/calling-apis'
import testing from './projects/testing'
import shipping from './projects/shipping'

export const LESSONS = [
  gettingStarted,
  variables,
  dataTypes,
  functionsControlFlow,
  ownership,
  borrowing,
  structs,
  enumsMatching,
  collections,
  errorHandling,
  generics,
  traits,
  lifetimes,
  closuresIterators,
  modulesCargo,
  smartPointers,
  concurrency,
  asyncRust,
  macros,
  unsafeFfi,
  setup,
  configuration,
  taskApi,
  database,
  callingApis,
  testing,
  shipping,
]

export function getLesson(slug) {
  return LESSONS.find((l) => l.slug === slug)
}

export function lessonsByLevel(levelId) {
  return LESSONS.filter((l) => l.level === levelId)
}

export function getAdjacentLessons(slug) {
  const i = LESSONS.findIndex((l) => l.slug === slug)
  return {
    prev: i > 0 ? LESSONS[i - 1] : null,
    next: i >= 0 && i < LESSONS.length - 1 ? LESSONS[i + 1] : null,
  }
}
