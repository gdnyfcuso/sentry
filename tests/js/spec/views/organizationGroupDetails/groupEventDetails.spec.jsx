import React from 'react';
import {browserHistory} from 'react-router';

import {mountWithTheme} from 'sentry-test/enzyme';
import {initializeOrg} from 'sentry-test/initializeOrg';

import GroupEventDetails from 'app/views/organizationGroupDetails/groupEventDetails/groupEventDetails';

describe('groupEventDetails', () => {
  let org;
  let project;
  let routerContext;
  let group;
  let event;
  let location;
  let promptsActivity;
  let relatedEvents;

  const mockGroupApis = () => {
    MockApiClient.addMockResponse({
      url: `/issues/${group.id}/`,
      body: group,
    });

    MockApiClient.addMockResponse({
      url: `/issues/${group.id}/events/latest/`,
      statusCode: 200,
      body: event,
    });

    MockApiClient.addMockResponse({
      url: `/projects/${org.slug}/${project.slug}/events/1/`,
      body: event,
    });

    MockApiClient.addMockResponse({
      url: `/projects/${org.slug}/${project.slug}/issues/`,
      method: 'PUT',
    });

    MockApiClient.addMockResponse({
      url: `/projects/${org.slug}/${project.slug}/events/${event.id}/committers/`,
      body: {committers: []},
    });

    MockApiClient.addMockResponse({
      url: `/projects/${org.slug}/${project.slug}/events/${event.id}/owners/`,
      body: {owners: [], rules: []},
    });

    MockApiClient.addMockResponse({
      url: `/issues/${group.id}/participants/`,
      body: [],
    });

    MockApiClient.addMockResponse({
      url: `/issues/${group.id}/tags/`,
      body: [],
    });

    MockApiClient.addMockResponse({
      url: `/groups/${group.id}/integrations/`,
      body: [],
    });

    MockApiClient.addMockResponse({
      url: `/groups/${group.id}/external-issues/`,
    });

    MockApiClient.addMockResponse({
      url: `/projects/${org.slug}/${project.slug}/releases/completion/`,
      body: [],
    });

    MockApiClient.addMockResponse({
      url: '/promptsactivity/',
      body: promptsActivity,
    });

    MockApiClient.addMockResponse({
      url: `/projects/${org.slug}/${project.slug}/events/${event.id}/grouping-info/`,
      body: {},
    });
  };

  beforeEach(() => {
    const props = initializeOrg();
    org = props.organization;
    project = props.project;
    project.organization = org;
    routerContext = props.routerContext;
    relatedEvents = [
      {
        'event.type': 'transaction',
        id: 'transactiontest1',
        issue: 'unknown',
        'issue.id': '',
        lastSeen: '',
        project: 'issues',
        'project.id': 2,
        timestamp: '2020-08-10T13:25:27+00:00',
        title: 'GET /users',
        'trace.span': 'transaction1',
      },
      {
        'event.type': 'error',
        id: 'errortest1',
        issue: 'unknown',
        'issue.id': '',
        lastSeen: '',
        project: 'issues',
        'project.id': 2,
        timestamp: '2020-08-10T13:24:26+00:00',
        title: '/',
        'trace.span': 'error1',
      },
    ];

    group = TestStubs.Group();
    event = TestStubs.Event({
      size: 1,
      dateCreated: '2019-03-20T00:00:00.000Z',
      errors: [],
      entries: [],
      tags: [{key: 'environment', value: 'dev'}],
      contexts: {
        trace: {
          type: 'transaction',
          trace_id: '1',
        },
      },
    });

    location = TestStubs.location({
      pathname: `/organizations/${org.slug}/${project.slug}/${event.groupID}/`,
    });

    mockGroupApis();

    MockApiClient.addMockResponse({
      url: '/organizations/org-slug/eventsv2/',
      body: {
        data: relatedEvents,
        meta: undefined,
      },
    });

    MockApiClient.addMockResponse({
      url: '/sentry-apps/',
      body: [],
    });

    MockApiClient.addMockResponse({
      url: `/organizations/${org.slug}/sentry-apps/`,
      body: [],
    });

    MockApiClient.addMockResponse({
      url: `/organizations/${org.slug}/sentry-app-installations/`,
      body: [],
    });

    MockApiClient.addMockResponse({
      url: `/organizations/${org.slug}/sentry-app-components/?projectId=${project.id}`,
      body: [],
    });
  });

  afterEach(function() {
    MockApiClient.clearMockResponses();
    browserHistory.replace.mockClear();
  });

  it('redirects on switching to an invalid environment selection for event', async function() {
    const wrapper = mountWithTheme(
      <GroupEventDetails
        api={new MockApiClient()}
        group={group}
        project={project}
        organization={org}
        environments={[{id: '1', name: 'dev', displayName: 'Dev'}]}
        params={{orgId: org.slug, groupId: group.id, eventId: '1'}}
        event={event}
        location={location}
      />,
      routerContext
    );
    await tick();
    expect(browserHistory.replace).not.toHaveBeenCalled();
    wrapper.setProps({environments: [{id: '1', name: 'prod', displayName: 'Prod'}]});
    await tick();

    expect(browserHistory.replace).toHaveBeenCalled();
  });

  it('does not redirect when switching to a valid environment selection for event', async function() {
    const wrapper = mountWithTheme(
      <GroupEventDetails
        api={new MockApiClient()}
        group={group}
        project={project}
        organization={org}
        environments={[{id: '1', name: 'dev', displayName: 'Dev'}]}
        params={{orgId: org.slug, group: group.id, eventId: '1'}}
        event={event}
        location={location}
      />,
      routerContext
    );
    await tick();
    expect(browserHistory.replace).not.toHaveBeenCalled();
    wrapper.setProps({environments: []});
    await tick();

    expect(browserHistory.replace).not.toHaveBeenCalled();
  });

  it('next/prev links', async function() {
    event = TestStubs.Event({
      size: 1,
      dateCreated: '2019-03-20T00:00:00.000Z',
      errors: [],
      entries: [],
      tags: [{key: 'environment', value: 'dev'}],
      previousEventID: 'prev-event-id',
      nextEventID: 'next-event-id',
    });

    MockApiClient.addMockResponse({
      url: `/projects/${org.slug}/${project.slug}/events/1/`,
      body: event,
    });

    const wrapper = mountWithTheme(
      <GroupEventDetails
        api={new MockApiClient()}
        group={group}
        project={project}
        organization={org}
        environments={[{id: '1', name: 'dev', displayName: 'Dev'}]}
        params={{orgId: org.slug, groupId: group.id, eventId: '1'}}
        event={event}
        location={{...location, query: {environment: 'dev'}}}
      />,
      routerContext
    );
    await tick();

    wrapper.update();

    const buttons = wrapper
      .find('.event-toolbar')
      .find('ButtonBar')
      .find('Button');

    expect(buttons.at(0).prop('to')).toEqual({
      pathname: '/organizations/org-slug/issues/1/events/oldest/',
      query: {environment: 'dev'},
    });

    expect(buttons.at(1).prop('to')).toEqual({
      pathname: '/organizations/org-slug/issues/1/events/prev-event-id/',
      query: {environment: 'dev'},
    });
    expect(buttons.at(2).prop('to')).toEqual({
      pathname: '/organizations/org-slug/issues/1/events/next-event-id/',
      query: {environment: 'dev'},
    });
    expect(buttons.at(3).prop('to')).toEqual({
      pathname: '/organizations/org-slug/issues/1/events/latest/',
      query: {environment: 'dev'},
    });
  });

  describe('EventCauseEmpty', () => {
    const proj = TestStubs.Project({firstEvent: '2020-01-01T01:00:00Z'});

    it('renders empty state', async function() {
      MockApiClient.addMockResponse({
        url: `/projects/${org.slug}/${project.slug}/releases/completion/`,
        body: [
          {
            step: 'commit',
            complete: false,
          },
        ],
      });

      const wrapper = mountWithTheme(
        <GroupEventDetails
          api={new MockApiClient()}
          group={group}
          project={proj}
          organization={org}
          environments={[{id: '1', name: 'dev', displayName: 'Dev'}]}
          params={{orgId: org.slug, groupId: group.id, eventId: '1'}}
          event={event}
          location={{...location, query: {environment: 'dev'}}}
        />,
        routerContext
      );
      await tick();
      wrapper.update();

      expect(wrapper.find('EventCause').exists()).toBe(false);
      expect(wrapper.find('EventCauseEmpty').exists()).toBe(true);
    });

    it('renders suspect commit', async function() {
      MockApiClient.addMockResponse({
        url: `/projects/${org.slug}/${project.slug}/releases/completion/`,
        body: [
          {
            step: 'commit',
            complete: true,
          },
        ],
      });

      const wrapper = mountWithTheme(
        <GroupEventDetails
          api={new MockApiClient()}
          group={group}
          project={proj}
          organization={org}
          environments={[{id: '1', name: 'dev', displayName: 'Dev'}]}
          params={{orgId: org.slug, groupId: group.id, eventId: '1'}}
          event={event}
          location={{...location, query: {environment: 'dev'}}}
        />,
        routerContext
      );
      await tick();
      wrapper.update();

      expect(wrapper.find('EventCause').exists()).toBe(true);
      expect(wrapper.find('EventCauseEmpty').exists()).toBe(false);
    });

    it('renders suspect commit if `releasesCompletion` empty', async function() {
      MockApiClient.addMockResponse({
        url: `/projects/${org.slug}/${project.slug}/releases/completion/`,
        body: [],
      });

      const wrapper = mountWithTheme(
        <GroupEventDetails
          api={new MockApiClient()}
          group={group}
          project={proj}
          organization={org}
          environments={[{id: '1', name: 'dev', displayName: 'Dev'}]}
          params={{orgId: org.slug, groupId: group.id, eventId: '1'}}
          event={event}
          location={{...location, query: {environment: 'dev'}}}
        />,
        routerContext
      );

      await tick();
      wrapper.update();

      expect(wrapper.find('EventCause').exists()).toBe(true);
      expect(wrapper.find('EventCauseEmpty').exists()).toBe(false);
    });

    it('renders suspect commit if `releasesCompletion` null', async function() {
      MockApiClient.addMockResponse({
        url: `/projects/${org.slug}/${project.slug}/releases/completion/`,
        body: null,
      });

      const wrapper = mountWithTheme(
        <GroupEventDetails
          api={new MockApiClient()}
          group={group}
          project={proj}
          organization={org}
          environments={[{id: '1', name: 'dev', displayName: 'Dev'}]}
          params={{orgId: org.slug, groupId: group.id, eventId: '1'}}
          event={event}
          location={{...location, query: {environment: 'dev'}}}
        />,
        routerContext
      );
      await tick();
      wrapper.update();

      expect(wrapper.find('EventCause').exists()).toBe(true);
      expect(wrapper.find('EventCauseEmpty').exists()).toBe(false);
    });

    it('renders Related Events if issues page - empty state', async function() {
      const wrapper = mountWithTheme(
        <GroupEventDetails
          api={new MockApiClient()}
          group={group}
          project={project}
          organization={{...org, features: ['related-events']}}
          environments={[{id: '1', name: 'dev', displayName: 'Dev'}]}
          params={{orgId: org.slug, groupId: group.id, eventId: '1'}}
          event={{...event, contexts: {}}}
          location={location}
        />,
        routerContext
      );
      await tick();
      wrapper.update();

      const eventRelatedEvents = wrapper.find('EventRelatedEvents');
      expect(eventRelatedEvents).toHaveLength(1);

      expect(eventRelatedEvents.find('h3').text()).toEqual('Related Events');

      const emptyStateElement = eventRelatedEvents.find('EmptyStateWarning');
      expect(emptyStateElement).toHaveLength(1);
      expect(emptyStateElement.text()).toEqual(
        'No related events have been found for the last 24 hours.'
      );
    });

    it('renders Related Events if issues page - displays a list of Related Events', async function() {
      const wrapper = mountWithTheme(
        <GroupEventDetails
          api={new MockApiClient()}
          group={group}
          project={project}
          organization={{...org, features: ['related-events']}}
          environments={[{id: '1', name: 'dev', displayName: 'Dev'}]}
          params={{orgId: org.slug, groupId: group.id, eventId: '1'}}
          event={event}
          location={location}
        />,
        routerContext
      );
      await tick();
      wrapper.update();

      const eventRelatedEvents = wrapper.find('EventRelatedEvents');
      expect(eventRelatedEvents).toHaveLength(1);

      expect(eventRelatedEvents.find('h3').text()).toEqual('Related Events');

      const emptyStateElement = eventRelatedEvents.find('EmptyStateWarning');
      expect(emptyStateElement).toHaveLength(0);

      const openInDiscoverButton = eventRelatedEvents.find('Button');
      expect(openInDiscoverButton).toHaveLength(0);

      const panelTable = eventRelatedEvents.find('PanelTable');
      expect(panelTable).toHaveLength(1);

      const paneltableHeader = panelTable.find('PanelTableHeader');
      expect(paneltableHeader).toHaveLength(5);

      const panelItems = panelTable.find('StyledPanelItem');
      expect(panelItems).toHaveLength(10);

      const styledLinks = panelItems.find('StyledLink');
      expect(styledLinks).toHaveLength(2);
      expect(styledLinks.at(0).text()).toEqual(relatedEvents[0].id);
      expect(styledLinks.at(1).text()).toEqual(relatedEvents[1].id);
    });
  });

  describe('Platform Integrations', () => {
    let wrapper; // eslint-disable-line
    let componentsRequest;

    const mountWithThemeWrapper = () =>
      mountWithTheme(
        <GroupEventDetails
          api={new MockApiClient()}
          group={group}
          project={project}
          organization={org}
          environments={[{id: '1', name: 'dev', displayName: 'Dev'}]}
          params={{orgId: org.slug, groupId: group.id, eventId: '1'}}
          event={event}
          location={{...location, query: {environment: 'dev'}}}
        />,
        routerContext
      );

    beforeEach(() => {
      const unpublishedIntegration = TestStubs.SentryApp({status: 'unpublished'});
      const internalIntegration = TestStubs.SentryApp({status: 'internal'});

      const unpublishedInstall = TestStubs.SentryAppInstallation({
        app: {
          slug: unpublishedIntegration.slug,
          uuid: unpublishedIntegration.uuid,
        },
      });

      const internalInstall = TestStubs.SentryAppInstallation({
        app: {
          slug: internalIntegration.slug,
          uuid: internalIntegration.uuid,
        },
      });

      const component = TestStubs.SentryAppComponent({
        sentryApp: {
          uuid: unpublishedIntegration.uuid,
          slug: unpublishedIntegration.slug,
          name: unpublishedIntegration.name,
        },
      });

      MockApiClient.clearMockResponses();
      mockGroupApis();

      componentsRequest = MockApiClient.addMockResponse({
        url: `/organizations/${org.slug}/sentry-app-components/?projectId=${project.id}`,
        body: [component],
      });

      MockApiClient.addMockResponse({
        url: `/organizations/${org.slug}/sentry-app-installations/`,
        body: [unpublishedInstall, internalInstall],
      });

      wrapper = mountWithThemeWrapper();
    });

    it('loads Integration UI components', () => {
      expect(componentsRequest).toHaveBeenCalled();
    });
  });
});
