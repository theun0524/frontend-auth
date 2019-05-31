import axios from 'axios';
import { toCamel } from 'convert-keys';
import MockAdapter from 'axios-mock-adapter';

import UserAccountApiService from './UserAccountApiService';

const axiosMock = new MockAdapter(axios);
const userAccountApiService = new UserAccountApiService(axios, process.env.BASE_URL);
const username = 'test';
const userAccount = {
  email: 'test',
  username,
  social_links: {
    platform: 'test',
    social_link: 'test',
  },
};

describe('UserAccountApiService.getUserAccount', () => {
  it('returns expected data when successful', () => {
    axiosMock.onGet(`${process.env.BASE_URL}/api/user/v1/accounts/${username}`)
      .replyOnce(200, userAccount);

    expect.assertions(1);
    return userAccountApiService.getUserAccount(username)
      .then((result) => {
        expect(result).toEqual(toCamel(userAccount));
      });
  });

  it('returns error when unsuccessful', () => {
    axiosMock.onGet(`${process.env.BASE_URL}/api/user/v1/accounts/${username}`).networkError();

    expect.assertions(1);
    return userAccountApiService.getUserAccount(username)
      .catch((error) => {
        expect(error).toEqual(new Error('Network Error'));
      });
  });
});

describe('UserAccountApiService.saveUserAccount', () => {
  it('returns expected data when successful', () => {
    axiosMock.onPatch(`${process.env.BASE_URL}/api/user/v1/accounts/${username}`)
      .replyOnce(200, userAccount);

    expect.assertions(1);
    return userAccountApiService
      .saveUserAccount(username, toCamel(userAccount, { deep: true }))
      .then((result) => {
        expect(result).toEqual(toCamel(userAccount, { deep: true }));
      });
  });

  it('returns error when unsuccessful', () => {
    axiosMock.onPatch(`${process.env.BASE_URL}/api/user/v1/accounts/${username}`).networkError();

    expect.assertions(1);
    return userAccountApiService
      .saveUserAccount(username, toCamel(userAccount, { deep: true }))
      .catch((error) => {
        expect(error).toEqual(new Error('Network Error'));
      });
  });
});

describe('UserAccountApiService.saveUserProfilePhoto', () => {
  it('returns 204 response when successful', () => {
    axiosMock.onPost(`${process.env.BASE_URL}/api/user/v1/accounts/${username}/image`)
      .replyOnce(204);

    expect.assertions(1);
    return userAccountApiService.saveUserProfilePhoto(username)
      .then((response) => {
        expect(response.status).toEqual(204);
      });
  });
});

describe('UserAccountApiService.deleteUserProfilePhoto', () => {
  it('returns 204 response when successful', () => {
    axiosMock.onDelete(`${process.env.BASE_URL}/api/user/v1/accounts/${username}/image`)
      .replyOnce(204);

    expect.assertions(1);
    return userAccountApiService.deleteUserProfilePhoto(username)
      .then((response) => {
        expect(response.status).toEqual(204);
      });
  });
});
