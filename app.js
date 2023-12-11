const Database = require("./database/database.js")
const plugins = require("./plugin/plugin.json").plugins
const { server, client, api } = require("./net/net.js")


//外部通信(サーバー)
const moduleServer = () => {
  server((socket, data) => {
    console.log("Received: " + data)
    socket.write("Hello, client!")
  })
}

//外部通信(クライアント)
/*client(
  "アクセスするIPアドレス",
  (socket) => {
    //送信したりするとき
  },
  (socket, data) => {
    //データ受信時
  }
)*/

//内部通信(API)
const moduleAPI = () => {
  //コマンドライン
  const commandAPI = {
    "/connectNode": (req, res) => {
      const data = req.body
      console.log(data.node)
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