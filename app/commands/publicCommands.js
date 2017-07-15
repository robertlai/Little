import data from '../data'
import logger from '../logger'

export default function publicCommands(message) {
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
}
