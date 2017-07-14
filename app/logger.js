const SEPARATOR_LENGTH = 75

const logger = {
  log: text => {
    console.log(`> ${text}`)
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
