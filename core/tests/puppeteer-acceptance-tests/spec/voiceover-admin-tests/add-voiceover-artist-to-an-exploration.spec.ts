// Copyright 2024 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utility functions for voiceover admin page if voiceover admin
 * can add voiceover artist to an exploration
 */

import {UserFactory} from '../../puppeteer-testing-utilities/user-factory';
import {VoiceoverAdmin} from '../../user-utilities/voiceover-admin-utils';
import {ExplorationEditor} from '../../user-utilities/exploration-creator-utils';
import testConstants from '../../puppeteer-testing-utilities/test-constants';
import {ConsoleReporter} from '../../puppeteer-testing-utilities/console-reporter';

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;
const ROLES = testConstants.Roles;
const invalidIdErrorToastMessage =
  'Sorry, we could not find the specified user.';

// The backend 400 error is a known consequence of adding an invalid user ID.
// By ignoring it, we prevent noise in the test output and focus on other unexpected errors.
//
// The frontend toast message is directly asserted by test case, ensuring it is displayed correctly.

ConsoleReporter.setConsoleErrorsToIgnore([
  new RegExp(
    'http://localhost:8181/voice_artist_management_handler/exploration/.*Failed to load resource: the server responded with a status of 400'
  ),
  new RegExp('Sorry, we could not find the specified user.'),
]);

describe('Voiceover Admin', function () {
  let voiceoverAdmin: VoiceoverAdmin;
  let explorationEditor: ExplorationEditor;
  let explorationId: string | null;

  beforeAll(async function () {
    voiceoverAdmin = await UserFactory.createNewUser(
      'voiceoverAdm',
      'voiceover_admin@example.com',
      [ROLES.VOICEOVER_ADMIN]
    );

    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_creator@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT);

  it(
    'should be able to see error while adding an invalid user as a voiceover artist to an exploration',
    async function () {
      await explorationEditor.navigateToCreatorDashboardPage();
      await explorationEditor.navigateToExplorationEditorPage();
      await explorationEditor.dismissWelcomeModal();

      await explorationEditor.createExplorationWithTitle('Exploration one');
      explorationId =
        await explorationEditor.publishExplorationWithTitle('Exploration one');

      await voiceoverAdmin.navigateToExplorationEditor(explorationId);
      await voiceoverAdmin.dismissWelcomeModal();

      await voiceoverAdmin.navigateToExplorationSettingsTab();

      await voiceoverAdmin.expectVoiceoverArtistsListDoesNotContain(
        'invalidUserId'
      );
      await voiceoverAdmin.addVoiceoverArtistToExploration('invalidUserId');

      await voiceoverAdmin.expectToSeeErrorToastMessage(
        invalidIdErrorToastMessage
      );
      await voiceoverAdmin.closeToastMessage();
      await voiceoverAdmin.verifyVoiceoverArtistStillOmitted('invalidUserId');
    },
    DEFAULT_SPEC_TIMEOUT
  );

  it(
    'should be able to add regular user as voiceover artist to an exploration',
    async function () {
      await UserFactory.createNewUser(
        'voiceoverartist',
        'voiceoverartist@example.com'
      );
      await explorationEditor.navigateToCreatorDashboardPage();
      await explorationEditor.navigateToExplorationEditorPage();

      await explorationEditor.createExplorationWithTitle('Exploration two');
      explorationId =
        await explorationEditor.publishExplorationWithTitle('Exploration two');

      await voiceoverAdmin.navigateToExplorationEditor(explorationId);
      await voiceoverAdmin.navigateToExplorationSettingsTab();

      await voiceoverAdmin.expectVoiceoverArtistsListDoesNotContain(
        'voiceoverartist'
      );
      await voiceoverAdmin.addVoiceoverArtistToExploration('voiceoverartist');

      await voiceoverAdmin.expectVoiceoverArtistsListContains(
        'voiceoverartist'
      );
    },
    DEFAULT_SPEC_TIMEOUT
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
