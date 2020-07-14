import { readFileSync } from 'fs'
import path from 'path'
import YAML from 'yaml'

const config = YAML.parse(readFileSync(
  path.join(process.cwd(), 'config', 'config.yaml'),
  'utf-8'
))

export const newconfig = config
