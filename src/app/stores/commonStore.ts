import { makeAutoObservable, reaction } from 'mobx';

import { RootStore } from './rootStore';

export default class CommonStore {
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this, { rootStore: false });

    reaction(
      () => this.token,
      (token) => {
        if (token) {
          window.sessionStorage.setItem('jwt', token);
        } else {
          window.sessionStorage.removeItem('jwt');
        }
      }
    );
  }

  token: string | null = window.sessionStorage.getItem('jwt');
  appLoaded = false;

  setToken = (token: string | null) => {
    if (token) {
      window.sessionStorage.setItem('jwt', token);
    } else {
      window.sessionStorage.removeItem('jwt');
    }

    this.token = token;
  };

  setAppLoaded = () => {
    this.appLoaded = true;
  };
}
