module.exports = [
  {
    routes: "/(.*)",
    delay: 2000,
  },
  {
    routes: ["/posts", "/comments"],
    statusCode: 500,
    override: true
  },
]