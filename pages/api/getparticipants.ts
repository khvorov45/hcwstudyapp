import { NextApiRequest, NextApiResponse } from 'next'
import db from '../../lib/db'

export default async function (req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).end()
    return
  }
  if (!req.query.email || !req.query.token) {
    res.status(401).end()
    return
  }
  const email = req.query.email.toString().toLowerCase()
  const token = req.query.token.toString()
  if (!await db.authoriseUser(email, token)) {
    res.status(401).end()
    return
  }
  let accessGroup: string
  const actualAccessGroup = await db.getUserAccessGroup(email)
  if (!req.query.accessGroup) {
    accessGroup = actualAccessGroup
  } else if (
    ['unrestricted', 'admin'].includes(actualAccessGroup) ||
      actualAccessGroup === req.query.accessGroup.toString()
  ) {
    accessGroup = req.query.accessGroup.toString()
  } else {
    res.status(401).end()
    return
  }
  let data: any
  const getters = {
    contact: () => db.getParticipantsContact(accessGroup),
    baseline: () => db.getParticipantsBaseline(accessGroup),
    'schedule-long': () => db.getParticipantsSchedule(accessGroup, false),
    'schedule-wide': () => db.getParticipantsSchedule(accessGroup, true),
    weeklysurvey: () => db.getParticipantsWeeklySurveys(accessGroup),
    weeklycompletion: () => db.getParticipantsWeeklyCompletion(accessGroup)
  }
  if (!req.query.subset) {
    data = await db.getParticipants(accessGroup)
  } else if (Object.keys(getters).includes(req.query.subset.toString())) {
    data = await getters[req.query.subset.toString()]()
  } else {
    res.status(404).end()
    return
  }
  res.status(200).send(data)
}
