import { AppProps } from 'next/app'
import '../styles/material-icons.css'

export default function App ({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
