
import path from "path";
import Default_Config from "../../../src/server/config";
import { MockServer } from "../../../src/server/index";
import { forwardSlash, invalidInputChecks } from '../Helpers';

export const getValidConfig = () => {
  describe('mockServer.getValidConfig() : ', () => {
    let mockServer: MockServer;
    beforeEach(() => { mockServer = MockServer.Create() });
    afterEach(async () => { await MockServer.Destroy() });

    describe('should return Default Config on invalid input', () => {
      test.each(invalidInputChecks(Default_Config))('If %s is passed', (_condition, input, expected) => {
        const config = mockServer.getValidConfig(input as any);
        expect(config).toEqual(expected);
      });
    });

    describe('should return custom Config from a valid Path string', () => {

      const jsFile = require("../../mock/config/config.js");
      const jsonFile = require("../../mock/config/config.json");

      test.each([
        ["valid .js file", "./config.js", jsFile],
        ["valid .json file", "/config.json", jsonFile],
        ["valid folder", "./", { ...jsFile, ...jsonFile }],
      ])('If %s path is passed', (_condition, input, expected) => {
        const configPath = path.join(__dirname, "../../mock/config", input as string)
        const config = mockServer.getValidConfig(configPath);
        const expectedConfig = { ...Default_Config, ...expected };
        expect(config).toEqual(expectedConfig);
      });
    });

    describe('should return a valid Config', () => {
      test.each([
        ["root path is not a directory", { root: path.join(__dirname, "../../mock/config/config.json") }, {}],
        ["root path is a directory", { root: path.join(__dirname, "../../mock") }, { root: forwardSlash(path.join(__dirname, "../../mock")) }],
        ["port is not a number", { port: "" }, {}],
        ["port is a number string", { port: "4000" }, { port: 4000 }],
        ["port is a number", { port: 4000 }, { port: 4000 }],
        ["base is empty string", { base: "" }, {}],
        ["base is '/' ", { base: "/" }, {}],
        ["base is '/api' ", { base: "/api" }, { base: "/api" }],
        ["staticDir is not a valid path", { root: path.join(__dirname, "../../mock"), staticDir: "/mock" }, { root: forwardSlash(path.join(__dirname, "../../mock")) }],
        ["staticDir is a valid path", { root: path.join(__dirname, "../../mock"), staticDir: "../../public" }, { root: forwardSlash(path.join(__dirname, "../../mock")), staticDir: forwardSlash(path.join(__dirname, "../../mock", "../../public")) }],
        ["host is a empty string", { host: "" }, {}],
        ["host is not a string", { host: 129 }, {}],
        ["host is a string", { host: "localhost" }, { host: "localhost" }],
      ])('If %s', (_condition, input, expected) => {
        const config = mockServer.getValidConfig(input as object);
        const expectedConfig = { ...Default_Config, ...expected };
        expect(config).toEqual(expectedConfig);
      });
    });
  });
}