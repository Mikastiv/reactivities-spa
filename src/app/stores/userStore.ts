import { makeAutoObservable, runInAction } from 'mobx';
import { history } from '../..';

import { agent } from '../api/agent';
import { IUser, IUserFormValues } from '../models/user';
import { RootStore } from './rootStore';

export default class UserStore {
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this, { rootStore: false });
  }

  user: IUser | undefined;

  get isLoggedIn(): boolean {
    return !!this.user;
  }

  login = async (values: IUserFormValues) => {
    try {
      const user = await agent.User.login(values);
      runInAction(() => {
        this.user = user;
      });
      this.rootStore.commonStore.setToken(user.token);
      this.rootStore.modalStore.closeModal();
      history.push('/activities');
    } catch (error) {
      throw error;
    }
  };

  logout = () => {
    this.rootStore.commonStore.setToken(null);
    this.user = undefined;
    history.push('/');
  };

  register = async (values: IUserFormValues) => {
    try {
      const user = await agent.User.register(values);
      this.rootStore.commonStore.setToken(user.token);
      this.rootStore.modalStore.closeModal();
      history.push('/activities');
    } catch (error) {
      throw error;
    }
  };

  getUser = async () => {
    try {
      const user = await agent.User.current();
      runInAction(() => {
        this.user = user;
      });
    } catch (error) {
      console.log(error);
    }
  };
}
