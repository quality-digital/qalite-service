import { readJsonBody } from '../http/request.js'
import { sendJson } from '../http/response.js'
import type { TaskSummaryService } from '../services/task-summary.service.js'
import type { HttpHandler } from '../types/http.js'
import { validateTaskSummary } from '../validators/task-summary.validator.js'

export const createTaskSummaryHandler =
  (service: TaskSummaryService): HttpHandler =>
  async (req, res) => {
    const payload = await readJsonBody(req)
    const input = validateTaskSummary(payload)

    await service.send(input)
    sendJson(res, 200, { message: 'Slack task summary sent.' })
  }
