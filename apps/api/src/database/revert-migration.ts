import { AppDataSource } from "./data-source";

AppDataSource.initialize()
  .then(async () => {
    await AppDataSource.undoLastMigration();
    console.log("Last migration reverted");
    await AppDataSource.destroy();
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
