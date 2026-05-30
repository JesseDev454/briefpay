import { AppDataSource } from "./database/data-source";
import { createApp } from "./app";
import { env } from "./config/env";

AppDataSource.initialize()
  .then(() => createApp().listen(env.PORT, () => console.log(`BriefPay API listening on http://localhost:${env.PORT}/api/v1`)))
  .catch((error: unknown) => {
    console.error("Could not start API", error);
    process.exit(1);
  });
