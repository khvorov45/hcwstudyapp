import Document, { Html, Head, Main, NextScript } from 'next/document'

export default class MyDocument extends Document {
  static async getInitialProps (ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render () {
    return (
      <Html lang="en">
        <Head>
          <ThemeSwitchScript />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

function ThemeSwitchScript () {
  return <script
    dangerouslySetInnerHTML={{
      __html:
`if (!localStorage.getItem('theme')) localStorage.setItem('theme', 'dark')
document.documentElement.setAttribute('theme', localStorage.getItem('theme'))`
    }}
  >
  </script>
}
