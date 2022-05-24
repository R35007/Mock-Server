
import { config } from './config';
import { routeConfig } from './routeConfig';

describe("Validators", () => {
  config(); // Testing all config
  routeConfig(); // Testing all route Configs
  // defaultMiddlewares(); // Testing all Default Middlewares
})