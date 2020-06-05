import fs from 'fs'
import readline from 'readline'

export async function readDelimited (
  filePath: string, delimeter: string, colnames: string[]
): Promise<any> {
  const lineReader = readline.createInterface({
    input: fs.createReadStream(filePath)
  })
  const rows = []
  for await (const line of lineReader) {
    const lineSplit = line.split(delimeter)
    const row = {}
    for (const i in lineSplit) {
      row[colnames[i]] = lineSplit[i]
    }
    rows.push(row)
  }
  return rows
}

export async function readLines (filePath: string): Promise<string[]> {
  const lineReader = readline.createInterface({
    input: fs.createReadStream(filePath)
  })
  const lines = []
  for await (const line of lineReader) {
    lines.push(line)
  }
  return lines
}
