import data from '../data'
import roles from '../roles'
import logger from '../logger'

export default function publicCommands(message) {
  if (roles.isIgnored(message.author.id)) {
    logger.log('Message author is ignored.')
    return
  }
  try {
    const commands = data.matchCommands(message)
    if (commands.length) {
      logger.log('Executing public commands...')
      logger.block([
        `Commands: ${commands.map(command => command.name)}`
      ])
      commands.forEach(command => {
        message.channel.send(command.output)
      })
    }
  } catch (err) {
    logger.log('Public commands matching failed.')
    logger.error(err)
  }
}
