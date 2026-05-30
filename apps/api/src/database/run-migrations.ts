import { AppDataSource } from "./data-source";

AppDataSource.initialize()
  .then(async () => {
    await AppDataSource.runMigrations();
    console.log("Migrations complete");
    await AppDataSource.destroy();
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
