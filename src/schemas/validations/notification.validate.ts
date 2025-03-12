export default {
    body: {
      type: "object",
      required: ["token", "title", "body"],
      properties: {
        token: { type: "string", minLength: 1 },
        body: { type: "string", minLength: 1 },
        title: { type: "string", minLength: 1 }
      }
    }
  };