// Qual "app" este build é: site oficial, app dos membros ou app do admin
export const APP = import.meta.env.VITE_APP_MODE || 'site'
export const SITE_URL = APP === 'site' ? '/' : 'https://ibnrondonopolis.com/'
