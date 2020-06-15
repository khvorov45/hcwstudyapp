import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import { readLines } from './readfile'

const configDir = path.join(process.cwd(), 'config')

export default {
  accessGroups: readLines(path.join(configDir, 'access-groups.txt')),
  emailCredentials: YAML.parse(
    fs.readFileSync(path.join(configDir, 'emailcred.yaml'), 'utf-8')
  ),
  redcapCredentials: YAML.parse(
    fs.readFileSync(path.join(configDir, 'redcapcred.yaml'), 'utf-8')
  )
}
