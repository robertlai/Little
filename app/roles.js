import config from '../config.conf'
import data from './data'

function isOwner(userId) {
  return userId === config.ownerId
}

function isAdmin(userId) {
  return isOwner(userId) || data.admin[userId]
}

function addAdmin(userId) {
  data.admin[userId] = true
}

function removeAdmin(userId) {
  delete data.admin[userId]
}

module.exports = {
  isOwner,
  isAdmin,
  addAdmin,
  removeAdmin
}
