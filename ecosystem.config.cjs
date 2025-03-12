module.exports = {
    apps : [
        {
          name: "push",
          script: "./dist/serve.js",
          watch: true,
          env: {
              "NODE_ENV": "production"
          },
        }
    ]
  }