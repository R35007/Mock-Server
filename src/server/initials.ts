import express from 'express';
import { Server } from "http";
import { nanoid } from 'nanoid';
import * as path from 'path';
import { Config, Middlewares, Routes } from "./model";

export class Initials {

  _app: express.Application = express().set("json spaces", 2);
  _router: express.Router | undefined;
  _server: Server | undefined;
  _defaultRoutes: string[] = [];
  _routesList: string[] = [];

  _routes = {} as Routes;
  _middlewares = {} as Middlewares;
  _injectors = {} as Routes;
  _store = {} as { [key: string]: any };
  _config = {} as Config
  _rewriter = {} as { [key: string]: string };

  _initialRoutes = {} as Routes;
  _initialStore = {} as { [key: string]: any };

  _sample_routes: Routes = {
    "/posts": {
      mock: [
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
      _id: nanoid(7)
    },
    "/albums/:id?": {
      fetch: "https://jsonplaceholder.typicode.com/{{routePath}}",
      fetchCount: 5,
      middlewares: ["_FetchTillData"],
      _id: nanoid(7)
    },
    "/comments": {
      delay: 1000,
      fetch: "https://jsonplaceholder.typicode.com/comments",
      mock: [
        {
          "postid": 1,
          "id": 1,
          "name": "id labore ex et quam laborum",
          "email": "Eliseo@gardner.biz",
          "body": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Est, dolorem."
        },
        {
          "postid": 1,
          "id": 2,
          "name": "quo vero reiciendis velit similique earum",
          "email": "Jayne_Kuhic@sydney.com",
          "body": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Est, dolorem."
        },
        {
          "postid": 1,
          "id": 3,
          "name": "odio adipisci rerum aut animi",
          "email": "Nikita@garfield.biz",
          "body": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Est, dolorem."
        },
        {
          "postid": 1,
          "id": 4,
          "name": "alias odio sit",
          "email": "Lew@alysha.tv",
          "body": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Est, dolorem."
        },
        {
          "postid": 1,
          "id": 5,
          "name": "vero eaque aliquid doloribus et culpa",
          "email": "Hayden@althea.biz",
          "body": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Est, dolorem."
        }
      ],
      _id: nanoid(7)
    },
    "/photos": {
      statusCode: 500,
      fetch: { url: "https://jsonplaceholder.typicode.com/photos" },
      middlewares: ["_SetFetchDataToMock", "_LoopResponse"],
      _id: nanoid(7)
    },
    "/todos": {
      fetch: {
        url: "https://jsonplaceholder.typicode.com/{{routePath}}",
        params: "{{params}}",
      },
      _id: nanoid(7)
    },
    "/users/:id?": {
      fetch: path.join(__dirname, "../public/users.json"),
      middlewares: ["_CurdResponse"],
      fetchCount: -1,
      _id: nanoid(7)
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
      fetchCount: 1,
      middlewares: ["_FetchTillData"],
      _id: nanoid(7)
    },
    "/logo": {
      fetch: path.join(__dirname, "../public/mockserverlogo.png"),
      fetchCount: -1,
      _id: nanoid(7)
    },
    "/internalRequest": {
      fetch: "http://localhost:{{port}}/db",
      middlewares: ["_FetchTillData"],
      _id: nanoid(7)
    },
    "/pageNotFound": {
      fetch: "http://localhost:{{port}}/404",
      fetchCount: -1,
      _id: nanoid(7)
    }
  };


}