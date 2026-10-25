import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../admin/client'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

// Sessão + perfil do membro. O supabase-js guarda a sessão no aparelho (login persistente).
export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(undefined)
  const [recovery, setRecovery] = useState(false)

  const loadProfile = useCallback(async (s) => {
    if (!s) return setProfile(null)
    // Liderança (lista de e-mails no banco) sempre entra com acesso total
    await supabase.rpc('garantir_lider')
    const { data } = await supabase.from('profiles').select('*').eq('id', s.user.id).maybeSingle()
    setProfile(data || null)
  }, [])

  useEffect(() => {
    if (!supabase) return setSession(null)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      loadProfile(data.session)
    })
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      setSession(s)
      if (event !== 'TOKEN_REFRESHED') loadProfile(s)
    })
    return () => data.subscription.unsubscribe()
  }, [loadProfile])

  const value = {
    session,
    profile,
    recovery,
    setRecovery,
    loading: session === undefined || (session && profile === undefined),
    reloadProfile: () => loadProfile(session),
    signOut: () => supabase.auth.signOut(),
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Entrar/criar conta com o Google (volta para a página indicada)
export function entrarComGoogle(volta = '/minha-area') {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${location.origin}/entrar?volta=${encodeURIComponent(volta)}`, queryParams: { prompt: 'select_account' } },
  })
}

export const ehLideranca = (p) => p?.status === 'ativo' && p.roles?.some((r) => ['super_admin', 'tesouraria', 'intercessao'].includes(r))

export const primeiroNome = (nome = '') => nome.trim().split(/\s+/)[0] || ''
