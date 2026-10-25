import { useLocation } from 'react-router-dom'
import { AuthProvider } from '../lib/auth'
import Entrar from './Entrar'
import MinhaArea from './MinhaArea'

// Área do membro (carregada só quando alguém entra em /entrar ou /minha-area)
export default function Rotas() {
  const { pathname } = useLocation()
  return <AuthProvider>{pathname.startsWith('/minha-area') ? <MinhaArea /> : <Entrar />}</AuthProvider>
}
