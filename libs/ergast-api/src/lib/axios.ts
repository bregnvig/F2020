import axios, { AxiosInstance } from 'axios';

const _http = axios.create({
  baseURL: 'https://ergast.com/api/f1/'
});

export const getClient = (): AxiosInstance => {
  return _http;
};
