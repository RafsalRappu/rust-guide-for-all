import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import LessonView from './components/LessonView'
import Home from './pages/Home'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="lesson/:slug" element={<LessonView />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
