const data = {
  admin: {},
  ignored: {},
  public: {},
  get: path => {
    const keys = path.split('.')
    return keys.reduce((acc, cur) => acc[cur], data.public)
  },
  set: (path, value) => {
    const keys = path.split('.')
    const endKey = keys.pop()
    const obj = keys.reduce((acc, cur) => acc[cur], data.public)
    obj[endKey] = value
  }
}

export default data
