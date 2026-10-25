import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { SiteProvider } from './lib/site'
import { APP } from './lib/modo'
import Header from './components/Header'
import Hero from './components/Hero'
import NextService from './components/NextService'
import About from './components/About'
import Schedule from './components/Schedule'
import Events from './components/Events'
import Ministries from './components/Ministries'
import Gallery from './components/Gallery'
import Give from './components/Give'
import Contact from './components/Contact'
import Location from './components/Location'
import Footer, { WhatsFab } from './components/Footer'

// O painel só é baixado quando alguém acessa /admin.
const Admin = lazy(() => import('./admin/Admin'))
const Membros = lazy(() => import('./membros/Rotas'))
const EspacoNovo = lazy(() => import('./components/EspacoNovoPublico'))

function Home() {
  return (
    <SiteProvider>
      <Header />
      <main>
        <Hero />
        <NextService />
        <About />
        <Schedule />
        <Events />
        <Ministries />
        <Gallery />
        <Give />
        <Contact />
        <Location />
      </main>
      <Footer />
      <WhatsFab />
    </SiteProvider>
  )
}

const carregando = <div className="min-h-screen bg-ink" />

export default function App() {
  // Apps instaláveis: cada subdomínio abre direto na sua área
  if (APP === 'membros')
    return (
      <Routes>
        <Route path="/projeto-espaco-novo" element={<Suspense fallback={carregando}><EspacoNovo /></Suspense>} />
        <Route path="/admin/*" element={<Suspense fallback={carregando}><Admin /></Suspense>} />
        <Route path="*" element={<Suspense fallback={carregando}><Membros /></Suspense>} />
      </Routes>
    )
  if (APP === 'admin')
    return (
      <Routes>
        {['/entrar', '/minha-area/*'].map((path) => <Route key={path} path={path} element={<Suspense fallback={carregando}><Membros /></Suspense>} />)}
        <Route path="*" element={<Suspense fallback={carregando}><Admin /></Suspense>} />
      </Routes>
    )
  return (
    <Routes>
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<div className="grid min-h-screen place-items-center bg-ink text-white/50">Carregando…</div>}>
            <Admin />
          </Suspense>
        }
      />
      {['/entrar', '/minha-area/*'].map((path) => (
        <Route
          key={path}
          path={path}
          element={
            <Suspense fallback={<div className="min-h-screen bg-ink" />}>
              <Membros />
            </Suspense>
          }
        />
      ))}
      <Route
        path="/projeto-espaco-novo"
        element={
          <Suspense fallback={<div className="min-h-screen bg-ink" />}>
            <EspacoNovo />
          </Suspense>
        }
      />
      <Route path="*" element={<Home />} />
    </Routes>
  )
}
