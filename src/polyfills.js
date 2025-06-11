import { Buffer } from 'buffer'
import process from 'process'

window.Buffer = Buffer
window.process = process

// Polyfill for require
window.require = function(module) {
  switch (module) {
    case 'stream':
      return require('stream-browserify')
    case 'crypto':
      return require('crypto-browserify')
    case 'util':
      return require('util')
    case 'buffer':
      return require('buffer')
    case 'process':
      return require('process/browser')
    case 'zlib':
      return require('browserify-zlib')
    case 'path':
      return require('path-browserify')
    default:
      throw new Error(`Module ${module} not found`)
  }
} 