import "dotenv/config";

export default {
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://hyperpush:hyperpush123@localhost:5432/hyperpush",
  },
};
