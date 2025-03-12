export default {
    body: {
      type: "object",
      required: ["tokens", "title", "body", "type"], // "token" -> "tokens"
      properties: {
        tokens: { 
          type: "array", 
          items: { type: "string" }, // Asegura que cada token sea un string
          minItems: 1, // Debe haber al menos un token
          maxItems: 100 // Opcionalmente, puedes limitar la cantidad máxima de tokens
        },
        title: { type: "string", minLength: 1 },
        body: { type: "string", minLength: 1 },
        type: { type: "string", enum: ["ios", "android"] }
      }
    }
  };