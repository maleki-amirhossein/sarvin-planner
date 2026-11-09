// Generated from OpenAPI; do not edit.
export const routes = {
  "getCsrf": {
    "method": "GET",
    "path": "/auth/csrf"
  },
  "login": {
    "method": "POST",
    "path": "/auth/login"
  },
  "getSession": {
    "method": "GET",
    "path": "/auth/me"
  },
  "logout": {
    "method": "POST",
    "path": "/auth/logout"
  },
  "revokeAllSessions": {
    "method": "POST",
    "path": "/auth/revoke-all"
  },
  "changePassword": {
    "method": "POST",
    "path": "/auth/change-password"
  },
  "listTasks": {
    "method": "GET",
    "path": "/tasks"
  },
  "createTask": {
    "method": "POST",
    "path": "/tasks"
  },
  "getTask": {
    "method": "GET",
    "path": "/tasks/{id}"
  },
  "updateTask": {
    "method": "PATCH",
    "path": "/tasks/{id}"
  },
  "deleteTask": {
    "method": "DELETE",
    "path": "/tasks/{id}"
  },
  "getTaskOccurrence": {
    "method": "GET",
    "path": "/task-occurrences/{id}"
  },
  "updateTaskOccurrence": {
    "method": "PATCH",
    "path": "/task-occurrences/{id}"
  },
  "deleteTaskOccurrence": {
    "method": "DELETE",
    "path": "/task-occurrences/{id}"
  },
  "listTaskSeries": {
    "method": "GET",
    "path": "/task-series"
  },
  "createTaskSeries": {
    "method": "POST",
    "path": "/task-series"
  },
  "updateTaskSeries": {
    "method": "PATCH",
    "path": "/task-series/{id}"
  },
  "deleteTaskSeries": {
    "method": "DELETE",
    "path": "/task-series/{id}"
  },
  "getSchedule": {
    "method": "GET",
    "path": "/schedule"
  },
  "previewRecurrence": {
    "method": "POST",
    "path": "/schedule/preview"
  },
  "listFixedSchedules": {
    "method": "GET",
    "path": "/fixed-schedules"
  },
  "createFixedSchedule": {
    "method": "POST",
    "path": "/fixed-schedules"
  },
  "updateFixedSchedule": {
    "method": "PATCH",
    "path": "/fixed-schedules/{id}"
  },
  "deleteFixedSchedule": {
    "method": "DELETE",
    "path": "/fixed-schedules/{id}"
  },
  "listExceptions": {
    "method": "GET",
    "path": "/fixed-schedules/{id}/exceptions"
  },
  "createException": {
    "method": "POST",
    "path": "/fixed-schedules/{id}/exceptions"
  },
  "updateException": {
    "method": "PATCH",
    "path": "/fixed-schedules/{id}/exceptions/{exceptionId}"
  },
  "removeException": {
    "method": "DELETE",
    "path": "/fixed-schedules/{id}/exceptions/{exceptionId}"
  },
  "getDailyPriorities": {
    "method": "GET",
    "path": "/daily-priorities/{date}"
  },
  "setDailyPriorities": {
    "method": "PUT",
    "path": "/daily-priorities/{date}"
  },
  "listBooks": {
    "method": "GET",
    "path": "/books"
  },
  "createBook": {
    "method": "POST",
    "path": "/books"
  },
  "updateBook": {
    "method": "PATCH",
    "path": "/books/{id}"
  },
  "deleteBook": {
    "method": "DELETE",
    "path": "/books/{id}"
  },
  "listReadingSessions": {
    "method": "GET",
    "path": "/reading-sessions"
  },
  "createReadingSession": {
    "method": "POST",
    "path": "/reading-sessions"
  },
  "updateReadingSession": {
    "method": "PATCH",
    "path": "/reading-sessions/{id}"
  },
  "deleteReadingSession": {
    "method": "DELETE",
    "path": "/reading-sessions/{id}"
  },
  "quickReading": {
    "method": "POST",
    "path": "/reading-sessions/quick"
  },
  "getWeeklyGoal": {
    "method": "GET",
    "path": "/weekly-goals/{weekStart}"
  },
  "setWeeklyGoal": {
    "method": "PUT",
    "path": "/weekly-goals/{weekStart}"
  },
  "deleteWeeklyGoal": {
    "method": "DELETE",
    "path": "/weekly-goals/{weekStart}"
  },
  "getWeeklyReport": {
    "method": "GET",
    "path": "/reports/weekly"
  },
  "getSettings": {
    "method": "GET",
    "path": "/settings"
  },
  "updateSettings": {
    "method": "PATCH",
    "path": "/settings"
  },
  "completeOnboarding": {
    "method": "POST",
    "path": "/settings/onboarding"
  },
  "exportData": {
    "method": "GET",
    "path": "/export"
  },
  "health": {
    "method": "GET",
    "path": "/health"
  },
  "liveness": {
    "method": "GET",
    "path": "/health/live"
  },
  "listTaskOccurrences": {
    "method": "GET",
    "path": "/task-occurrences"
  }
} as const;
