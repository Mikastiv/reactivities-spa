import { FORM_ERROR } from 'final-form';
import React, { useContext } from 'react';
import { Form as FinalForm, Field } from 'react-final-form';
import { combineValidators, isRequired } from 'revalidate';
import { Button, Form, Header } from 'semantic-ui-react';

import { IUserFormValues } from '../../app/models/user';
import { RootStoreContext } from '../../app/stores/rootStore';
import TextInput from '../../app/common/form/TextInput';
import ErrorMessage from '../../app/common/form/ErrorMessage';
import { isValidEmail } from '../../app/common/utils/utils';

const validate = combineValidators({
  email: isValidEmail(),
  password: isRequired('Password'),
});

const LoginForm = () => {
  const rootStore = useContext(RootStoreContext);
  const { login } = rootStore.userStore;

  return (
    <FinalForm
      onSubmit={(values: IUserFormValues) =>
        login(values).catch((error) => ({ [FORM_ERROR]: error }))
      }
      validate={validate}
      render={({
        handleSubmit,
        submitting,
        submitError,
        invalid,
        pristine,
        dirtySinceLastSubmit,
      }) => (
        <Form onSubmit={handleSubmit} error>
          <Header as="h2" content="Login to Reactivities" color="teal" textAlign="center" />
          <Field name="email" component={TextInput} placeholder="Email" />
          <Field name="password" component={TextInput} placeholder="Password" type="password" />
          {!dirtySinceLastSubmit && submitError && (
            <ErrorMessage error={submitError} text="Invalid email or password" />
          )}
          <Button
            disabled={(invalid && !dirtySinceLastSubmit) || pristine}
            loading={submitting}
            color="teal"
            content="Login"
            fluid
          />
        </Form>
      )}
    />
  );
};

export default LoginForm;
