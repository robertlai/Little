const SEPARATOR_LENGTH = 75

const logger = {
  log: text => {
    console.log(`> ${text}`)
  },
  error: err => {
    logger.block([`Error: ${err.message || err}`])
  },
  block: arr => {
    logger.separator()
    arr.forEach(text => {
      console.log(text)
    })
    logger.separator()
  },
  separator: () => {
    console.log(Array(SEPARATOR_LENGTH + 1).join('='))
  }
}

export default logger
