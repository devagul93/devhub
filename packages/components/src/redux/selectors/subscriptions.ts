import _ from 'lodash'

import {
  ColumnSubscription,
  EnhancedGitHubEvent,
  EnhancedGitHubIssueOrPullRequest,
  EnhancedGitHubNotification,
  sortEvents,
  sortIssuesOrPullRequests,
  sortNotifications,
} from '@devhub/core'
import { RootState } from '../types'
import { createArraySelector } from './helpers'

const emptyArray: any[] = []
const emptyObj = {}

const s = (state: RootState) => state.subscriptions || emptyObj

export const subscriptionIdsSelector = (state: RootState) =>
  s(state).allIds || emptyArray

export const subscriptionSelector = (state: RootState, id: string) =>
  (s(state).byId && s(state).byId[id]) || undefined

export const subscriptionsArrSelector = createArraySelector(
  (state: RootState) => subscriptionIdsSelector(state),
  (state: RootState) => s(state).byId,
  (ids, byId) =>
    byId && ids ? ids.map(id => byId[id]).filter(Boolean) : emptyArray,
)

export const createSubscriptionsDataSelector = () =>
  createArraySelector(
    (state: RootState, subscriptionIds: string[]) =>
      subscriptionIds
        .map(id => subscriptionSelector(state, id))
        .filter(Boolean),
    subscriptions => {
      let items: ColumnSubscription['data']['items']

      subscriptions.forEach(subscription => {
        if (
          !(
            subscription &&
            subscription.data &&
            subscription.data.items &&
            subscription.data.items.length
          )
        )
          return

        if (!items) {
          items = subscription.data.items
        } else if (subscription.data.items) {
          items = [...items, ...subscription.data.items] as any
        }
      })

      if (!(items && items.length)) return emptyArray

      if (subscriptions[0] && subscriptions[0]!.type === 'activity') {
        return sortEvents(items as EnhancedGitHubEvent[])
      }

      if (subscriptions[0] && subscriptions[0]!.type === 'issue_or_pr') {
        return sortIssuesOrPullRequests(
          items as EnhancedGitHubIssueOrPullRequest[],
        )
      }

      if (subscriptions[0] && subscriptions[0]!.type === 'notifications') {
        return sortNotifications(items as EnhancedGitHubNotification[])
      }

      console.error(`Unhandled subscription type: ${subscriptions[0]!.type}`)
      return items
    },
  )
