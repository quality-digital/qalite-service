import type { TaskSummaryService } from '../services/task-summary.service.js'
import { readJsonBody } from '../utils/request.js'
import { sendJson } from '../utils/response.js'
import type { HttpHandler } from '../utils/http.js'
import { validateTaskSummary } from '../validators/task-summary.validator.js'

export const createTaskSummaryController = (
  taskSummaryService: TaskSummaryService,
): HttpHandler =>
  async function taskSummaryController(req, res) {
    const input = validateTaskSummary(await readJsonBody(req))

    await taskSummaryService.send(input)
    sendJson(res, 200, { message: 'Slack task summary sent.' })
  }
