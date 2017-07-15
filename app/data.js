import fs from 'fs'
import logger from './logger'

const DATA_FILE_NAME = 'data.json'
const BACKUP_DIR = 'backup/'

export const SCOPE_MAP = {
  user: 'author',
  channel: 'channel',
  server: 'guild'
}

var writeLock = 0

const data = {
  admin: {},
  ignored: {},
  publicData: {},
  userCommands: {},
  channelCommands: {},
  serverCommands: {},
  globalCommands: {},
  commandNameProps: {},

  addCommand(props) {
    if (this.commandNameProps[props.name]) {
      throw 'Command already exists.'
    }
    this.commandNameProps[props.name] = {
      matchType: props.matchType,
      scope: props.scope,
      scopeId: props.scopeId
    }
    if (!this[`${props.scope}Commands`][props.scopeId]) {
      this[`${props.scope}Commands`][props.scopeId] = {
        regex: {},
        string: {}
      }
    }
    if (props.matchType === 'regex') {
      this[`${props.scope}Commands`][props.scopeId].regex[props.name] = props
    } else {
      this[`${props.scope}Commands`][props.scopeId].string[props.input] = props
    }
    this.writeData()
  },

  removeCommand(name) {
    const props = this.commandNameProps[name]
    if (!props) throw 'Command does not exist.'
    if (props.matchType === 'regex') {
      delete this[`${props.scope}Commands`][props.scopeId].regex[props.name]
    } else {
      const key = Object.values(this[`${props.scope}Commands`][props.scopeId].string).find(
        command => command.name === name
      ).input
      delete this[`${props.scope}Commands`][props.scopeId].string[key]
    }
    delete this.commandNameProps[name]
    this.writeData()
  },

  updateCommand(name, output) {
    const props = this.commandNameProps[name]
    if (!props) throw 'Command does not exist.'
    if (props.matchType === 'regex') {
      this[`${props.scope}Commands`][props.scopeId].regex[props.name].output = output
    } else {
      const key = Object.values(this[`${props.scope}Commands`][props.scopeId].string).find(
        command => command.name === name
      ).input
      this[`${props.scope}Commands`][props.scopeId].string[key].output = output
    }
    this.writeData()
    return true
  },

  matchCommands(message, inputOverride=null) {
    const commands = []
    const input = inputOverride || message.content

    Object.keys(SCOPE_MAP).forEach(scope => {
      const commandSet = this[`${scope}Commands`][message[SCOPE_MAP[scope]].id]
      if (commandSet) {
        if (commandSet.string[input]) {
          commands.push(commandSet.string[input])
        }
        Object.values(commandSet.regex).forEach(command => {
          if (new RegExp(command.input, command.flags).test(input)) {
            commands.push(command)
          }
        })
      }
    })

    const globalCommandSet = this.globalCommands.all
    if (globalCommandSet) {
      if (globalCommandSet.string[message.content]) {
        commands.push(globalCommandSet.string[message.content])
      }
      Object.values(globalCommandSet.regex).forEach(command => {
        if (new RegExp(command.input, command.flags).test(message.content)) {
          commands.push(command)
        }
      })
    }

    return commands
  },

  fetchCommand(name) {
    const props = this.commandNameProps[name]
    if (!props) throw 'Command does not exist.'
    if (props.matchType === 'regex') {
      return this[`${props.scope}Commands`][props.scopeId].regex[name]
    } else {
      const key = Object.values(this[`${props.scope}Commands`][props.scopeId].string).find(
        command => command.name === name
      ).input
      return this[`${props.scope}Commands`][props.scopeId].string[key]
    }
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
          Object.assign(this, fileData)
          logger.log('Successfully loaded data.')
          this.writeBackup()
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
