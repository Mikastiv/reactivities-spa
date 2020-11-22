import { createValidator } from 'revalidate';

export const combineDateAndTime = (date: Date, time: Date): Date => {
  const timeString = time.getHours() + ':' + time.getMinutes() + ':00';
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const dateString = `${year}-${month}-${day}`;

  return new Date(dateString + ' ' + timeString);
};

export const isValidEmail = createValidator(
  (message: string) => (value: any) => {
    if (value && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value)) {
      return message;
    }
  },
  'Invalid email address'
);
