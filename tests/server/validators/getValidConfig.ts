
import path from "path";
import * as Defaults from "../../../src/server/defaults";
import * as ParamTypes from "../../../src/server/types/param.types";
import { getValidConfig } from '../../../src/server/utils/validators';
import { invalidInputChecks } from '../Helpers';

export const shouldGetValidConfig = () => {
  describe('getValidConfig() : ', () => {

    describe('should return Default Config on invalid input', () => {
      test.each(invalidInputChecks(Defaults.Config))('If %s is passed', (_condition, input, expected) => {
        const config = getValidConfig(input as ParamTypes.Config);
        expect(config).toEqual(expected);
      });
    });

    describe('should return custom Config from a valid Path string', () => {

      const jsFile = require("../../mock/config/config.js");
      const jsonFile = require("../../mock/config/config.json");

      test.each([
        ["valid .js file", "./config.js", jsFile],
        ["valid .json file", "./config.json", jsonFile],
        ["valid folder", "./", { ...jsFile, ...jsonFile }],
      ])('If %s path is passed', (_condition, configPath, expected) => {
        const config = getValidConfig(configPath as string, path.join(__dirname, "../../mock/config"));
        const expectedConfig = { ...Defaults.Config, ...expected };
        expect(config).toEqual(expectedConfig);
      });
    });

    describe('should return a valid Config', () => {
      test.each([
        ["root path is not a directory", { root: path.join(__dirname, "../../mock/config/config.json") }, {}],
        ["root path is a directory", { root: path.join(__dirname, "../../mock") }, { root: path.join(__dirname, "../../mock") }],
        ["port is not a number", { port: "" }, {}],
        ["port is a number string", { port: "4000" }, { port: 4000 }],
        ["port is a number", { port: 4000 }, { port: 4000 }],
        ["base is empty string", { base: "" }, {}],
        ["base is '/' ", { base: "/" }, {}],
        ["base is '/api' ", { base: "/api" }, { base: "/api" }],
        ["staticDir is not a valid path", { root: path.join(__dirname, "../../mock"), staticDir: "/mock" }, { root: path.join(__dirname, "../../mock"), staticDir:"C:\\mock" }],
        ["staticDir is a valid path", { root: path.join(__dirname, "../../mock"), staticDir: "../../public" }, { root: path.join(__dirname, "../../mock"), staticDir: path.join(__dirname, "../../mock", "../../public") }],
        ["host is a empty string", { host: "" }, {}],
        ["host is not a string", { host: 129 }, {}],
        ["host is a string", { host: "localhost" }, { host: "localhost" }],
      ])('If %s', (_condition, input, expected) => {
        const config = getValidConfig(input as ParamTypes.Config);
        const expectedConfig = { ...Defaults.Config, ...expected };
        expect(config).toEqual(expectedConfig);
      });
    });
  });
}