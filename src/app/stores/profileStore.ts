import { makeAutoObservable, runInAction } from 'mobx';
import { toast } from 'react-toastify';
import { agent } from '../api/agent';
import { IPhoto, IProfile } from '../models/profile';
import { RootStore } from './rootStore';

export default class ProfileStore {
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this, { rootStore: false });
  }

  profile: IProfile | undefined;
  loadingProfile = true;
  uploadingPhoto = false;
  loading = false;
  submitting = false;

  get isCurrentUser() {
    if (this.rootStore.userStore.user && this.profile) {
      return this.rootStore.userStore.user.username === this.profile.username;
    }

    return false;
  }

  loadProfile = async (username: string) => {
    this.loadingProfile = true;

    try {
      const profile = await agent.Profiles.get(username);
      runInAction(() => {
        this.profile = profile;
      });
    } catch (error) {
      console.log(error);
    } finally {
      runInAction(() => {
        this.loadingProfile = false;
      });
    }
  };

  uploadPhoto = async (file: Blob) => {
    this.uploadingPhoto = true;

    try {
      const photo = await agent.Profiles.uploadPhoto(file);
      runInAction(() => {
        if (this.profile) {
          this.profile.photos.push(photo);
          if (photo.isMain && this.rootStore.userStore.user) {
            this.rootStore.userStore.user.image = photo.url;
            this.profile.image = photo.url;
          }
        }
      });
    } catch (error) {
      console.log(error);
      toast.error('Problem uploading photo');
    } finally {
      runInAction(() => (this.uploadingPhoto = false));
    }
  };

  setMainPhoto = async (photo: IPhoto) => {
    this.loading = true;

    try {
      await agent.Profiles.setMainPhoto(photo.id);
      runInAction(() => {
        this.rootStore.userStore.user!.image = photo.url;
        this.profile!.photos.find((p) => p.isMain)!.isMain = false;
        this.profile!.photos.find((p) => p.id === photo.id)!.isMain = true;
        this.profile!.image = photo.url;
      });
    } catch (error) {
      console.log(error);
      toast.error('Problem setting main photo');
    } finally {
      runInAction(() => (this.loading = false));
    }
  };

  deletePhoto = async (photo: IPhoto) => {
    this.loading = true;

    try {
      await agent.Profiles.deletePhoto(photo.id);
      runInAction(() => {
        this.profile!.photos = this.profile!.photos.filter((p) => p.id !== photo.id);
      });
    } catch (error) {
      console.log(error);
      toast.error('Problem deleting photo');
    } finally {
      runInAction(() => (this.loading = false));
    }
  };

  updateProfile = async (profile: Partial<IProfile>) => {
    this.submitting = true;

    try {
      await agent.Profiles.update(profile);
      runInAction(() => {
        if (profile.displayName !== this.rootStore.userStore.user!.displayName) {
          this.rootStore.userStore.user!.displayName = profile.displayName!;
        }
        this.profile = { ...this.profile!, ...profile };
      });
    } catch (error) {
      console.log(error);
      toast.error('Error updating profile');
    } finally {
      runInAction(() => (this.submitting = false));
    }
  };
}
