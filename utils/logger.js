import pino from "pino";

const logger = pino(
  process.env.NODE_ENV === "development"
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
          },
        },
      }
    : { level: "info" },
);

export function createChildLogger(context = {}) {
  return logger.child(context);
}

export default logger;
