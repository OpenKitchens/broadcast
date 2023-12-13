const crypto = require("crypto")

const Database = require("./database/database.js")
const plugins = require("./plugin/plugin.json").plugins
const { server, client, api } = require("./net/net.js")

//外部通信(サーバー)
const moduleServer = () => {
  server({
    "/signup": (socket, data) => {
      const myDatabase = new Database()
      console.log("要求をしてきたIP:" + socket.remoteAddress)

      const friendNode = {
        friendIP: socket.remoteAddress, //友達のIP
        friendHash: crypto
          .createHash("sha256")
          .update(socket.remoteAddress)
          .digest("hex"), //友達のIPをhash化
        friendTrurh: 1, //友達の信用度
      }

      const keys = Object.keys(myDatabase.database)
      const lastKey = keys.length > 0 ? keys[keys.length - 1] : 0
      myDatabase.addToDatabase(String(Number(lastKey) + 1), friendNode)

      socket.write(
        JSON.stringify({
          ip: socket.remoteAddress,
          truth: myDatabase.database["1"].myTruth,
        })
      )

      myDatabase.database["1"].myTruth =
        Number(myDatabase.database["1"].myTruth) + 1
      myDatabase.saveDatabase()
    },
  })
}

//内部通信(API)
const moduleAPI = () => {
  //コマンドライン
  const commandAPI = {
    "/signup": (req, res) => {
      const dataAPI = req.body
      console.log("接続先IP: " + dataAPI.ip)
      client(
        dataAPI.ip,
        (socket) => {
          socket.write(JSON.stringify({ api: "/signup" }))
        },
        (socket, data) => {
          const myNode = {
            myIP: data.ip, //自分のIP
            myTruth: 1, //自分の信用度
          }

          const friendNode = {
            friendIP: dataAPI.ip, //友達のIP
            friendHash: crypto
              .createHash("sha256")
              .update(dataAPI.ip)
              .digest("hex"), //友達のIPをhash化
            friendTrurh: data.truth + 1, //友達の信用度
          }

          const myDatabase = new Database()

          // 新しいデータを追加する
          myDatabase.addToDatabase("1", myNode)
          myDatabase.addToDatabase("2", friendNode)
        }
      )
    },
  }

  //拡張機能を読み込み
  var pluginModule = {}
  plugins.forEach(function (plugin) {
    Object.assign(pluginModule, require(plugin["require-path"]))
  })

  //拡張機能とコマンドラインをマージ
  Object.assign(commandAPI, pluginModule)
  api(commandAPI)
}

const main = () => {
  moduleServer()
  moduleAPI()
}

// Databaseクラスのインスタンスを作成
//const myDatabase = new Database()

// データの追加
//myDatabase.addToDatabase("1", { name: "John", age: 30 })
//myDatabase.addToDatabase("2", { name: "Jane", age: 25 })

main()
