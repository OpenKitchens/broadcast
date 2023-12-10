const fs = require("fs")

class Database {
  constructor() {
    this.database = {}
    this.index = {}
    this.initializeDatabase()
  }

  saveDatabase() {
    const data = JSON.stringify(this.database)
    try {
      fs.writeFileSync("./database/database.json", data)
    } catch (err) {
      this.handleError(err)
    }
  }

  loadDatabase() {
    try {
      const data = fs.readFileSync("./database/database.json")
      this.database = JSON.parse(data)
      this.createIndexes()
    } catch (err) {
      this.handleError(err)
      this.database = {}
      this.index = {}
    }
  }

  createIndex(key) {
    this.index[key] = {}
    for (const id in this.database) {
      const value = this.database[id][key]
      if (!this.index[key][value]) {
        this.index[key][value] = []
      }
      this.index[key][value].push(id)
    }
  }

  createIndexes() {
    for (const id in this.database) {
      for (const key in this.database[id]) {
        if (!this.index[key]) {
          this.createIndex(key)
        }
        if (!this.index[key][this.database[id][key]]) {
          this.index[key][this.database[id][key]] = []
        }
        this.index[key][this.database[id][key]].push(id)
      }
    }
  }

  addToDatabase(id, data) {
    if (this.database[id]) {
      throw new Error("ID already exists.")
    }
    this.database[id] = data
    try {
      this.createIndexes()
      this.saveDatabase()
    } catch (err) {
      this.handleError(err)
    }
  }

  deleteFromDatabase(id) {
    if (this.database[id]) {
      delete this.database[id]
      try {
        this.createIndexes()
        this.saveDatabase()
      } catch (err) {
        this.handleError(err)
      }
      return true
    }
    return false
  }

  queryDataByCondition(key, value) {
    try {
      if (this.index[key] && this.index[key][value]) {
        const ids = this.index[key][value]
        return ids.map((id) => this.database[id])
      }
      return []
    } catch (err) {
      this.handleError(err)
      return []
    }
  }

  initializeDatabase() {
    this.loadDatabase()
  }

  handleError(error) {
    console.error("An error occurred:", error)

    // エラーをログに記録する
    const timestamp = new Date().toISOString()
    const logMessage = `${timestamp}: An error occurred - ${error.message}\n`

    fs.appendFileSync("./database/error.log", logMessage, "utf8")
  }
}

module.exports = Database
