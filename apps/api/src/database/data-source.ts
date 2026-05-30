import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "../config/env";
import { entities } from "./entities";
import { InitialSchema1710000000000 } from "./migrations/1710000000000-InitialSchema";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: env.DATABASE_URL,
  entities,
  migrations: [InitialSchema1710000000000],
  synchronize: false,
  logging: env.NODE_ENV === "development",
});
