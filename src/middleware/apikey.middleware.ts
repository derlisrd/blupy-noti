import fastify from "fastify";

export async function apikeymiddleware(req: fastify.FastifyRequest, res: fastify.FastifyReply) {
  const apikey = req.headers['x-api-key'];
  if (!apikey) {
    return res.status(401).send({
      success: false,
      message: 'Unauthorized api key',
    });
  }
  const apikey_config = process.env.API_KEY;
  if (apikey !== apikey_config) {
    return res.status(401).send({
      success: false,
      message: 'Unauthorized api key',
    });
  }
}