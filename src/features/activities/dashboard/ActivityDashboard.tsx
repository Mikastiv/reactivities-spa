import React, { useContext, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Grid, Loader } from 'semantic-ui-react';
import InfiniteScroll from 'react-infinite-scroller';

import { RootStoreContext } from '../../../app/stores/rootStore';
import ActivityList from './ActivityList';
import Loading from '../../../app/layout/Loading';
import ActivityFilters from './ActivityFilters';

interface IProps {}

const ActivityDashboard: React.FC<IProps> = () => {
  const rootStore = useContext(RootStoreContext);
  const { loadActivities, loadingInitial, setPage, page, totalPages } = rootStore.activityStore;
  const [loadingNext, setLoadingNext] = useState(false);

  const handleGetNext = () => {
    setLoadingNext(true);
    setPage(page + 1);
    loadActivities().then(() => setLoadingNext(false));
  };

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  if (loadingInitial && page === 0) return <Loading content="Loading activities..." />;

  return (
    <Grid>
      <Grid.Column width={10}>
        <InfiniteScroll
          pageStart={0}
          loadMore={handleGetNext}
          hasMore={!loadingNext && page + 1 < totalPages}
          initialLoad={false}
        >
          <ActivityList />
        </InfiniteScroll>
      </Grid.Column>
      <Grid.Column width={6}>
        <ActivityFilters />
      </Grid.Column>
      <Grid.Column width={10} style={{ marginBottom: '15px' }}>
        <Loader active={loadingNext} />
      </Grid.Column>
    </Grid>
  );
};

export default observer(ActivityDashboard);
