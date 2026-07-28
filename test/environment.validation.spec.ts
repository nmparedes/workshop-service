import "reflect-metadata";
import { validateEnvironment } from "../src/common/config/environment.validation";

describe("validateEnvironment", () => {
  it("uses safe defaults for optional values", () => {
    const config = validateEnvironment({});

    expect(config.NODE_ENV).toBe("development");
    expect(config.PORT).toBe(3000);
    expect(config.SERVICE_NAME).toBe("workshop-service");
    expect(config.SERVICE_VERSION).toBe("0.1.0");
    expect(config.LOG_FORMAT).toBe("json");
    expect(config.JWT_ISSUER).toBe("fiap-tech-challenge-auth-function");
    expect(config.JWT_AUDIENCE).toBe("fiap-tech-challenge-api");
    expect(config.DB_HOST).toBe("localhost");
    expect(config.DB_PORT).toBe(3306);
    expect(config.DB_USERNAME).toBe("workshop_service");
    expect(config.DB_DATABASE).toBe("workshop_service");
    expect(config.DB_SSL).toBe(false);
    expect(config.METRICS_ENABLED).toBe(true);
    expect(config.CONSUMED_MESSAGE_LEASE_MS).toBe(300000);
  });

  it("accepts explicit service settings", () => {
    const config = validateEnvironment({
      NODE_ENV: "test",
      PORT: "4000",
      SERVICE_NAME: "workshop-service",
      SERVICE_VERSION: "1.2.3",
      LOG_LEVEL: "debug",
      JWT_SECRET: "test-secret",
      JWT_ISSUER: "issuer",
      JWT_AUDIENCE: "audience",
      DB_HOST: "db.local",
      DB_PORT: "3307",
      DB_USERNAME: "service_user",
      DB_PASSWORD: "service_password",
      DB_DATABASE: "service_db",
      DB_SSL: "true",
      METRICS_ENABLED: "false",
    });

    expect(config.NODE_ENV).toBe("test");
    expect(config.PORT).toBe(4000);
    expect(config.SERVICE_NAME).toBe("workshop-service");
    expect(config.SERVICE_VERSION).toBe("1.2.3");
    expect(config.LOG_LEVEL).toBe("debug");
    expect(config.JWT_SECRET).toBe("test-secret");
    expect(config.JWT_ISSUER).toBe("issuer");
    expect(config.JWT_AUDIENCE).toBe("audience");
    expect(config.DB_HOST).toBe("db.local");
    expect(config.DB_PORT).toBe(3307);
    expect(config.DB_USERNAME).toBe("service_user");
    expect(config.DB_PASSWORD).toBe("service_password");
    expect(config.DB_DATABASE).toBe("service_db");
    expect(config.DB_SSL).toBe(true);
    expect(config.METRICS_ENABLED).toBe(false);
  });

  it("accepts boolean feature toggles from runtime values", () => {
    const config = validateEnvironment({
      DB_SSL: true,
      METRICS_ENABLED: true,
    });

    expect(config.DB_SSL).toBe(true);
    expect(config.METRICS_ENABLED).toBe(true);
  });

  it("rejects invalid environment values", () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: "invalid",
        PORT: "0",
        DB_PORT: "70000",
        LOG_FORMAT: "plain",
      }),
    ).toThrow();
  });

  it("requires a RabbitMQ URL only when messaging is enabled", () => {
    expect(() => validateEnvironment({ MESSAGING_ENABLED: "true" })).toThrow(
      "RABBITMQ_URL is required",
    );

    expect(
      validateEnvironment({
        MESSAGING_ENABLED: "true",
        RABBITMQ_URL: "amqp://placeholder",
        RABBITMQ_MAX_RETRIES: "2",
      }),
    ).toMatchObject({ MESSAGING_ENABLED: true, RABBITMQ_MAX_RETRIES: 2 });
  });

  it("requires a lease long enough for normal processing", () => {
    expect(() =>
      validateEnvironment({ CONSUMED_MESSAGE_LEASE_MS: "1000" }),
    ).toThrow();
  });
});
