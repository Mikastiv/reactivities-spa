import { createContext, SyntheticEvent } from 'react';
import { makeAutoObservable, configure, runInAction } from 'mobx';
import { toast } from 'react-toastify';

import { agent } from '../api/agent';
import { history } from '../..';
import { IActivity } from '../models/activity';

configure({ enforceActions: 'always' });

class ActivityStore {
  constructor() {
    makeAutoObservable(this);
  }

  // observables
  activityRegistry = new Map<string, IActivity>();
  activity: IActivity | undefined;
  loadingInitial = false;
  submitting = false;
  target = '';

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
          activity.date = new Date(activity.date);
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
            activity.date = new Date(activity.date);
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
}

export default createContext(new ActivityStore());
