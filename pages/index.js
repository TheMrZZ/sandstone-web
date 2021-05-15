import { useEffect, useState } from 'react'

import '../styles/Home.module.css'

// This prevents tree shaking.
require('sandstone')

async function compile(code) {
  const sandstone = require('sandstone')
  const { dataPack } = require('sandstone/init')
  dataPack.reset()

  const regex = /^\s*import(?:\s+|\s*\{\s*(.+)\s*\}\s*)from ['"](\S+)['"]\s*$/gm
  const imports = code.matchAll(regex)
  const codeWithoutImports = code.replaceAll(regex, '')

  for (const [_, variables, importedPkg] of imports) {
    if (importedPkg !== 'sandstone') {
      throw new Error('Cannot import anything else than sandstone.')
    }
    
    eval(`const {${variables}} = sandstone;${codeWithoutImports}`)
  }

  const savePack = sandstone.savePack

  const files = []
  await savePack('myDataPack', {
    customFileHandler: (fileInfo) => {
      files.push(fileInfo)
    },
    indentation: 2,
  })
  return files
}

const DEFAULT_CODE = `
import { MCFunction, say } from 'sandstone'

MCFunction('test', () => { say('test!') })
`.trim()

export default function Home() {
  const [files, setFiles] = useState([])
  const [code, setCode] = useState(DEFAULT_CODE)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    compile(code)
      .then(f => {
        setError(null)
        setFiles(f)
      })
      .catch(e => setError(e))
  }, [setFiles, code])

  if (typeof window === 'undefined') {
    return null 
  }

  const errorDiv = !error ? null : (
    <div className="error">
      { error.toString() }
    </div>
  ) 

  const result = files.map(file => {
    const type = file.type
    const typeDisplay = type[0].toUpperCase() + type.slice(1, -1)
    return <div className="func">
      <header>
        <span className="display-type"># {typeDisplay}</span> {file.relativePath}
      </header>
      <br />
      <code>
        { file.content.split(/[\r\n]/g).map(line => <>{line}<br /></>) }
      </code>
    </div>
  })

  return (
    <main className="main">
      <div>
        <textarea value={code} onChange={(event) => setCode(event.target.value) }></textarea>
      </div>
      { errorDiv }
      <div>
        <br />
        {result}
      </div>
    </main>
  )
}

export function getStaticProps() {
  return {
    props: {}
  }
}