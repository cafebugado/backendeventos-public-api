export interface AppConfig {
  port: number;
  corsOrigins: string[];
  swaggerUser?: string;
  swaggerPassword?: string;
}

export interface RootConfig {
  app: AppConfig;
}

export default (): RootConfig => ({
  app: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    // Remove barra final: o header `Origin` enviado pelo navegador nunca tem
    // trailing slash, então "https://x.com/" na env var nunca bateria com o
    // "https://x.com" real — causa já confirmada de origens configuradas que
    // pareciam certas mas eram silenciosamente bloqueadas pelo CORS.
    corsOrigins: (process.env.CORS_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim().replace(/\/+$/, ''))
      .filter(Boolean),
    swaggerUser: process.env.SWAGGER_USER,
    swaggerPassword: process.env.SWAGGER_PASSWORD,
  },
});
