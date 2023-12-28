const crypto = require("crypto");

const Database = require("./database/database.js");
const plugins = require("./plugin/plugin.json").plugins;
const { server, client, api } = require("./net/net.js");

//外部通信(サーバー)
const moduleServer = () => {
  server({
    "/signupServer": (socket, data) => {
      const myDatabase = new Database();
      console.log("要求をしてきたIP:" + socket.remoteAddress);

      const friendNode = {
        friendHash: crypto
          .createHash("sha256")
          .update(socket.remoteAddress)
          .digest("hex"), //友達のIPをhash化
        friendTrurh: 1, //友達の信用度
        status: "HighLevelNode",
        intermediateIP: data.ip, //中継先のIPアドレス
      };

      const HighLevelNode = {
        friendIP: socket.remoteAddress, //友達のIP
        friendHash: crypto
          .createHash("sha256")
          .update(socket.remoteAddress)
          .digest("hex"),
      }

      myDatabase.addToDatabaseEnd(friendNode);
      myDatabase.addToDatabaseEnd(HighLevelNode);

      socket.write(
        JSON.stringify({
          ip: socket.remoteAddress,
          truth: myDatabase.database["1"].myTruth,
          friends: myDatabase.queryDataByCondition("status", "HighLevelNode")
        })
      );

      myDatabase.database["1"].myTruth =
        Number(myDatabase.database["1"].myTruth) + 1;
      myDatabase.saveDatabase();
    },
    "/intermediateNode": (socket, data) => {
      const friendNode = myDatabase.queryDataByCondition("friendHash", data.hash);
      socket.write({ friendIP: friendNode[0].friendIP});
    },
  });
};

//内部通信(API)
const moduleAPI = () => {
  //コマンドライン
  const commandAPI = {
    "/signup": (req, res) => {
      const dataAPI = req.body;
      console.log("接続先IP: " + dataAPI.ip);

      client(
        dataAPI.ip,
        (socket) => {
          socket.write(JSON.stringify({ api: "/signupServer", yourIP: dataAPI.ip }));
        },
        (socket, data) => {
          const myNode = {
            myIP: data.ip, //自分のIP
            myTruth: 1, //自分の信用度
          };

          const friendNode = {
            friendHash: crypto
              .createHash("sha256")
              .update(dataAPI.ip)
              .digest("hex"), //友達のIPをhash化
            friendTrurh: data.truth + 1, //友達の信用度
            status: "HighLevelNode",
            intermediateIP: data.ip
          };

          const HighLevelNode = {
            friendIP: dataAPI.ip, //友達のIP
            friendHash: crypto
              .createHash("sha256")
              .update(socket.remoteAddress)
              .digest("hex"),
          }

          const myDatabase = new Database();

          // 新しいデータを追加する
          myDatabase.addToDatabase("1", myNode);
          myDatabase.addToDatabase("2", friendNode);
          myDatabase.addToDatabase("3", HighLevelNode);

          for (const item of data.friends) {
            const id = item.id;
            const modifiedData = {
              friendHash: item.friendHash,
              friendTrurh: item.friendTrurh,
              status: item.status,
              intermediateIP: item.intermediateIP,
            };
            myDatabase.addToDatabase(id, modifiedData);
          }

          res.send(JSON.stringify({ status: "done" }));
        }
      );
    },
    "/connect": (req, res) => {
      const friendNode = database.queryDataByCondition("friendHash", req.hash);
      if(friendNode[0].status == "HighLevelNode"){
        client(friendNode[1].friendIP,
          (socket) => {
            socket.write(JSON.stringify({ api: req.api }));
          },
          (socket, data) => {
            res.send(JSON.stringify({data: data}))
          }
        )
      }else{
        client(friendNode[0].intermediateIP,
          (intermediateSocket) => {
            socket.write(JSON.stringify({ api: "/intermediateNode" }));
          },
          (intermediateSocket, intermediateData) => {
            client(intermediateData.friendIP,
              (socket) => {
                socket.write(JSON.stringify({ api: req.api }));
              },
              (socket, data) => {
                res.send(JSON.stringify({data: data}))
              }
            )
          }
        )
      }
    }
  };

  //拡張機能を読み込み
  var pluginModule = {};
  plugins.forEach(function (plugin) {
    Object.assign(pluginModule, require(plugin["require-path"]));
  });

  //拡張機能とコマンドラインをマージ
  Object.assign(commandAPI, pluginModule);
  api(commandAPI);
};

const main = () => {
  moduleServer();
  moduleAPI();
};

main();
