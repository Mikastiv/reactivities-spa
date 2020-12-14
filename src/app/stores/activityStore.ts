import { SyntheticEvent } from 'react';
import { makeAutoObservable, observable, runInAction } from 'mobx';
import { toast } from 'react-toastify';

import { agent } from '../api/agent';
import { history } from '../..';
import { IActivity } from '../models/activity';
import { RootStore } from './rootStore';
import { createAttendee, setActivityProps } from '../common/utils/utils';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

export default class ActivityStore {
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this, { rootStore: false, hubConnection: observable.ref });
  }

  // observables
  activityRegistry = new Map<string, IActivity>();
  activity: IActivity | undefined;
  loadingInitial = false;
  submitting = false;
  target = '';
  loading = false;
  hubConnection: HubConnection | undefined;

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
  createHubConnection = (activityId: string) => {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('https://localhost:5001/chat', {
        accessTokenFactory: () => this.rootStore.commonStore.token!,
      })
      .configureLogging(LogLevel.Information)
      .build();

    this.hubConnection
      .start()
      .then(() => console.log(this.hubConnection!.state))
      .then(() => {
        if (this.hubConnection!.state === 'Connected') {
          console.log('Attempting to join group', activityId);
          this.hubConnection!.invoke('AddToGroup', activityId);
        }
      })
      .catch((error) => console.log('Error establishing connection: ', error));

    this.hubConnection.on('ReceiveComment', (comment) => {
      runInAction(() => {
        this.activity!.comments.push(comment);
      });
    });

    this.hubConnection.on('Send', (message) => {
      toast.info(message);
    });
  };

  stopHubConnection = () => {
    this.hubConnection!.invoke('RemoveFromGroup', this.activity!.id)
      .then(() => {
        this.hubConnection!.stop();
      })
      .then(() => console.log('Connection stopped'))
      .catch((err) => console.log(err));
  };

  addComment = async (values: any) => {
    values.activityId = this.activity!.id;

    try {
      await this.hubConnection!.invoke('SendComment', values);
    } catch (error) {
      console.log(error);
    }
  };

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
      activity.comments = [];
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
