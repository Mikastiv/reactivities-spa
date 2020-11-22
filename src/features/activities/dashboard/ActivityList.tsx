import React, { Fragment, useContext } from 'react';
import { observer } from 'mobx-react-lite';
import { Item, Label } from 'semantic-ui-react';
import { format } from 'date-fns';

import { RootStoreContext } from '../../../app/stores/rootStore';
import ActivityListItem from './ActivityListItem';

interface IProps {}

const ActivityList: React.FC<IProps> = () => {
  const rootStore = useContext(RootStoreContext);
  const { activitiesByDate } = rootStore.activityStore;

  return (
    <Fragment>
      {activitiesByDate.map(([group, activities]) => (
        <Fragment key={group}>
          <Label size="large" color="blue">
            {format(new Date(group), 'eeee, MMMM do')}
          </Label>
          <Item.Group divided>
            {activities.map((activity) => (
              <ActivityListItem key={activity.id} activity={activity} />
            ))}
          </Item.Group>
        </Fragment>
      ))}
    </Fragment>
  );
};

export default observer(ActivityList);
