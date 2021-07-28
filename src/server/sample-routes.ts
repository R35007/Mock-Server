import * as path from 'path';
import { User_Routes } from './model';


const Sample_Routes: User_Routes = {
  "/iterateRoutes": {
    mock: [
      "/posts",
      "/comments",
      "/todos"
    ],
    middlewares: ["_IterateRoutes"]
  },
  "/posts": [
    {
      "userId": 1,
      "id": 1,
      "title": "Lorem ipsum dolor sit.",
      "body": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Est, dolorem."
    },
    {
      "userId": 1,
      "id": 2,
      "title": "Lorem ipsum dolor sit.",
      "body": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Est, dolorem."
    },
    {
      "userId": 1,
      "id": 3,
      "title": "Lorem ipsum dolor sit.",
      "body": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Est, dolorem."
    },
    {
      "userId": 1,
      "id": 4,
      "title": "Lorem ipsum dolor sit.",
      "body": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Est, dolorem."
    },
    {
      "userId": 1,
      "id": 5,
      "title": "Lorem ipsum dolor sit.",
      "body": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Est, dolorem."
    }
  ],
  "/albums/:id?": {
    fetch: "https://jsonplaceholder.typicode.com/{{routePath}}",
    middlewares: ["_FetchTillData"]
  },
  "/comments": {
    delay: 1000,
    fetch: "https://jsonplaceholder.typicode.com/comments",
    fetchCount: 5,
  },
  "/photos": {
    statusCode: 500,
    fetch: { url: "https://jsonplaceholder.typicode.com/photos" },
    middlewares: ["_IterateResponse"]
  },
  "/todos": {
    fetch: {
      url: "https://jsonplaceholder.typicode.com/{{routePath}}",
      params: "{{params}}"
    },
    fetchCount: -1,
  },
  "/users": {
    fetch: path.join(__dirname, "../../public/users.json"),
    middlewares: ["_SetFetchDataToMock", "_CrudOperation"],
    fetchCount: -1
  },
  "/db": {
    fetch: "http://jsonplaceholder.typicode.com/dbs",
    mock: {
      "/posts": { fetch: "https://jsonplaceholder.typicode.com/posts" },
      "/comments": { fetch: "https://jsonplaceholder.typicode.com/comments" },
      "/albums": { fetch: "https://jsonplaceholder.typicode.com/albums" },
      "/photos": { fetch: "https://jsonplaceholder.typicode.com/photos" },
      "/todos": { fetch: "https://jsonplaceholder.typicode.com/todos" },
      "/users": { fetch: "https://jsonplaceholder.typicode.com/users" },
    },
    fetchCount: 2,
    middlewares: ["_FetchTillData"]
  },
  "/logo": {
    fetch: path.join(__dirname, "../../public/mockserverlogo.png"),
    fetchCount: -1
  },
  "/internalRequest": {
    fetch: "http://localhost:{{port}}/db",
    middlewares: ["_FetchTillData"]
  },
  "/pageNotFound": {
    fetch: "http://localhost:{{port}}/404",
    fetchCount: -1
  }
}

export default Sample_Routes;