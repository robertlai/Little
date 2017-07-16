import 'babel-polyfill'
import Discord from 'discord.js'
import config from '../config.conf'
import data from './data'
import logger from './logger'
import messageHandler from './messageHandler'

export const client = new Discord.Client()

client.on('ready', () => {
  logger.log('Logged in.')
  logger.block([
    `User: ${client.user.tag}(${client.user.id})`,
    `Time: ${new Date()}`
  ])
  data.loadData(() => {
    logger.log('Little is ready.')
    if (data.game) {
      client.user.setPresence({
        game: { name: data.game }
      })
    }
  })
})

client.on('message', messageHandler)

logger.log('Initializing Little...')
client.login(config.token)
