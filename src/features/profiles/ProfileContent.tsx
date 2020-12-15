import React from 'react';
import { Tab } from 'semantic-ui-react';

import ProfileDescription from './ProfileDescription';
import ProfileFollowings from './ProfileFollowings';
import ProfilePhotos from './ProfilePhotos';

const panes = [
  { menuItem: 'About', render: () => <ProfileDescription /> },
  { menuItem: 'Photos', render: () => <ProfilePhotos /> },
  { menuItem: 'Activities', render: () => <Tab.Pane>Activities content</Tab.Pane> },
  { menuItem: 'Followers', render: () => <ProfileFollowings /> },
  { menuItem: 'Following', render: () => <ProfileFollowings /> },
];

interface IProps {
  setActiveTab: (activeIndex: number) => void;
}

const ProfileContent: React.FC<IProps> = ({ setActiveTab }) => {
  return (
    <Tab
      onTabChange={(e, data) => setActiveTab(data.activeIndex! as number)}
      menu={{ fluid: true, vertical: true }}
      menuPosition="right"
      panes={panes}
    />
  );
};

export default ProfileContent;
