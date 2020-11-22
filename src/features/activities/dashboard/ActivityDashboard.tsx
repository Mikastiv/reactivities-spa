import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Grid } from 'semantic-ui-react';

import { RootStoreContext } from '../../../app/stores/rootStore';
import ActivityList from './ActivityList';
import Loading from '../../../app/layout/Loading';

interface IProps {}

const ActivityDashboard: React.FC<IProps> = () => {
  const rootStore = useContext(RootStoreContext);
  const { loadActivities, loadingInitial } = rootStore.activityStore;

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  if (loadingInitial) return <Loading content="Loading activities..." />;

  return (
    <Grid>
      <Grid.Column width={10}>
        <ActivityList />
      </Grid.Column>
      <Grid.Column width={6}>
        <h2>Activity Filters</h2>
      </Grid.Column>
    </Grid>
  );
};

export default observer(ActivityDashboard);
