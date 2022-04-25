
import { getValidConfig } from './getValidConfig';
import { getValidDb } from './getValidDb';
import { getValidInjectors } from './getValidInjectors';
import { getValidMiddleware } from './getValidMiddleware';
import { getValidRewriters } from './getValidRewriters';
import { getValidStore } from './getValidStore';

describe("Validators", () => {
  getValidConfig(); // return valid Config
  getValidInjectors(); // return valid Injectors
  getValidMiddleware(); // return valid Middlewares
  getValidStore(); // return valid Store
  getValidRewriters(); // return valid rewriters
  getValidDb(); // return valid db
})