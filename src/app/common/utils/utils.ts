import { createValidator } from 'revalidate';

import { IActivity, IAttendee } from '../../models/activity';
import { IUser } from '../../models/user';

export const combineDateAndTime = (date: Date, time: Date): Date => {
  const dateString = date.toISOString().split('T')[0];
  const timeString = time.toISOString().split('T')[1];

  return new Date(dateString + 'T' + timeString);
};

export const isValidEmail = createValidator(
  (message: string) => (value: any) => {
    if (value && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value)) {
      return message;
    }
  },
  'Invalid email address'
);

export const setActivityProps = (activity: IActivity, user: IUser) => {
  activity.date = new Date(activity.date);
  activity.isGoing = activity.attendees.some((a) => a.username === user.username);
  activity.isHost = activity.attendees.some((a) => a.username === user.username && a.isHost);

  return activity;
};

export const createAttendee = (user: IUser): IAttendee => {
  return {
    displayName: user.displayName,
    isHost: false,
    username: user.username,
    image: user.image!,
  };
};
