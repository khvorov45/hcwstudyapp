import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import { readDelimited, readLines } from './readfile'

const configDir = path.join(process.cwd(), 'config')

export default {
  sites: readLines(path.join(configDir, 'sites.txt')),
  users: readDelimited(
    path.join(configDir, 'user.txt'), ' ', ['email', 'accessGroup']
  ),
  emailCredentials: YAML.parse(
    fs.readFileSync(path.join(configDir, 'emailcred.yaml'), 'utf-8')
  ),
  redcapCredentials: YAML.parse(
    fs.readFileSync(path.join(configDir, 'redcapcred.yaml'), 'utf-8')
  )
}
