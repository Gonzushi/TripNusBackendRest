const fastifyConfig = {
  ajv: {
    customOptions: {
      strict: false,
      removeAdditional: false,
    },
  },
  logger: {
    level: "error",
  },
};

export default fastifyConfig;
