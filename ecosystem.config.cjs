module.exports = {
  apps: [{
    name: "push",
    script: "./dist/serve.js",
    interpreter: "node",
    interpreter_args: "--env-file=.env",
    env: {
      NODE_ENV: "production"
    },
  }]
};