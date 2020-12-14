import { observer } from 'mobx-react-lite';
import React, { useContext } from 'react';
import { Form as FinalForm, Field } from 'react-final-form';
import { combineValidators, isRequired } from 'revalidate';
import { Button, Form } from 'semantic-ui-react';

import TextAreaInput from '../../app/common/form/TextAreaInput';
import TextInput from '../../app/common/form/TextInput';
import { IProfile } from '../../app/models/profile';
import { RootStoreContext } from '../../app/stores/rootStore';

interface IProps {
  setEditMode: (isEnabled: boolean) => void;
  profile: IProfile;
}

const validate = combineValidators({
  displayName: isRequired({ message: 'A display name is required' }),
});

const ProfileEditForm: React.FC<IProps> = ({ setEditMode, profile }) => {
  const rootStore = useContext(RootStoreContext);
  const { updateProfile, submitting } = rootStore.profileStore;

  const handleFinalFormSubmit = (values: any) => {
    updateProfile(values).then(() => setEditMode(false));
  };

  return (
    <FinalForm
      validate={validate}
      onSubmit={handleFinalFormSubmit}
      initialValues={profile}
      render={({ handleSubmit, invalid, pristine }) => (
        <Form onSubmit={handleSubmit}>
          <Field
            placeholder="Display Name"
            name="displayName"
            value={profile?.displayName}
            component={TextInput}
          />
          <Field
            placeholder="Bio"
            name="bio"
            rows={3}
            value={profile?.bio}
            component={TextAreaInput}
          />
          <Button
            loading={submitting}
            floated="right"
            positive
            type="submit"
            content="Update profile"
            disabled={invalid || pristine}
          />
        </Form>
      )}
    ></FinalForm>
  );
};

export default observer(ProfileEditForm);
