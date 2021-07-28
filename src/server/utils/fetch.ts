
import axios, { AxiosRequestConfig } from 'axios';
import chalk from 'chalk';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import { PathDetails } from '../model';

export const getJSON = (directoryPath: string, excludeFolders: string[] = [], recursive: boolean = true): object => {
  const filesList = getFilesList(directoryPath, excludeFolders, recursive);
  const onlyJson = filesList.filter((f) => f.extension === ".json" || f.extension === ".har");

  const mockData = onlyJson.reduce((mock, file) => {
    const obj = JSON.parse(fs.readFileSync(file.filePath, "utf-8"));
    return { ...mock, ...obj };
  }, {});
  return mockData;
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

export const getFileData = (filePath: string, extension: string): { fetchData?: any, fetchError?: any } => {
  let fetchData, fetchError;
  try {
    if (extension === ".json" || extension === ".har") {
      console.log(chalk.gray("Fetch request : "), filePath);
      fetchData = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } else if (extension === ".txt") {
      console.log(chalk.gray("Fetch request : "), filePath);
      fetchData = fs.readFileSync(filePath, "utf8");
    }
  } catch (error) {
    fetchError = error;
  }

  return { fetchData, fetchError }
}

export const getUrlData = async (request: AxiosRequestConfig) => {
  let fetchData, fetchError;
  console.log(chalk.gray("Fetch request : "), request);
  try {
    const response = await axios(request);
    fetchData = response.data;
  } catch (err) {
    fetchError = err
  }

  return { fetchData, fetchError };
}

export const parseUrl = (relativeUrl?: string, root: string = process.cwd()): string => {
  if (!relativeUrl || typeof relativeUrl !== 'string' || !relativeUrl?.trim().length) return '';
  if (relativeUrl.startsWith("http")) return relativeUrl;
  const parsedUrl = decodeURIComponent(path.resolve(root, relativeUrl));
  return parsedUrl;
};

export const requireData = (data?: any, root: string = process.cwd()): object | undefined => {
  if(_.isEmpty(data)) return;
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