
import { MockServer } from "../../src/server/index";
import { User_Config } from '../../src/server/model';

describe("Testing Mock Server", () => {

  let mockServer: MockServer;

  beforeEach(() => {
    mockServer = MockServer.Create();
  });
  afterEach(async () => {
    await MockServer.Destroy();
  });

  it('should successfully launchServer with default config', async () => {
    await mockServer.launchServer();
  });

  it('should successfully launchServer with custom config', async () => {
    const customConfig: User_Config = { port: 4000 }
    mockServer.setConfig(customConfig)
    await mockServer.launchServer();
    const { config } = mockServer.data;
    expect(config.port).toEqual(customConfig.port)
  });

})