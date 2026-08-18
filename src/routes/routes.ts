import { createTaskSummaryController } from '../controllers/task-summary.controller.js'
import type { TaskSummaryService } from '../services/task-summary.service.js'
import type { RouteTable } from '../utils/http.js'

export const createRoutes = (taskSummaryService: TaskSummaryService): RouteTable => ({
  '/slack/task-summary': {
    POST: createTaskSummaryController(taskSummaryService),
  },
})
