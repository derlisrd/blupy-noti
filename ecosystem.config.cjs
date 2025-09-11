module.exports = {
  apps: [{
    name: "push",
    script: "./dist/serve.js",
    interpreter: "node",
    instances: 2, 
    interpreter_args: "--env-file=.env",
    env: {
      NODE_ENV: "production"
    },
  }]
};