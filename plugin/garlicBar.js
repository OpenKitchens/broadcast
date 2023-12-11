module.exports = {
  "/renderGarlic": (req, res) => {
    const data = req.body
    console.log(data)
    res.send(
      JSON.stringify([
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
      ])
    )
  }
}
