import { SyntheticEvent } from 'react';
import { makeAutoObservable, runInAction } from 'mobx';
import { toast } from 'react-toastify';

import { agent } from '../api/agent';
import { history } from '../..';
import { IActivity } from '../models/activity';
import { RootStore } from './rootStore';
import { createAttendee, setActivityProps } from '../common/utils/utils';

export default class ActivityStore {
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this, { rootStore: false });
  }

  // observables
  activityRegistry = new Map<string, IActivity>();
  activity: IActivity | undefined;
  loadingInitial = false;
  submitting = false;
  target = '';
  loading = false;

  // computed
  get activitiesByDate(): [string, IActivity[]][] {
    return this.groupActivitiesByDate(Array.from(this.activityRegistry.values()));
  }

  groupActivitiesByDate(activities: IActivity[]): [string, IActivity[]][] {
    const sortedActivities = activities.sort((a, b) => a.date.getTime() - b.date.getTime());

    return Object.entries(
      sortedActivities.reduce((activities, activity) => {
        const date = activity.date.toISOString().split('T')[0];
        activities[date] = activities[date] ? [...activities[date], activity] : [activity];
        return activities;
      }, {} as { [key: string]: IActivity[] })
    );
  }

  // actions
  loadActivities = async () => {
    this.loadingInitial = true;

    try {
      const activities = await agent.Activities.list();
      runInAction(() => {
        activities.forEach((activity) => {
          setActivityProps(activity, this.rootStore.userStore.user!);
          this.activityRegistry.set(activity.id, activity);
        });
      });
    } catch (error) {
      console.log(error);
    } finally {
      runInAction(() => (this.loadingInitial = false));
    }
  };

  loadActivity = async (id: string) => {
    let activity = this.getActivity(id);
    if (activity) {
      this.activity = activity;
      return activity;
    } else {
      this.loadingInitial = true;
      try {
        activity = await agent.Activities.details(id);
        runInAction(() => {
          if (activity) {
            setActivityProps(activity, this.rootStore.userStore.user!);
            this.activityRegistry.set(activity.id, activity);
          }
          this.activity = activity;
        });
        return activity;
      } catch (error) {
        console.log(error);
      } finally {
        runInAction(() => (this.loadingInitial = false));
      }
    }
  };

  clearActivity = () => {
    this.activity = undefined;
  };

  getActivity = (id: string) => {
    return this.activityRegistry.get(id);
  };

  createActivity = async (activity: IActivity) => {
    this.submitting = true;
    try {
      await agent.Activities.create(activity);
      const attendee = createAttendee(this.rootStore.userStore.user!);
      attendee.isHost = true;
      activity.attendees = [attendee];
      activity.isHost = true;
      runInAction(() => {
        this.activityRegistry.set(activity.id, activity);
      });
      history.push(`/activities/${activity.id}`);
    } catch (error) {
      toast.error('Problem submitting data');
      console.log(error.response);
    } finally {
      runInAction(() => (this.submitting = false));
    }
  };

  editActivity = async (activity: IActivity) => {
    this.submitting = true;
    try {
      await agent.Activities.update(activity);
      runInAction(() => {
        this.activityRegistry.set(activity.id, activity);
        this.activity = activity;
      });
      history.push(`/activities/${activity.id}`);
    } catch (error) {
      toast.error('Problem submitting data');
      console.log(error.response);
    } finally {
      runInAction(() => (this.submitting = false));
    }
  };

  deleteActivity = async (id: string, event: SyntheticEvent<HTMLButtonElement>) => {
    this.submitting = true;
    this.target = event.currentTarget.name;
    try {
      await agent.Activities.delete(id);
      runInAction(() => this.activityRegistry.delete(id));
    } catch (error) {
      console.log(error);
    } finally {
      runInAction(() => {
        this.target = '';
        this.submitting = false;
      });
    }
  };

  attendActivity = async () => {
    const attendee = createAttendee(this.rootStore.userStore.user!);
    this.loading = true;

    try {
      await agent.Activities.attend(this.activity!.id);
      runInAction(() => {
        if (this.activity) {
          this.activity.attendees.push(attendee);
          this.activity.isGoing = true;
          this.activityRegistry.set(this.activity.id, this.activity);
        }
      });
    } catch (error) {
      toast.error('Problem signing up to the activity');
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  cancelAttendance = async () => {
    this.loading = true;

    try {
      await agent.Activities.unattend(this.activity!.id);
      runInAction(() => {
        if (this.activity) {
          this.activity.attendees = this.activity.attendees.filter(
            (a) => a.username !== this.rootStore.userStore.user!.username
          );
          this.activity.isGoing = false;
          this.activityRegistry.set(this.activity.id, this.activity);
        }
      });
    } catch (error) {
      toast.error('Problem cancelling attendance');
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };
}
