import { client } from '../little'
import roles from '../roles'
import logger from '../logger'
import data from '../data'

const flagRegex = /^(-[^\s]+)/
const argRegex = /^(?:"((?:[^"]|\")+)"|([^\s]+))/

const DEFAULT_COMMAND_PROPS = {
  matchType: 'string',
  scope: 'server'
}

export default function adminCommands(message) {
  let handler = null

  if (/^lol add /.test(message.content)) {
    logger.log('Received "add" command.')
    handler = addCommand
  } else if (/^lol remove /.test(message.content)) {
    logger.log('Received "remove" command.')
    handler = removeCommand
  } else if (/^lol update /.test(message.content)) {
    logger.log('Received "update" command.')
    handler = updateCommand
  } else if (/^lol find /.test(message.content)) {
    logger.log('Received "find" command.')
    handler = findCommand
  } else if (/^lol print /.test(message.content)) {
    logger.log('Received "print" command.')
    handler = printCommand
  }

  if (handler) {
    try {
      if (!roles.isAdmin(message.author.id)) {
        throw 'User is not authorized to use this command.'
      }
      handler(message)
    } catch (err) {
      logger.log('Command failed.')
      logger.error(err)
      message.channel.send('lol nope')
    }
  }
}

function addCommand(message) {
  const props = { ...DEFAULT_COMMAND_PROPS }
  let input = message.content.slice('lol add '.length).trim()

  while (input.length) {
    const flagResult = input.match(flagRegex)
    const flag = flagResult && flagResult[1]

    if (flag) {
      input = applyFlag(props, flag, input)
    } else {
      const argResult = input.match(argRegex)
      if (!argResult) throw 'Invalid match or response.'

      if (!props.input) {
        props.input = argResult[1] || argResult[2]
        input = input.slice(props.input.length)
      } else if (!props.output) {
        props.output = argResult[1] || input
        input = input.slice(props.output.length)
      } else {
        throw 'Invalid command creation string.'
      }
    }
    input = input.trim()
  }

  props.name = resolveName(props)
  props.scopeId = resolveScopeId(props, message)
  data.addCommand(props)

  logger.log('Added command.')
  logger.block([
    `Added by: ${message.author.tag}(${message.author.id})`,
    `Name: ${props.name}`,
    `Scope: ${props.scope}`,
    `Scope ID: ${props.scopeId}`,
    `Match type: ${props.matchType}`,
    `Input: ${props.input}`,
    `Output: ${props.output}`
  ])
}

function applyFlag(commandProps, flag, input) {
  input = input.slice(flag.length).trim()

  switch (flag) {
    case '-c':
    case '--channel': {
      commandProps.scope = 'channel'
      break
    }

    case '-f':
    case '--flags': {
      const result = input.match(argRegex)
      if (!result) throw 'Invalid parameter.'
      commandProps.flags = result[1] || result[2]
      input = input.replace(argRegex, '')
      break
    }

    case '-g':
    case '--global': {
      commandProps.scope = 'global'
      break
    }

    case '-j':
    case '--json': {
      const props = JSON.parse(input)
      Object.assign(commandProps, props)
      input = ''
      break
    }

    case '-n':
    case '--name': {
      const result = input.match(argRegex)
      if (!result) throw 'Invalid parameter.'
      commandProps.name = result[1] || result[2]
      input = input.replace(argRegex, '')
      break
    }

    case '-u':
    case '--user': {
      commandProps.scope = 'user'
      break
    }

    case '-x':
    case '--regex': {
      commandProps.matchType = 'regex'
      break
    }

    default: {
      throw 'Invalid flag.'
    }
  }

  return input
}

const SCOPE_MAP = {
  user: 'author',
  channel: 'channel',
  server: 'guild'
}

function resolveScopeId(commandProps, message) {
  if (commandProps.scope === 'global') {
    return 'all'
  }
  return commandProps.scopeId || message[SCOPE_MAP[commandProps.scope]].id
}

function resolveName(commandProps) {
  return commandProps.name || commandProps.input
}
