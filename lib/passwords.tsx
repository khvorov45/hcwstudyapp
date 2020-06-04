import YAML from 'yaml'
import path from 'path'
import fs from 'fs'

export function getPasswords () {
  const passString = fs.readFileSync(
    path.join(process.cwd(), 'config', 'passwords.yaml'), 'utf8'
  )
  const passParsed = YAML.parse(passString)
  return passParsed
}
