import { createContext, SyntheticEvent } from 'react';
import { makeAutoObservable, configure, runInAction } from 'mobx';
import { agent } from '../api/agent';
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
    const sortedActivities = activities.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

    return Object.entries(
      sortedActivities.reduce((activities, activity) => {
        const date = activity.date.split('T')[0];
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
          activity.date = activity.date.split('.')[0];
          this.activityRegistry.set(activity.id, activity);
        });
      });
      console.log(this.groupActivitiesByDate(activities));
    } catch (error) {
      console.log(error);
    } finally {
      runInAction(() => (this.loadingInitial = false));
    }
  };

  loadActivity = async (id: string) => {
    let a = this.getActivity(id);
    if (a) {
      this.activity = a;
    } else {
      this.loadingInitial = true;
      try {
        a = await agent.Activities.details(id);
        runInAction(() => {
          this.activity = a;
        });
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
    } catch (error) {
      console.log(error);
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
    } catch (error) {
      console.log(error);
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
