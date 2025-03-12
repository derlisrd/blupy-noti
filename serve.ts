

import Fastify from 'fastify'
import { fastifyCors } from '@fastify/cors';
import  api  from './src/routes/api.js';
import config from './src/app/config.js';
import { apikeymiddleware } from './src/middleware/apikey.middleware.js';




const app = Fastify({
  logger: true,
})

app.register(fastifyCors, { origin: '*' })
app.addHook('preHandler', apikeymiddleware)
app.register(api, {prefix: '/api'})

app.setErrorHandler((error, _request, reply) => {
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      message: error.message
    });
  }
  reply.status(500).send({ success: false, message: error.message });
})

const start = async () => {
  try {
    await app.listen({ port: (config.PORT), host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}
start()