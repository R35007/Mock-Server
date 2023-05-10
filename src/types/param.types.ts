import type MockServer from '..';
import type * as UserTypes from './user.types';

export type Config = string | UserTypes.Config | ((mockServer?: MockServer) => UserTypes.Config);
export type Db = string | UserTypes.Db | ((mockServer?: MockServer) => UserTypes.Db);
export type Middlewares = string | UserTypes.Middlewares | ((mockServer?: MockServer) => UserTypes.Middlewares);
export type Injectors = string | UserTypes.Injectors | ((mockServer?: MockServer) => UserTypes.Injectors);
export type Rewriters = string | UserTypes.Rewriters | ((mockServer?: MockServer) => UserTypes.Rewriters);
export type Store = string | UserTypes.Store | ((mockServer?: MockServer) => UserTypes.Store);
