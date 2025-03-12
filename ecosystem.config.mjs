module.exports = {
    apps : [
        {
          name: "myapp",
          script: "./dist/serve.js",
          watch: true,
          env: {
              "NODE_ENV": "production"
          },
        }
    ]
  }