const broadcast = require("../broadcast.config.json")
const net = require("net")

const express = require("express")
const bodyParser = require("body-parser")

const app = express()
app.use(bodyParser.json())

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
// 特定のオリジンからのリクエストを許可
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS") // 許可するHTTPメソッドを指定
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
})

//外部通信用
const server = (callback) => {
  const io = net.createServer((socket) => {
    console.log("Client connected: " + socket.remoteAddress)

    socket.on("data", (data) => {
      callback(socket, data)
    })

    socket.on("end", () => {
      console.log("Client disconnected")
    })
  })

  io.listen(broadcast.OpenPort, () => {
    console.log("外部アクセスサーバーをポート" + broadcast.OpenPort + "で起動。")
  })
}

//クライアントとして外部接続用
const client = (ip, callback, onData) => {
  const io = net.createConnection({ port: 25565, host: ip }, () => {
    // 'connect' listener.
    console.log("サーバーとの接続ができました。")
    io.write("Hello, server!\r\n")
    callback(io)
  })

  io.on("data", (data) => {
    console.log(data.toString())
    onData(io, data)
  })

  io.on("end", () => {
    console.log("サーバーから通信が切られました。")
  })
}

//Vueと通信
const api = (apis) => {
  app.post("*", function (req, res) {
    const handler = apis[req.path]
    if (handler) {
      handler(req, res)
    } else {
      res.status(404).send("関数がありません。")
    }
  })

  app.listen(3000, function () {
    console.log("内部API用サーバーをポート" + 3000+ "で起動。")
  })
}

module.exports = {
  //定義名:値,
  server: server,
  client: client,
  api: api,
}
