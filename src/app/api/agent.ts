import axios, { AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { history } from '../..';
import { IActivitiesEnvelope, IActivity } from '../models/activity';
import { IPhoto, IProfile, IUserActivity } from '../models/profile';
import { IUser, IUserFormValues } from '../models/user';

axios.defaults.baseURL = process.env.REACT_APP_API_URL;

axios.interceptors.request.use(
  (config) => {
    const token = window.sessionStorage.getItem('jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(undefined, (error) => {
  if (
    (error.message === 'Network Error' || error.message === 'timeout of 0ms exceeded') &&
    !error.response
  ) {
    toast.error('Network Error');
  }

  const { status, data, config, headers } = error.response;
  if (status === 404) {
    history.push('/notfound');
  }
  if (status === 401 && headers['www-authenticate'].includes('The token expired at')) {
    window.sessionStorage.removeItem('jwt');
    history.push('/');
    toast.info('Session has expired');
  }
  if (status === 400 && config.method === 'get' && data.errors.hasOwnProperty('id')) {
    history.push('/notfound');
  }
  if (status === 500) {
    toast.error('500 Server Error');
  }

  throw error.response;
});

const responseBody = (response: AxiosResponse) => response?.data;

const requests = {
  get: (url: string, params?: URLSearchParams) => axios.get(url, { params }).then(responseBody),
  post: (url: string, body: {}) => axios.post(url, body).then(responseBody),
  put: (url: string, body: {}) => axios.put(url, body).then(responseBody),
  delete: (url: string) => axios.delete(url).then(responseBody),
  postForm: (url: string, file: Blob) => {
    let formData = new FormData();
    formData.append('File', file);
    return axios
      .post(url, formData, { headers: { 'Content-type': 'multipart/form-data' } })
      .then(responseBody);
  },
};

const Activities = {
  list: (params: URLSearchParams): Promise<IActivitiesEnvelope> =>
    requests.get('/activities', params),
  details: (id: string): Promise<IActivity> => requests.get(`/activities/${id}`),
  create: (activity: IActivity): Promise<void> => requests.post('/activities', activity),
  update: (activity: IActivity): Promise<void> =>
    requests.put(`/activities/${activity.id}`, activity),
  delete: (id: string): Promise<void> => requests.delete(`/activities/${id}`),
  attend: (id: string): Promise<void> => requests.post(`/activities/${id}/attend`, {}),
  unattend: (id: string): Promise<void> => requests.delete(`/activities/${id}/attend`),
};

const User = {
  current: (): Promise<IUser> => requests.get('/user'),
  login: (user: IUserFormValues): Promise<IUser> => requests.post('/user/login', user),
  register: (user: IUserFormValues): Promise<IUser> => requests.post('/user/register', user),
};

const Profiles = {
  get: (username: string): Promise<IProfile> => requests.get(`/profiles/${username}`),
  uploadPhoto: (photo: Blob): Promise<IPhoto> => requests.postForm('/photos', photo),
  setMainPhoto: (id: string): Promise<void> => requests.post(`/photos/${id}/setMain`, {}),
  deletePhoto: (id: string): Promise<void> => requests.delete(`/photos/${id}`),
  update: (profile: Partial<IProfile>): Promise<void> => requests.put('/profiles', profile),
  follow: (username: string): Promise<void> => requests.post(`/profiles/${username}/follow`, {}),
  unfollow: (username: string): Promise<void> => requests.delete(`/profiles/${username}/follow`),
  listFollowings: (username: string, predicate: string): Promise<IProfile[]> =>
    requests.get(`/profiles/${username}/follow?predicate=${predicate}`),
  listActivities: (username: string, predicate: string): Promise<IUserActivity[]> =>
    requests.get(`profiles/${username}/activities?predicate=${predicate}`),
};

export const agent = {
  Activities,
  User,
  Profiles,
};
