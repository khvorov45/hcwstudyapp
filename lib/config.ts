import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import { readLines, readDelimited } from './readfile'

const configDir = path.join(process.cwd(), 'config')

export default {
  getExtraUsers: async () => readDelimited(
    path.join(configDir, 'extra-users.txt'), ' ', ['email', 'accessGroup']
  ),
  getExtraAccessGroups: async () =>
    readLines(path.join(configDir, 'access-groups.txt')),
  emailCredentials: YAML.parse(
    fs.readFileSync(path.join(configDir, 'emailcred.yaml'), 'utf-8')
  ),
  redcapCredentials: YAML.parse(
    fs.readFileSync(path.join(configDir, 'redcapcred.yaml'), 'utf-8')
  )
}
