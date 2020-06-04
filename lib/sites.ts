import readline from 'readline'
import fs from 'fs'
import path from 'path'

export async function getAllSites (): Promise<string[]> {
  var lineReader = readline.createInterface({
    input: fs.createReadStream(path.join(process.cwd(), 'config', 'sites.txt'))
  })
  var sites = []
  for await (const line of lineReader) {
    sites.push(line)
  }
  return sites
}
