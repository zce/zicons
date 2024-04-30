// @ts-check

/**
 * @typedef {{ name: string, svg: string, base64: string }} Icon
 */

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'

/**
 * search svg files in a directory
 * @param {string} dir svgs directory
 * @returns {Promise<string[]>} a list of svg filenames
 */
const searchSvgs = async (dir) => {
  const dirents = await readdir(dir, { withFileTypes: true })
  return dirents.filter(d => d.isFile() && d.name.endsWith('.svg')).map(d => `${dir}/${d.name}`)
}

/**
 * load an svg file
 * @param {string} path svg filename
 * @returns {Promise<Icon>} An icon object
 */
const loadSvg = async (path) => {
  const camel = basename(path, '.svg').replace(/-([a-z0-9])/g, (_, letter) => letter.toUpperCase())
  const name = camel[0].toUpperCase() + camel.slice(1)
  const svg = await readFile(path,'utf8')
  const base64 = Buffer.from(svg.replace(/currentColor/g, '#64748b').replace('width="24"', 'width="50px"').replace('height="24"', 'height="50px"')).toString('base64')
  return { name, svg, base64 }
}

const dist = 'dist'

await mkdir(dist, { recursive: true })

// lucide --------------------------------------------------------------------------------------------------------------

const lucideIcons = await Promise.all((await searchSvgs('lucide/icons')).map(loadSvg))

await writeFile(`${dist}/lucide.tsx`, `
const LucideIcon: Icon = props => (
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} />
)
${lucideIcons.sort((a, b) => a.name.localeCompare(b.name)).map(({ name, svg, base64 }) => `
/** ![](data:image/svg+xml;base64,${base64}) */
export const ${name}Icon: Icon = props => (
  <LucideIcon {...props}>
    ${svg.slice(203, svg.indexOf('\n</svg>')).replace(/  /g, '    ')}
  </LucideIcon>
)
`).join('')}
`)

// simple --------------------------------------------------------------------------------------------------------------

const simpleIcons = await Promise.all((await searchSvgs('simple-icons/icons')).map(loadSvg))

await writeFile(`${dist}/simple.tsx`, `
const SimpleIcon: Icon = props => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props} />
${simpleIcons.sort((a, b) => a.name.localeCompare(b.name)).map(({ name, svg, base64 }) => `
/** ![](data:image/svg+xml;base64,${base64}) */
export const Brand${name}: Icon = props => (
  <SimpleIcon {...props}>
    ${svg.slice(svg.indexOf('</title>') + 8, svg.indexOf('</svg>'))}
  </SimpleIcon>
)
`).join('')}
`)
