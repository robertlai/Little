import fs from 'fs'
import logger from './logger'

const DATA_FILE_NAME = 'data.json'
const BACKUP_DIR = 'backup/'

var writeLock = 0

const data = {
  admin: {},
  ignored: {},
  publicData: {},
  userCommands: {},
  channelCommands: {},
  serverCommands: {},
  globalCommands: {},
  commandNameScopes: {},

  addCommand(props) {
    this.commandNameScopes[props.name] = {
      scope: props.scope,
      scopeId: props.scopeId
    }
    if (!this[`${props.scope}Commands`][props.scopeId]) {
      this[`${props.scope}Commands`][props.scopeId] = {
        string: {},
        regex: []
      }
    }
    if (props.matchType === 'regex') {
      this[`${props.scope}Commands`][props.scopeId].regex.push(props)
    } else {
      this[`${props.scope}Commands`][props.scopeId].string[props.input] = props
    }
    this.writeData()
  },

  get(path) {
    const keys = path.split('.')
    return keys.reduce((acc, cur) => acc[cur], this.publicData)
  },

  set(path, value) {
    const keys = path.split('.')
    const endKey = keys.pop()
    const obj = keys.reduce((acc, cur) => acc[cur], this.publicData)
    obj[endKey] = value
    this.writeData()
  },

  delete(path) {
    const keys = path.split('.')
    const endKey = keys.pop()
    const obj = keys.reduce((acc, cur) => acc[cur], this.publicData)
    delete obj[endKey]
    this.writeData()
  },

  loadData(callback) {
    logger.log('Loading data...')
    fs.readFile(DATA_FILE_NAME, (err, fileContent) => {
      if (err) {
        logger.log('Failed to load data.')
        logger.error(err)
      } else {
        try {
          const fileData = JSON.parse(fileContent)
          Object.apply(this, fileData)
          logger.log('Successfully loaded data.')
          data.writeBackup()
        } catch (err) {
          logger.log('Failed to parse data file.')
          logger.error(err)
        }
      }
      callback()
    })
  },

  writeData() {
    if (writeLock) {
      logger.log('File is locked.')
    } else {
      logger.log('Writing data...')
      try {
        const fileContent = JSON.stringify(this)
        writeLock++
        fs.writeFile(DATA_FILE_NAME, fileContent, err => {
          if (err) {
            logger.log('Failed to write data.')
            logger.error(err)
          } else {
            logger.log('Successfully wrote data.')
          }
          writeLock--
        })
      } catch (err) {
        logger.log('Failed to serialize data.')
        logger.error(err)
      }
    }
  },

  createBackupDir(callback) {
    fs.mkdir(BACKUP_DIR, err => {
      if (err && err.code !== 'EEXIST') {
        logger.log('Failed to create backup directory.')
        logger.error(err)
        callback(false)
      } else {
        callback(true)
      }
    })
  },

  writeBackup() {
    this.createBackupDir(success => {
      logger.log('Writing backup file...')
      const filePath = `${success ? BACKUP_DIR : ''}backup-${Date.now()}.json`
      fs.writeFile(filePath, JSON.stringify(this), err => {
        if (err) {
          logger.log('Failed to write backup file.')
          logger.error(err)
        } else {
          logger.log('Successfully wrote backup file.')
        }
      })
    })
  }
}

export default data
