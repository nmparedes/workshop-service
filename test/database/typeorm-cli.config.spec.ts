describe("workshopServiceDataSource", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      DB_HOST: "mysql",
      DB_PORT: "3307",
      DB_USERNAME: "workshop_service",
      DB_PASSWORD: "local-password",
      DB_DATABASE: "workshop_service",
      DB_SSL: "true",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("configures the service-owned MySQL data source for workshop migrations", async () => {
    const { default: workshopServiceDataSource } =
      await import("../../src/database/typeorm-cli.config");

    expect(workshopServiceDataSource.options).toMatchObject({
      type: "mysql",
      host: "mysql",
      port: 3307,
      username: "workshop_service",
      password: "local-password",
      database: "workshop_service",
      synchronize: false,
      logging: false,
      ssl: { rejectUnauthorized: true },
    });
    expect(workshopServiceDataSource.options.entities).toHaveLength(6);
    expect(workshopServiceDataSource.options.migrations).toHaveLength(8);
  });

  it("uses safe local defaults when optional database settings are absent", async () => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      DB_PORT: "not-a-number",
    };
    delete process.env.DB_HOST;

    const { default: workshopServiceDataSource } =
      await import("../../src/database/typeorm-cli.config");

    expect(workshopServiceDataSource.options).toMatchObject({
      type: "mysql",
      host: "localhost",
      port: 3306,
      synchronize: false,
      logging: false,
      ssl: false,
    });
  });
});
