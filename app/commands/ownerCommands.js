import { client } from '../little'
import roles from '../roles'
import logger from '../logger'
import data from '../data'

const PERMISSIONS = 67558464 // 0x0406DC40

export default function ownerCommands(message) {
  let handler = null

  if (/^lol playing /.test(message.content)) {
    logger.log('Received "playing" command.')
    handler = setGame
  } else if (/^lol listen /.test(message.content)) {
    logger.log('Received "listen" command.')
    handler = addAdmin
  } else if (/^lol unlisten /.test(message.content)) {
    logger.log('Received "unlisten" command.')
    handler = removeAdmin
  } else if (/^lol admin$/.test(message.content)) {
    logger.log('Received "admin" command.')
    handler = listAdmin
  } else if (/^lol ignore /.test(message.content)) {
    logger.log('Received "ignore" command.')
    handler = addIgnored
  } else if (/^lol unignore /.test(message.content)) {
    logger.log('Received "unignore" command.')
    handler = removeIgnored
  } else if (/^lol ignored$/.test(message.content)) {
    logger.log('Received "ignored" command.')
    handler = listIgnored
  } else if (/^lol invite$/.test(message.content)) {
    logger.log('Received "invite" command.')
    handler = sendInvite
  }

  if (handler) {
    try {
      if (!roles.isOwner(message.author.id)) {
        throw 'User is not authorized to use this command.'
      }
      handler(message)
    } catch (error) {
      logger.log('Command failed.')
      logger.block([
        `Error: ${error}`
      ])
    }
  }
}

function setGame(message) {
  const game = message.content.match(/^lol playing (.+)$/)[1]
  client.user.setPresence({
    game: { name: game }
  }).then(user => {
    logger.log('Game has been set.')
    logger.block([
      `Game: ${user.presence.game.name}`
    ])
    message.channel.send('lol ok')
  })
}

function addAdmin(message) {
  const userIds = getMentionedUserIds(message)
  userIds.forEach(userId => {
    data.admin[userId] = true
  })
  logger.log('Added admin users.')
  logger.block([
    'Users:',
    ...userIds.map(userId =>
      `  ${client.users.get(userId).tag}(${userId})`
    )
  ])
  message.channel.send('lol ok')
}

function removeAdmin(message) {
  const userIds = getMentionedUserIds(message)
  userIds.forEach(userId => {
    data.admin[userId] = false
  })
  logger.log('Removed admin users.')
  logger.block([
    'Users:',
    ...userIds.map(userId =>
      `  ${client.users.get(userId).tag}(${userId})`
    )
  ])
  message.channel.send('lol ok')
}

function listAdmin(message) {
  const users = Object.keys(data.admin).reduce((acc, cur) => {
    if (data.admin[cur]) {
      return acc.concat(`${client.users.get(cur).tag}(${cur})`)
    }
    return acc
  }, [])
  if (users.length === 0) {
    message.channel.send('**No admin users found.**').then(() => {
      logger.log('No admin users found.')
    })
  } else {
    message.channel.send(`**Admin users:**\n${users.join('\n')}`).then(() => {
      logger.log('Sent admin user list.')
    })
  }
}

function addIgnored(message) {
  const userIds = getMentionedUserIds(message)
  userIds.forEach(userId => {
    data.ignored[userId] = true
  })
  logger.log('Added ignored users.')
  logger.block([
    'Users:',
    ...userIds.map(userId =>
      `  ${client.users.get(userId).tag}(${userId})`
    )
  ])
  message.channel.send('lol ok')
}

function removeIgnored(message) {
  const userIds = getMentionedUserIds(message)
  userIds.forEach(userId => {
    data.ignored[userId] = false
  })
  logger.log('Removed ignored users.')
  logger.block([
    'Users:',
    ...userIds.map(userId =>
      `  ${client.users.get(userId).tag}(${userId})`
    )
  ])
  message.channel.send('lol ok')
}

function listIgnored(message) {
  const users = Object.keys(data.ignored).reduce((acc, cur) => {
    if (data.ignored[cur]) {
      return acc.concat(`${client.users.get(cur).tag}(${cur})`)
    }
    return acc
  }, [])
  if (users.length === 0) {
    message.channel.send('**No ignored users found.**').then(() => {
      logger.log('No ignored users found.')
    })
  } else {
    message.channel.send(`**Admin users:**\n${users.join('\n')}`).then(() => {
      logger.log('Sent ignored user list.')
    })
  }
}

function sendInvite(message) {
  client.generateInvite(PERMISSIONS).then(url =>
    message.channel.send(url)
  ).then(() => {
    logger.log('Sent invite link.')
    logger.block([
      `Client ID: ${client.user.id}`,
      `Permissions: ${PERMISSIONS}`
    ])
  })
}

function getMentionedUserIds(message) {
  let userIds = message.mentions.users.map(user => user.id)
  return userIds.concat(message.mentions.roles.map(role =>
    role.members.map(member => member.user.id)
  ))
}
