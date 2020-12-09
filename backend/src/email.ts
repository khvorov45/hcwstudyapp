export async function emailToken({
  email,
  token,
}: {
  email: string
  token: string
}) {
  console.log(`emailing token ${token} to ${email}`)
}
