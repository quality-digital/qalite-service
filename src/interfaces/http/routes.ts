import type { SendTaskSummaryUseCase } from '../../application/usecases/send-task-summary.js'
import type { TaskSummaryPayload } from '../../domain/entities/task-summary.js'
import { readJsonBody } from './http-request.js'
import { json } from './http-response.js'
import type { RouteHandler, RouteTable } from './router.js'

interface RouteDependencies {
  sendTaskSummary: SendTaskSummaryUseCase
}

const buildSlackSummaryHandler = (
  sendTaskSummary: SendTaskSummaryUseCase,
): RouteHandler => {
  return async (req, res) => {
    const payload = await readJsonBody<TaskSummaryPayload>(req)
    await sendTaskSummary.execute(payload)
    json(res, 200, { message: 'Slack task summary sent.' })
  }
}

export const buildRouteTable = ({ sendTaskSummary }: RouteDependencies): RouteTable => ({
  '/slack/task-summary': {
    POST: buildSlackSummaryHandler(sendTaskSummary),
  },
})
