import { readFileSync } from 'fs'
import path from 'path'
import YAML from 'yaml'

const config = YAML.parse(readFileSync(
  path.join(process.cwd(), 'config', 'config.yaml'),
  'utf-8'
))

const variables = YAML.parse(readFileSync(
  path.join(process.cwd(), 'config', 'db', 'variables.yaml'),
  'utf-8'
))

config.db.variables = variables

export const newconfig = config
