const Database = require("./database/database.js")
const { server, client, api } = require("./net/net.js")

//外部通信(サーバー)
server((socket, data) => {
  console.log("Received: " + data)
  socket.write("Hello, client!")
})

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

//内部通信
api({
  "/renderGarlic": (req, res) => {
    const data = req.body
    console.log(data)
    res.send(JSON.stringify([
      {
        emoji: "🚀",
        title: "Garlic Bar会議",
        user: "moyasi",
        time: "2023/11/14",
      },
      {
        emoji: "🚀",
        title: "Garlic Bar会議",
        user: "moyasi",
        time: "2023/11/14",
      },
    ]))
  },
})


// Databaseクラスのインスタンスを作成
//const myDatabase = new Database()

// データの追加
//myDatabase.addToDatabase("1", { name: "John", age: 30 })
//myDatabase.addToDatabase("2", { name: "Jane", age: 25 })