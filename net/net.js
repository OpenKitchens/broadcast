const broadcast = require("../broadcast.config.json")
const net = require("net")

const express = require("express")
const bodyParser = require("body-parser")

const app = express()
app.use(bodyParser.json())

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  // 特定のオリジンからのリクエストを許可
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS") // 許可するHTTPメソッドを指定
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  )
  next()
})

//外部通信用
const server = (serverAPIs) => {
  const io = net.createServer((socket) => {
    console.log("Client connected: " + socket.remoteAddress)

    socket.on("data", (data) => {
      data = JSON.parse(data)
      console.log("serverAPI: " + data.api)
      const handler = serverAPIs[data.api]
      if (handler) {
        handler(socket, data)
      } else {
        socket.write("関数がありません。")
        console.log("エラー 関数がありません。")
      }

      console.log("Received: " + data)
    })

    socket.on("end", () => {
      console.log("Client disconnected")
    })
  })

  io.listen(broadcast.OpenPort, () => {
    console.log(
      "外部アクセスサーバーをポート" + broadcast.OpenPort + "で起動。"
    )
  })
}

//クライアントとして外部接続用
const client = (ip, callback, onData) => {
  const io = net.createConnection({ port: 25565, host: ip }, () => {
    // 'connect' listener.
    console.log("サーバーとの接続ができました。")
    callback(io)
  })

  io.on("data", (data) => {
    console.log(data.toString())
    onData(io, JSON.parse(data))
  })

  io.on("end", () => {
    console.log("サーバーから通信が切られました。")
  })
}

//内部通信用
const api = (apis) => {
  app.post("*", function (req, res) {
    const handler = apis[req.path]
    console.log("API: " + req.path)
    if (handler) {
      handler(req, res)
    } else {
      res.status(404).send("関数がありません。")
      console.log("エラー 関数がありません。")
    }
  })

  app.listen(3000, function () {
    console.log("内部コマンドラインAPI用サーバーをポート" + 3000 + "で起動。")
  })
}

module.exports = {
  //定義名:値,
  server: server,
  client: client,
  api: api,
}
