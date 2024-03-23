const { MockServer, watcher, chalk, axios } = require('../dist/index.js');
const mockServer = MockServer.Create({ root: __dirname });

const startServer = async () => {
  const db = await axios.get('https://jsonplaceholder.typicode.com/db').then((res) => res.data);
  return await mockServer.launchServer(db);
};

startServer();
