import React from 'react';
import styled from '@emotion/styled';
import capitalize from 'lodash/capitalize';
import {Location} from 'history';

import space from 'app/styles/space';
import {t} from 'app/locale';
import DateTime from 'app/components/dateTime';
import {Organization} from 'app/types';
import EventView from 'app/utils/discover/eventView';
import {getTransactionDetailsUrl} from 'app/views/performance/utils';
import {PanelTable, PanelItem} from 'app/components/panels';
import PlatformIcon from 'app/components/platformIcon';
import Link from 'app/components/links/link';
import {TableDataRow} from 'app/utils/discover/discoverQuery';
import Tooltip from 'app/components/tooltip';
import {generateEventSlug, eventDetailsRouteWithEventView} from 'app/utils/discover/urls';
import {IconClock, IconFire, IconSpan} from 'app/icons';
import TimeSince from 'app/components/timeSince';

import {CURRENT_LOCATION} from './types';

enum EVENT_TYPE {
  ERROR = 'error',
  TRANSACTION = 'transaction',
}

type Props = {
  relatedEvents: Array<TableDataRow>;
  eventView: EventView;
  organization: Organization;
  currentLocation: CURRENT_LOCATION;
  location: Location;
};

// List events that have the same tracing ID as the current Event
const RelatedEvents = ({
  currentLocation,
  eventView,
  relatedEvents,
  organization,
  location,
}: Props) => {
  const orgSlug = organization.slug;

  const getTransactionLink = (transactionName: string, eventSlug: string) => {
    return getTransactionDetailsUrl(
      organization,
      eventSlug,
      transactionName,
      location.query
    );
  };

  const getEventTarget = (dataRow: TableDataRow & {type: EVENT_TYPE}) => {
    if (currentLocation === CURRENT_LOCATION.DISCOVER) {
      const eventSlug = generateEventSlug(dataRow);

      return eventDetailsRouteWithEventView({
        orgSlug,
        eventSlug,
        eventView,
      });
    }

    if (dataRow.type === EVENT_TYPE.ERROR) {
      return `/organizations/${orgSlug}/issues/${dataRow['issue.id']}/events/${dataRow.id}/`;
    }

    const eventSlug = generateEventSlug(dataRow);

    return getTransactionLink(String(dataRow.title), eventSlug);
  };

  const renderEventId = (dataRow: TableDataRow & {type: EVENT_TYPE}) => (
    <Tooltip title={t('View Event')}>
      <StyledLink to={getEventTarget(dataRow)}>
        {dataRow.id as React.ReactNode}
      </StyledLink>
    </Tooltip>
  );

  const renderIcon = (type: EVENT_TYPE) => {
    if (type === EVENT_TYPE.ERROR) {
      return <IconFire color="red400" />;
    }
    return <IconSpan color="pink400" />;
  };

  return (
    <PanelTable headers={[t('Id'), t('Title'), t('Type'), t('Project'), t('Created')]}>
      {relatedEvents.map((row, index) => {
        const {id, title, project, timestamp} = row;

        const eventType = row['event.type'] as EVENT_TYPE;
        const isLast = index === relatedEvents.length - 1;

        return (
          <React.Fragment key={id}>
            <StyledPanelItem isLast={isLast}>
              {renderEventId({...row, type: eventType})}
            </StyledPanelItem>
            <StyledPanelItem isLast={isLast}>{title}</StyledPanelItem>
            <StyledPanelItem isLast={isLast}>
              <TypeWrapper>
                {renderIcon(eventType)}
                {capitalize(eventType)}
              </TypeWrapper>
            </StyledPanelItem>
            <StyledPanelItem isLast={isLast}>
              <StyledPlatformIcon platform={String(project)} size="16px" />
              {project}
            </StyledPanelItem>
            <StyledPanelItem isLast={isLast}>
              <TimeWrapper>
                <IconClock size="16px" />
                <StyledTimeSince date={timestamp} />
                <div>{'\u2014'}</div>
                <DateTime date={timestamp} />
              </TimeWrapper>
            </StyledPanelItem>
          </React.Fragment>
        );
      })}
    </PanelTable>
  );
};

export default RelatedEvents;

const StyledPanelItem = styled(PanelItem)<{isLast: boolean}>`
  padding: ${space(1)} ${space(2)};
  font-size: ${p => p.theme.fontSizeMedium};
  align-items: center;
  ${p => p.isLast && `border-bottom: none`};
`;

const StyledPlatformIcon = styled(PlatformIcon)`
  border-radius: ${p => p.theme.borderRadius};
  box-shadow: 0 0 0 1px ${p => p.theme.white};
  margin-right: ${space(1)};
`;

const StyledTimeSince = styled(TimeSince)`
  color: ${p => p.theme.gray800};
`;

const StyledLink = styled(Link)`
  > div {
    display: inline;
  }
`;

const TimeWrapper = styled('div')`
  display: grid;
  grid-template-columns: max-content max-content max-content max-content;
  grid-gap: ${space(1)};
  align-items: center;
  color: ${p => p.theme.gray500};
`;

const TypeWrapper = styled('div')`
  display: grid;
  grid-template-columns: max-content 1fr;
  grid-gap: ${space(1)};
  align-items: center;
`;