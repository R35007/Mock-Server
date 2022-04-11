
import axios, { AxiosRequestConfig } from 'axios';
import chalk from 'chalk';
import * as fs from 'fs';
import JPH from 'json-parse-helpfulerror';
import * as _ from 'lodash';
import * as path from 'path';
import { FetchData, PathDetails } from '../model';

export const getJSON = (directoryPath: string, excludeFolders: string[] = [], recursive: boolean = true): object => {
  const filesList = getFilesList(directoryPath, excludeFolders, recursive);
  const onlyJson = filesList.filter((f) => [".json", ".jsonc", ".har", ".js"].includes(f.extension));

  const obj = onlyJson.reduce((mock, file) => {
    try {
      if (path.extname(file.filePath) === ".js") {
        delete require.cache[file.filePath];
        const obj = require(file.filePath);
        if (_.isEmpty(obj) || !_.isPlainObject(obj)) return {}
        return { ...mock, ...obj };
      } else {
        const str = fs.readFileSync(file.filePath, "utf-8");
        if (_.isEmpty(str)) return {}
        return { ...mock, ...JPH.parse(str) };
      }
    } catch (error) {
      console.log(chalk.red(`Error reading ${file.filePath}`));
      throw (error);
    }
  }, {});
  return obj;
};

export const getFilesList = (directoryPath: string, foldersToExclude: string[] = [], recursive: boolean = true): PathDetails[] => {
  const stats = getStats(directoryPath);
  if (stats?.isFile) {
    return [stats];
  } else if (stats?.isDirectory && foldersToExclude.indexOf(directoryPath) < 0) {
    const files = fs.readdirSync(directoryPath);
    const filteredFiles = files.filter((file) => foldersToExclude.indexOf(file) < 0);
    const filesList = filteredFiles.reduce((res: PathDetails[], file: string) => {
      if (recursive) {
        return res.concat(getFilesList(`${directoryPath}/${file}`, foldersToExclude, true));
      }
      return res.concat(getStats(`${directoryPath}/${file}`) || []);
    }, []);

    return filesList;
  }
  return [];
};

export const getStats = (directoryPath: string): PathDetails | undefined => {
  if (fs.existsSync(directoryPath)) {
    const stats = fs.statSync(directoryPath);
    const extension = path.extname(directoryPath);
    const fileName = path.basename(directoryPath, extension);
    return { fileName, extension, filePath: directoryPath, isFile: stats.isFile(), isDirectory: stats.isDirectory() };
  }
  return;
};

export const getFileData = (filePath: string, extension: string): FetchData => {
  let fetchData: FetchData = {};
  try {
    if (extension === ".json" || extension === ".har") {
      console.log(chalk.gray("Fetch request : "), filePath);
      const str = fs.readFileSync(filePath, "utf-8");
      fetchData.response = _.isEmpty(str) ? {} : JPH.parse(str)
    } else if (extension === ".txt") {
      console.log(chalk.gray("Fetch request : "), filePath);
      fetchData.response = fs.readFileSync(filePath, "utf8")
    }
  } catch (err) {
    console.log(chalk.red(`Error reading ${filePath}`));
    fetchData = {
      isError: true,
      stack: err.stack,
      message: err.message,
      response: {}
    };
  }

  return fetchData;
}

export const getUrlData = async (request: AxiosRequestConfig): Promise<FetchData> => {
  let fetchData: FetchData = {};
  console.log(chalk.gray("Fetch request : "), request);
  try {
    if (request.url?.match(/\.(jpeg|jpg|gif|png)$/gi)) {
      fetchData.response = `<img src="${request.url}">`;
    } else {
      const response = await axios(request);
      fetchData = {
        status: response.status,
        headers: response.headers
      };
      if (response.headers["content-type"]?.match(/image\/(jpeg|jpg|gif|png)$/gi)) {
        fetchData.response = `<img src="${request.url}">`
      } else {
        fetchData.response = response.data ?? {};
      }
    }
  } catch (err) {
    fetchData = {
      isError: true,
      stack: err.stack,
      message: err.message || err.response?.statusText || "Internal Server Error",
      headers: err.response?.headers,
      status: err.response?.status,
      response: err.response?.data ?? {}
    };
  }
  return fetchData;
}

export const parseUrl = (relativeUrl?: string, root: string = process.cwd()): string => {
  if (!relativeUrl || typeof relativeUrl !== 'string' || !relativeUrl?.trim().length) return '';
  if (relativeUrl.startsWith("http")) return relativeUrl;
  const parsedUrl = decodeURIComponent(path.resolve(root, relativeUrl));
  return parsedUrl;
};

export const requireData = (data?: any, root: string = process.cwd()): object | undefined => {
  if (_.isEmpty(data)) return;
  if (_.isString(data)) {
    const parsedUrl = parseUrl(data, root);
    const stats = getStats(parsedUrl);
    if (!stats) return;

    if (path.extname(parsedUrl) === '.js') {
      delete require.cache[parsedUrl];
      return require(parsedUrl);
    }
    return getJSON(parsedUrl);
  } else if (_.isPlainObject(data)) {
    return data
  }
  return;
}