import React, { useContext } from 'react';
import { observer } from 'mobx-react-lite';
import { Grid } from 'semantic-ui-react';
import ActivityForm from '../form/ActivityForm';
import ActivityDetails from '../details/ActivityDetails';
import ActivityList from './ActivityList';
import ActivityStore from '../../../app/stores/activityStore';

interface IProps {}

const ActivityDashboard: React.FC<IProps> = () => {
  const activityStore = useContext(ActivityStore);
  const { editMode, selectedActivity } = activityStore;

  return (
    <Grid>
      <Grid.Column width={10}>
        <ActivityList />
      </Grid.Column>
      <Grid.Column width={6}>
        {selectedActivity && !editMode && <ActivityDetails />}
        {editMode && <ActivityForm key={selectedActivity?.id || 0} activity={selectedActivity} />}
      </Grid.Column>
    </Grid>
  );
};

export default observer(ActivityDashboard);
