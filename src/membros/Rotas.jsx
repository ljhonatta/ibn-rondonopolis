import { useLocation } from 'react-router-dom'
import { AuthProvider } from '../lib/auth'
import { useAppShell } from '../lib/appShell'
import Entrar from './Entrar'
import MinhaArea from './MinhaArea'

// Área do membro (carregada só quando alguém entra em /entrar ou /minha-area)
export default function Rotas() {
  const { pathname } = useLocation()
  useAppShell('membros')
  return <AuthProvider>{pathname.startsWith('/entrar') ? <Entrar /> : <MinhaArea />}</AuthProvider>
}
