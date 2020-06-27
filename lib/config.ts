import { readFileSync } from 'fs'
import path from 'path'
import YAML from 'yaml'

export const newconfig = YAML.parse(readFileSync(
  path.join(process.cwd(), 'config', 'config.yaml'),
  'utf-8'
))
