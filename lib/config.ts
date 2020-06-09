import fs from 'fs'
import path from 'path'
import YAML from 'yaml'

const configDir = path.join(process.cwd(), 'config')

export default {
  emailCredentials: YAML.parse(
    fs.readFileSync(path.join(configDir, 'emailcred.yaml'), 'utf-8')
  ),
  redcapCredentials: YAML.parse(
    fs.readFileSync(path.join(configDir, 'redcapcred.yaml'), 'utf-8')
  )
}
