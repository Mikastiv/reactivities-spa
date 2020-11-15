import axios, { AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { history } from '../..';
import { IActivity } from '../models/activity';

axios.defaults.baseURL = 'https://localhost:5001/api';

axios.interceptors.response.use(undefined, (error) => {
  if (
    (error.message === 'Network Error' || error.message === 'timeout of 0ms exceeded') &&
    !error.response
  ) {
    toast.error('Network Error');
  }

  const { status, data, config } = error.response;
  if (status === 404) {
    history.push('/notfound');
  }
  if (status === 400 && config.method === 'get' && data.errors.hasOwnProperty('id')) {
    history.push('/notfound');
  }
  if (status === 500) {
    toast.error('500 Server Error');
  }
});

const responseBody = (response: AxiosResponse) => response?.data;

const sleep = (ms: number) => (response: AxiosResponse) =>
  new Promise<AxiosResponse>((resolve) => setTimeout(() => resolve(response), ms));

const delay = 1000;

const requests = {
  get: (url: string) => axios.get(url).then(sleep(delay)).then(responseBody),
  post: (url: string, body: {}) => axios.post(url, body).then(sleep(delay)).then(responseBody),
  put: (url: string, body: {}) => axios.put(url, body).then(sleep(delay)).then(responseBody),
  delete: (url: string) => axios.delete(url).then(sleep(delay)).then(responseBody),
};

const Activities = {
  list: (): Promise<IActivity[]> => requests.get('/activities'),
  details: (id: string): Promise<IActivity> => requests.get(`/activities/${id}`),
  create: (activity: IActivity): Promise<void> => requests.post('/activities', activity),
  update: (activity: IActivity): Promise<void> =>
    requests.put(`/activities/${activity.id}`, activity),
  delete: (id: string) => requests.delete(`/activities/${id}`),
};

export const agent = {
  Activities,
};
