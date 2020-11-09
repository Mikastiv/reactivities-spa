import React from 'react';
import { Dimmer, Loader } from 'semantic-ui-react';

interface IProps {
  inverted?: boolean;
  content?: string;
}

export const Loading: React.FC<IProps> = ({ inverted = true, content }) => {
  return (
    <Dimmer active inverted={inverted}>
      <Loader content={content} />
    </Dimmer>
  );
};
