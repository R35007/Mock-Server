
import { shouldGetValidConfig } from './getValidConfig';
import { shouldGetValidDb } from './getValidDb';
import { shouldGetValidInjectors } from './getValidInjectors';
import { shouldGetValidMiddleware } from './getValidMiddleware';
import { shouldGetValidRewriters } from './getValidRewriters';
import { shouldGetValidStore } from './getValidStore';

describe("Validators", () => {
  shouldGetValidConfig(); // return valid Config
  shouldGetValidInjectors(); // return valid Injectors
  shouldGetValidMiddleware(); // return valid Middlewares
  shouldGetValidStore(); // return valid Store
  shouldGetValidRewriters(); // return valid rewriters
  shouldGetValidDb(); // return valid db
})