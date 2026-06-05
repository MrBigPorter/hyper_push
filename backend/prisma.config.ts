import "dotenv/config";

export default {
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://hyperpush:CHANGE_ME@localhost:5432/hyperpush",
  },
};
