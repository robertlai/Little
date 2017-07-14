import { client } from './little'
import {
  ownerCommands,
  adminCommands,
  publicCommands
} from './commands'
import logger from './logger'

export default function messageHandler(message) {
  if (message.author.id === client.user.id) {
    return
  }

  logger.log('Received message.')
  logger.block([
    `Author: ${message.author.tag}(${message.author.id})`,
    `Content: ${message.content}`,
    `Time: ${message.createdAt}`
  ])

  if (/^lol /.test(message.content)) {
    ownerCommands(message)
    adminCommands(message)
  }

  publicCommands(message)
}
