

import express from "express";
import routeApi from "./src/routes/api.js";
import config from './src/app/config.js';


const app = express();


app.use(express.json());

app.use('/api',routeApi)

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`Server running http://localhost:${PORT}`);
});


/* const app = Fastify({
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
start() */