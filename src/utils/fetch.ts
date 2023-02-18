
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import chalk from 'chalk';
import * as fs from 'fs';
import * as cjson from 'comment-json';
import * as _ from 'lodash';
import * as path from 'path';
import { PathDetails } from '../types/common.types';
import * as ValidTypes from '../types/valid.types';
import { getParsedJSON } from '.';

export const importJsModuleSync = (modulePath: string) => {
  delete require.cache[require.resolve(modulePath)];
  return require(require.resolve(modulePath));
}

export const importJsonModuleSync = (modulePath: string) => {
  try {
    const str = fs.readFileSync(modulePath, "utf-8");
    return JSON.parse(str);
  } catch (err) {
    const str = fs.readFileSync(modulePath, "utf-8");
    return cjson.parse(str, undefined, true);
  }
}

export const requireFile = (directoryPath: string, {
  exclude = [],
  recursive = true,
  isList = false,
  onlyIndex = true
}: { exclude?: string[], recursive?: boolean, isList?: boolean, onlyIndex?: boolean } = {}) => {

  const stats = getStats(directoryPath);

  // If path doesn't exist then return
  if (!stats) return;

  // Get File data
  if (stats.isFile) {
    try {
      if (stats.extension.endsWith("js")) return importJsModuleSync(stats.filePath);
      return importJsonModuleSync(stats.filePath);
    } catch (error: any) {
      console.log(chalk.red(`Error reading ${stats.filePath}`));
      console.error(error.message);
      return;
    }
  }

  // If given path is a Directory then return accumulated data of all files in the directoryPath

  const filesList = getFilesList(directoryPath, { exclude: exclude, recursive, onlyIndex });

  if (!filesList.length) return;

  if (filesList.length === 1) return requireFile(filesList[0].filePath, { exclude, recursive, isList, onlyIndex });

  return isList ? getList(filesList) : getObject(filesList);
};

export const getObject = (files: PathDetails[]): object => {
  const obj = files.reduce((mock, file) => {
    const data = requireFile(file.filePath);
    if (_.isEmpty(data) || !_.isPlainObject(data)) return mock;
    return { ...mock, ...data };
  }, {});
  return obj;
};

export const getList = (files: PathDetails[]): any[] => {
  const list = files.reduce((mock, file) => {
    const data = requireFile(file.filePath);
    if (_.isEmpty(data) || !_.isArray(data)) return mock;
    return [...mock, ...data];
  }, [] as any[]);
  return list;
};

export const getFilesList = (directoryPath: string, {
  exclude = [],
  recursive = true,
  onlyIndex = true
}: { exclude?: string[], recursive?: boolean, onlyIndex?: boolean } = {}): PathDetails[] => {
  const stats = getStats(directoryPath);
  if (!stats) return [];
  if (stats.isFile) {
    return [stats];
  } else if (stats.isDirectory && exclude.indexOf(directoryPath) < 0) {

    if (onlyIndex) {
      const indexPath = `${directoryPath}\\index.js`;
      const indexStats = getStats(indexPath);
      if (indexStats) return [indexStats];
    }

    const files = fs.readdirSync(directoryPath);
    const filteredFiles = files.filter((file) => exclude.indexOf(file) < 0);
    const filesList = filteredFiles.reduce((res: PathDetails[], file: string) => {
      if (recursive) {
        return res.concat(getFilesList(`${directoryPath}/${file}`, { exclude, recursive, onlyIndex }));
      }
      return res.concat(getStats(`${directoryPath}/${file}`) || []);
    }, []);

    return filesList;
  }
  return [];
};

export const getStats = (directoryPath: string): PathDetails | undefined => {
  if (!fs.existsSync(directoryPath)) return;
  const stats = fs.statSync(directoryPath);
  const extension = path.extname(directoryPath);
  const fileName = path.basename(directoryPath, extension);
  return { fileName, extension, filePath: directoryPath, isFile: stats.isFile(), isDirectory: stats.isDirectory() };
};

export const getFileData = (filePath: string): ValidTypes.FetchData => {
  let fetchData: ValidTypes.FetchData = { isError: false };
  const extension = path.extname(filePath);
  try {
    if ([".json", ".jsonc", ".har"].includes(extension)) {
      const str = fs.readFileSync(filePath, "utf-8");
      fetchData.response = _.isEmpty(str) ? {} : getParsedJSON(str);
    } else if (extension === ".txt") {
      fetchData.response = fs.readFileSync(filePath, "utf8")
    } else {
      const str = fs.readFileSync(filePath, "utf-8");
      fetchData.response = _.isEmpty(str) ? {} : getParsedJSON(str);
    }
  } catch (err: any) {
    console.error(chalk.red(err.message));
    fetchData = {
      isError: true,
      stack: err.stack,
      message: err.message,
      response: {},
    };
  };
  return fetchData;
};

export const getUrlData = async (request: AxiosRequestConfig): Promise<ValidTypes.FetchData> => {
  let fetchData: ValidTypes.FetchData = { isError: false, };
  try {
    let response: AxiosResponse;
    if (request.url?.match(/\.(jpeg|jpg|gif|png)$/gi)) {
      response = await axios.get(request.url!, { responseType: "arraybuffer" });
    } else {
      response = await axios(request);
    }
    const isImage = response.headers["content-type"]?.match(/image\/(jpeg|jpg|gif|png)$/gi)?.length > 0;
    const headers = { ...response.headers || {} };
    delete headers["transfer-encoding"];
    delete headers["content-length"];

    fetchData = {
      isImage,
      headers,
      isError: false,
      statusCode: response.status,
      response: response.data
    };
  } catch (err: any) {
    console.error(chalk.red(err.message));
    fetchData = {
      isError: true,
      stack: err.stack,
      message: err.message || err.response?.statusText || "Internal Server Error",
      response: err.response?.data ?? {},
      headers: err.response?.headers,
      statusCode: err.response?.status,
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

export const requireData = (data?: any, {
  root = process.cwd(),
  isList = false,
  onlyIndex = true,
  recursive = true,
  exclude = [],
}: { exclude?: string[], root?: string, isList?: boolean, onlyIndex?: boolean, recursive?: boolean } = {}) => {
  if (!data) return;

  if (_.isFunction(data)) return data;

  if (_.isString(data)) {
    const parsedUrl = parseUrl(data, root);
    if (data.length && !fs.existsSync(parsedUrl)) {
      process.stdout.write("\n" + chalk.red("Invalid Path: ") + chalk.yellow(parsedUrl) + "\n");
      return {};
    }
    const requiredFile = requireFile(parsedUrl, { exclude, recursive, isList, onlyIndex });
    return requireData(requiredFile, { root, isList, onlyIndex, recursive, exclude });
  }

  if (isList && _.isArray(data)) return _.cloneDeep(data);
  if (!isList && _.isPlainObject(data)) return _.cloneDeep(data);
  return;
}
