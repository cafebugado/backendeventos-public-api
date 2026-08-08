export interface AppConfig {
  port: number;
  corsOrigins: string[];
}

export interface RootConfig {
  app: AppConfig;
}

export default (): RootConfig => ({
  app: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    corsOrigins: (process.env.CORS_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  },
});
