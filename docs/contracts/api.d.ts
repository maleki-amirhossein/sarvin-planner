// Generated from openapi.json by pnpm contracts:generate. Do not edit.
export interface paths {
    "/auth/csrf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Initialize session-bound CSRF token
         * @description Initialize session-bound CSRF token
         */
        get: operations["getCsrf"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Log in the single owner
         * @description Allowed Origin and CSRF token required; generic failures, finite PostgreSQL session, fresh session ID on success. Secure production cookie; no public signup.
         */
        post: operations["login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read current owner and expiry
         * @description Read current owner and expiry
         */
        get: operations["getSession"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Revoke current session and clear cookie
         * @description Revoke current session and clear cookie
         */
        post: operations["logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/revoke-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Revoke every owner session and clear cookie
         * @description Revoke every owner session and clear cookie
         */
        post: operations["revokeAllSessions"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/change-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Verify current password and revoke all sessions
         * @description Verify current password and revoke all sessions
         */
        post: operations["changePassword"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List owner tasks
         * @description Cursor-paginated task metadata. Status/view filters apply to concrete one-off occurrences; recurring templates are managed through task-series and bounded schedule queries. Do not return an unbounded array of occurrence IDs.
         */
        get: operations["listTasks"];
        put?: never;
        /**
         * Create task and unscheduled occurrence atomically
         * @description Create task and unscheduled occurrence atomically
         */
        post: operations["createTask"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tasks/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read task
         * @description Read task
         */
        get: operations["getTask"];
        put?: never;
        post?: never;
        /**
         * Soft-delete one-off task and retain reading history
         * @description Reject recurring task deletion without a series scope; transactionally preserve reading records and snapshot labels.
         */
        delete: operations["deleteTask"];
        options?: never;
        head?: never;
        /**
         * Update one-off task metadata
         * @description Recurring template edits require explicit series scope. Do not silently rewrite historical occurrence snapshots.
         */
        patch: operations["updateTask"];
        trace?: never;
    };
    "/task-occurrences/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read task occurrence
         * @description Read task occurrence
         */
        get: operations["getTaskOccurrence"];
        put?: never;
        post?: never;
        /**
         * Cancel one occurrence without changing its series
         * @description Cancel one occurrence without changing its series
         */
        delete: operations["deleteTaskOccurrence"];
        options?: never;
        head?: never;
        /**
         * Schedule, move, resize, unschedule, complete, or reopen
         * @description Check version and owner schedule revision inside one serialized transaction. A conflictSnapshot confirms only the exact reviewed mutation and conflict set. Fixed events are rejected.
         */
        patch: operations["updateTaskOccurrence"];
        trace?: never;
    };
    "/task-series": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List recurring task segments
         * @description List recurring task segments
         */
        get: operations["listTaskSeries"];
        put?: never;
        /**
         * Create recurring task definition
         * @description Create recurring task definition
         */
        post: operations["createTaskSeries"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/task-series/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Cancel one occurrence or terminate future series
         * @description Cancel one occurrence or terminate future series
         */
        delete: operations["deleteTaskSeries"];
        options?: never;
        head?: never;
        /**
         * Edit one occurrence or this and future
         * @description Edit one occurrence or this and future
         */
        patch: operations["updateTaskSeries"];
        trace?: never;
    };
    "/schedule": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read bounded combined schedule and day statistics
         * @description Return intersecting intervals, including moved-in exceptions and midnight continuation. Saturday-first local dates, max93 days and1000 occurrences; 400 RANGE_TOO_LARGE instead of truncation.
         */
        get: operations["getSchedule"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/schedule/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Expand a rule without storing it
         * @description Expand a rule without storing it
         */
        post: operations["previewRecurrence"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/fixed-schedules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List fixed schedules
         * @description List fixed schedules
         */
        get: operations["listFixedSchedules"];
        put?: never;
        /**
         * Create work/class series
         * @description Create work/class series
         */
        post: operations["createFixedSchedule"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/fixed-schedules/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Cancel occurrence or terminate fixed series
         * @description Cancel occurrence or terminate fixed series
         */
        delete: operations["deleteFixedSchedule"];
        options?: never;
        head?: never;
        /**
         * Scope-aware fixed schedule edit
         * @description Scope-aware fixed schedule edit
         */
        patch: operations["updateFixedSchedule"];
        trace?: never;
    };
    "/fixed-schedules/{id}/exceptions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List persisted exceptions
         * @description List persisted exceptions
         */
        get: operations["listExceptions"];
        put?: never;
        /**
         * Cancel or override a fixed occurrence
         * @description Cancel or override a fixed occurrence
         */
        post: operations["createException"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/fixed-schedules/{id}/exceptions/{exceptionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Restore series behavior after conflict recheck
         * @description Restore series behavior after conflict recheck
         */
        delete: operations["removeException"];
        options?: never;
        head?: never;
        /**
         * Update a fixed occurrence exception
         * @description Update a fixed occurrence exception
         */
        patch: operations["updateException"];
        trace?: never;
    };
    "/daily-priorities/{date}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read up to three daily priorities
         * @description Read up to three daily priorities
         */
        get: operations["getDailyPriorities"];
        /**
         * Replace ordered daily priorities atomically
         * @description Replace ordered daily priorities atomically
         */
        put: operations["setDailyPriorities"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/books": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List books
         * @description List books
         */
        get: operations["listBooks"];
        put?: never;
        /**
         * Create Book
         * @description Create Book
         */
        post: operations["createBook"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/books/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Delete Book with explicit history policy
         * @description Book removal preserves reading records and title snapshots. Reading deletion changes aggregates but never silently changes task status.
         */
        delete: operations["deleteBook"];
        options?: never;
        head?: never;
        /**
         * Edit Book
         * @description Edit Book
         */
        patch: operations["updateBook"];
        trace?: never;
    };
    "/reading-sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List reading-sessions
         * @description List reading-sessions
         */
        get: operations["listReadingSessions"];
        put?: never;
        /**
         * Create ReadingSession
         * @description Create ReadingSession
         */
        post: operations["createReadingSession"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reading-sessions/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Delete ReadingSession with explicit history policy
         * @description Book removal preserves reading records and title snapshots. Reading deletion changes aggregates but never silently changes task status.
         */
        delete: operations["deleteReadingSession"];
        options?: never;
        head?: never;
        /**
         * Edit ReadingSession
         * @description Edit ReadingSession
         */
        patch: operations["updateReadingSession"];
        trace?: never;
    };
    "/reading-sessions/quick": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Log actual date + start time + duration
         * @description Log actual date + start time + duration
         */
        post: operations["quickReading"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/weekly-goals/{weekStart}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read goal/default/no-goal and actual progress
         * @description Read goal/default/no-goal and actual progress
         */
        get: operations["getWeeklyGoal"];
        /**
         * Set an explicit goal for one Saturday week
         * @description Set an explicit goal for one Saturday week
         */
        put: operations["setWeeklyGoal"];
        post?: never;
        /**
         * Remove explicit weekly goal; applicable default may remain
         * @description Remove explicit weekly goal; applicable default may remain
         */
        delete: operations["deleteWeeklyGoal"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reports/weekly": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read week KPIs and actual reading
         * @description Read week KPIs and actual reading
         */
        get: operations["getWeeklyReport"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/settings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read settings
         * @description Read settings
         */
        get: operations["getSettings"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Update prospective defaults
         * @description Update prospective defaults
         */
        patch: operations["updateSettings"];
        trace?: never;
    };
    "/settings/onboarding": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Confirm work start and bootstrap work once
         * @description Requires explicit effective date; use unique owner bootstrap key. Retry cannot duplicate fixed work. A different repeated onboarding payload returns conflict; subsequent changes use fixed schedules.
         */
        post: operations["completeOnboarding"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Export versioned owner data without authentication secrets
         * @description Export versioned owner data without authentication secrets
         */
        get: operations["exportData"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Minimal public health
         * @description Minimal public health
         */
        get: operations["health"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health/live": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Minimal public health
         * @description Minimal public health
         */
        get: operations["liveness"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/task-occurrences": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List persisted occurrences for a task, including unscheduled recurring exceptions
         * @description Cursor-paginated task metadata. Status/view filters apply to concrete one-off occurrences; recurring templates are managed through task-series and bounded schedule queries. Do not return an unbounded array of occurrence IDs.
         */
        get: operations["listTaskOccurrences"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        TaskDefinition: {
            title: string;
            description?: string | null;
            /** @enum {string} */
            category?: "personal" | "reading" | "work" | "university" | "other";
            /** @enum {string} */
            priority?: "low" | "normal" | "high";
            estimateMinutes?: number | null;
            /** Format: date */
            dueDate?: string | null;
        };
        TaskCreate: {
            title: string;
            description?: string | null;
            /** @enum {string} */
            category?: "personal" | "reading" | "work" | "university" | "other";
            /** @enum {string} */
            priority?: "low" | "normal" | "high";
            estimateMinutes?: number | null;
            /** Format: date */
            dueDate?: string | null;
        };
        TaskPatch: {
            title?: string;
            description?: string | null;
            /** @enum {string} */
            category?: "personal" | "reading" | "work" | "university" | "other";
            /** @enum {string} */
            priority?: "low" | "normal" | "high";
            estimateMinutes?: number | null;
            /** Format: date */
            dueDate?: string | null;
        };
        Task: {
            /** Format: uuid */
            id: string;
            version: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            title: string;
            description: string | null;
            /** @enum {string} */
            category: "personal" | "reading" | "work" | "university" | "other";
            /** @enum {string} */
            priority: "low" | "normal" | "high";
            estimateMinutes: number | null;
            /** Format: date */
            dueDate: string | null;
            /** Format: date-time */
            deletedAt: string | null;
            recurring: boolean;
            /**
             * Format: uuid
             * @description Exactly one for a one-off task; null for recurring templates. Read recurring occurrences through a bounded schedule request.
             */
            oneOffOccurrenceId: string | null;
            /**
             * @description Derived from the one-off occurrence; null for a recurring template because each occurrence has independent status.
             * @enum {string|null}
             */
            status: "incomplete" | "completed" | null;
        };
        ScheduledTaskOccurrence: {
            /** Format: uuid */
            id: string;
            version: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            /** Format: uuid */
            taskId: string;
            /** Format: uuid */
            seriesId: string | null;
            occurrenceKey: string;
            /** Format: date */
            originalLocalDate: string | null;
            /** Format: date-time */
            scheduledStartAt: string | null;
            /** Format: date-time */
            scheduledEndAt: string | null;
            /** @enum {string} */
            status: "incomplete" | "completed";
            /** Format: date-time */
            completedAt: string | null;
            snapshot: components["schemas"]["TaskDefinition"];
            canceled: boolean;
        };
        /** @description Both scheduled timestamps must be supplied together, both null for unschedule. end > start; explicit completed/incomplete assignments. A fixed occurrence cannot be edited here. */
        OccurrencePatch: {
            /** Format: date-time */
            scheduledStartAt?: string | null;
            /** Format: date-time */
            scheduledEndAt?: string | null;
            /** @enum {string} */
            status?: "incomplete" | "completed";
            conflictSnapshot?: string;
            snapshot?: components["schemas"]["TaskDefinition"];
        };
        TaskSeriesCreate: {
            /** Format: uuid */
            taskId: string;
            template: components["schemas"]["TaskDefinition"];
            weekdays: number[];
            /** @enum {string} */
            timezone: "Asia/Tehran";
            /** Format: date */
            effectiveFrom: string;
            /** Format: date */
            effectiveUntil?: string | null;
            localStartTime: string;
            durationMinutes: number;
            conflictSnapshot?: string;
        };
        TaskSeries: {
            /** Format: uuid */
            id: string;
            version: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            /** Format: uuid */
            rootSeriesId: string;
            /** Format: uuid */
            taskId: string;
            template: components["schemas"]["TaskDefinition"];
            weekdays: number[];
            /** @enum {string} */
            timezone: "Asia/Tehran";
            /** Format: date */
            effectiveFrom: string;
            /** Format: date */
            effectiveUntil: string | null;
            localStartTime: string;
            durationMinutes: number;
            /** Format: date */
            terminatedAt: string | null;
        };
        /** @description Requires at least one changed field. scope=this creates an override; future splits segments. Historical snapshots and existing explicit exceptions are preserved. */
        TaskSeriesPatch: {
            /** @enum {string} */
            scope: "this" | "future";
            /** Format: date */
            originalLocalDate: string;
            template?: components["schemas"]["TaskDefinition"];
            weekdays?: number[];
            /** @enum {string} */
            timezone?: "Asia/Tehran";
            /** Format: date */
            effectiveUntil?: string | null;
            localStartTime?: string;
            durationMinutes?: number;
            conflictSnapshot?: string;
        };
        SeriesDelete: {
            /** @enum {string} */
            scope: "this" | "future";
            /** Format: date */
            originalLocalDate: string;
            acknowledgeAffectedOccurrenceIds?: string[];
        };
        /** @description everyWeeks=2 requires a Saturday anchor and explicit parity. Weekdays are ISO; effective dates inclusive. Weekday/time/parity conflict checking covers all intersecting effective ranges, not just the visible week. */
        FixedSeriesCreate: {
            /** @enum {string} */
            kind: "work" | "class";
            title: string;
            notes?: string | null;
            location?: string | null;
            weekdays: number[];
            /** @enum {string} */
            timezone: "Asia/Tehran";
            /** Format: date */
            effectiveFrom: string;
            /** Format: date */
            effectiveUntil?: string | null;
            localStartTime: string;
            localEndTime: string;
            endsNextDay: boolean;
            everyWeeks: number;
            /** Format: date */
            anchorWeekStart?: string | null;
            parity?: number | null;
            conflictSnapshot?: string;
        };
        FixedSeries: {
            /** Format: uuid */
            id: string;
            version: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            /** Format: uuid */
            rootSeriesId: string;
            /** @enum {string} */
            kind: "work" | "class";
            title: string;
            notes: string | null;
            location: string | null;
            weekdays: number[];
            /** @enum {string} */
            timezone: "Asia/Tehran";
            /** Format: date */
            effectiveFrom: string;
            /** Format: date */
            effectiveUntil: string | null;
            localStartTime: string;
            localEndTime: string;
            endsNextDay: boolean;
            everyWeeks: number;
            /** Format: date */
            anchorWeekStart: string | null;
            parity: number | null;
            /** Format: date */
            terminatedAt: string | null;
        };
        /** @description At least one changed field required. Fixed schedules are edited here, never through task drag/resize routes. */
        FixedSeriesPatch: {
            /** @enum {string} */
            scope: "this" | "future";
            /** Format: date */
            originalLocalDate: string;
            title?: string;
            notes?: string | null;
            location?: string | null;
            weekdays?: number[];
            /** @enum {string} */
            timezone?: "Asia/Tehran";
            /** Format: date */
            effectiveUntil?: string | null;
            localStartTime?: string;
            localEndTime?: string;
            endsNextDay?: boolean;
            everyWeeks?: number;
            /** Format: date */
            anchorWeekStart?: string | null;
            parity?: number | null;
            conflictSnapshot?: string;
        };
        /** @description Override requires both valid replacement timestamps. Cancel has no replacement interval. The series ID resolves a stable root; uniqueness is root plus originalLocalDate. */
        ExceptionCreate: {
            /** Format: date */
            originalLocalDate: string;
            /** @enum {string} */
            action: "cancel" | "override";
            replacementTitle?: string | null;
            /** Format: date-time */
            replacementStartAt?: string | null;
            /** Format: date-time */
            replacementEndAt?: string | null;
            conflictSnapshot?: string;
        };
        ExceptionPatch: {
            /** @enum {string} */
            action?: "cancel" | "override";
            replacementTitle?: string | null;
            /** Format: date-time */
            replacementStartAt?: string | null;
            /** Format: date-time */
            replacementEndAt?: string | null;
            conflictSnapshot?: string;
        };
        OccurrenceException: {
            /** Format: uuid */
            id: string;
            version: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            /** Format: uuid */
            rootSeriesId: string;
            originalOccurrenceKey: string;
            /** Format: date */
            originalLocalDate: string;
            /** @enum {string} */
            action: "cancel" | "override";
            replacementTitle: string | null;
            /** Format: date-time */
            replacementStartAt: string | null;
            /** Format: date-time */
            replacementEndAt: string | null;
        };
        BookCreate: {
            title: string;
            author?: string | null;
            totalPages?: number | null;
            currentPage?: number | null;
            /** @enum {string} */
            status?: "reading" | "finished" | "archived";
        };
        BookPatch: {
            title?: string;
            author?: string | null;
            totalPages?: number | null;
            currentPage?: number | null;
            /** @enum {string} */
            status?: "reading" | "finished" | "archived";
        };
        Book: {
            /** Format: uuid */
            id: string;
            version: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            title: string;
            author: string | null;
            totalPages: number | null;
            currentPage: number | null;
            /** @enum {string} */
            status: "reading" | "finished" | "archived";
            /** Format: date-time */
            deletedAt: string | null;
        };
        /** @description Actual interval must end after start and not in the future; max duration 24h. Task completion is a separate explicit operation. Both linked references must belong to the owner. */
        ReadingSessionCreate: {
            /** Format: date-time */
            startedAt: string;
            /** Format: date-time */
            endedAt: string;
            pages?: number | null;
            /** Format: uuid */
            bookId?: string | null;
            /** Format: uuid */
            occurrenceId?: string | null;
            topic?: string | null;
            note?: string | null;
        };
        /** @description Validate the resulting entire record; editing or deleting reading never silently changes task status. */
        ReadingSessionPatch: {
            /** Format: date-time */
            startedAt?: string;
            /** Format: date-time */
            endedAt?: string;
            pages?: number | null;
            /** Format: uuid */
            bookId?: string | null;
            /** Format: uuid */
            occurrenceId?: string | null;
            topic?: string | null;
            note?: string | null;
        };
        ReadingSession: {
            /** Format: uuid */
            id: string;
            version: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            /** Format: date-time */
            startedAt: string;
            /** Format: date-time */
            endedAt: string;
            pages: number | null;
            /** Format: uuid */
            bookId: string | null;
            /** Format: uuid */
            occurrenceId: string | null;
            topic: string | null;
            note: string | null;
            durationMinutes: number;
            bookTitleSnapshot: string | null;
        };
        /** @description Interprets input in owner timezone; derives endedAt once. Does not accept a second end time or inconsistent duration. */
        QuickReadingCreate: {
            /** Format: date */
            localDate: string;
            localStartTime: string;
            durationMinutes: number;
            pages?: number | null;
            /** Format: uuid */
            bookId?: string | null;
            /** Format: uuid */
            occurrenceId?: string | null;
            topic?: string | null;
            note?: string | null;
        };
        WeeklyGoalWrite: {
            /** @enum {string} */
            unit: "minutes" | "pages" | "sessions";
            target: number;
        };
        WeeklyGoal: {
            /** Format: uuid */
            id: string;
            version: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            /** Format: date */
            weekStart: string;
            /** @enum {string} */
            unit: "minutes" | "pages" | "sessions";
            target: number;
        };
        GoalState: {
            /** Format: date */
            weekStart: string;
            /** @enum {string} */
            source: "none" | "explicit" | "default";
            version: number;
            /** @enum {string|null} */
            unit: "minutes" | "pages" | "sessions" | null;
            target: number | null;
            actual: number;
            remaining: number | null;
            percent: number | null;
        };
        DefaultGoal: {
            /** Format: date */
            effectiveFromWeek: string;
            goal: {
                /** @enum {string} */
                unit: "minutes" | "pages" | "sessions";
                target: number;
            } | null;
        };
        Settings: {
            version: number;
            /** @enum {string} */
            timezone: "Asia/Tehran";
            /** @enum {integer} */
            weekStartsOn: 6;
            onboardingComplete: boolean;
            /** Format: date */
            workEffectiveFrom: string | null;
            defaultGoals: components["schemas"]["DefaultGoal"][];
        };
        /** @description Timezone is fixed to Tehran in v1. defaultGoal.effectiveFromWeek must be the current or a future Saturday. goal=null disables defaults from that week. Preserve all explicit weekly goals and earlier default history. */
        SettingsPatch: {
            /** @enum {string} */
            timezone?: "Asia/Tehran";
            defaultGoal?: components["schemas"]["DefaultGoalRuleWrite"];
        };
        /** @description Idempotently bootstraps five-day 08:00–13:00 work using owner bootstrap key. Optional reading goal requires an explicit Saturday. No fabricated class data. */
        OnboardingWrite: {
            /** @enum {string} */
            timezone: "Asia/Tehran";
            /** Format: date */
            workEffectiveFrom: string;
            readingGoal?: components["schemas"]["WeeklyGoalWrite"];
            /** Format: date */
            readingGoalWeekStart?: string;
            conflictSnapshot?: string;
        };
        DailyPriorityWrite: {
            occurrenceIds: string[];
        };
        DailyPriorities: {
            /** Format: date */
            localDate: string;
            version: number;
            occurrenceIds: string[];
        };
        Session: {
            /** Format: uuid */
            ownerId: string;
            /** Format: email */
            email: string;
            /** Format: date-time */
            expiresAt: string;
        };
        LoginRequest: {
            /** Format: email */
            email: string;
            /** Format: password */
            password: string;
        };
        CsrfToken: {
            csrfToken: string;
        };
        PasswordChange: {
            /** Format: password */
            currentPassword: string;
            /** Format: password */
            newPassword: string;
        };
        Health: {
            /** @enum {string} */
            status: "ok";
        };
        MutationReceipt: {
            /** Format: uuid */
            id: string;
            version: number;
            deleted: boolean;
        };
        ConflictItem: {
            occurrenceKey: string;
            id: string;
            title: string;
            /** @enum {string} */
            kind: "task" | "work" | "class";
            /** Format: date-time */
            startAt: string;
            /** Format: date-time */
            endAt: string;
            version: number;
        };
        ConflictDetails: {
            conflictSnapshot?: string;
            scheduleRevision?: number;
            conflicts?: components["schemas"]["ConflictItem"][];
            currentVersion?: number;
            current?: components["schemas"]["Task"] | components["schemas"]["ScheduledTaskOccurrence"] | components["schemas"]["TaskSeries"] | components["schemas"]["FixedSeries"] | components["schemas"]["OccurrenceException"] | components["schemas"]["Book"] | components["schemas"]["ReadingSession"] | components["schemas"]["WeeklyGoal"] | components["schemas"]["Settings"] | components["schemas"]["DailyPriorities"] | components["schemas"]["GoalState"];
            affectedOccurrences?: components["schemas"]["ScheduledTaskOccurrence"][];
        };
        ApiError: {
            /** @enum {string} */
            code: "VALIDATION_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "CSRF_REJECTED" | "NOT_FOUND" | "STALE_VERSION" | "SCHEDULE_CONFLICT" | "IDEMPOTENCY_KEY_REUSED" | "INVALID_SCOPE" | "PRECONDITION_REQUIRED" | "RATE_LIMITED" | "RANGE_TOO_LARGE" | "UNAVAILABLE" | "INTERNAL_ERROR";
            message: string;
            /** Format: uuid */
            requestId: string;
            fieldErrors?: {
                [key: string]: string[];
            };
            details?: components["schemas"]["ConflictDetails"];
        };
        ScheduleEvent: {
            id: string;
            occurrenceKey: string;
            /** @enum {string} */
            kind: "task" | "work" | "class";
            title: string;
            /** Format: date-time */
            startAt: string;
            /** Format: date-time */
            endAt: string;
            /** @enum {string} */
            category: "personal" | "reading" | "work" | "university" | "other";
            /** @enum {string|null} */
            status: "incomplete" | "completed" | null;
            version: number;
            /** Format: uuid */
            taskId: string | null;
            /** Format: uuid */
            seriesId: string | null;
            /** Format: date */
            originalLocalDate: string | null;
            editable: boolean;
            resizable: boolean;
            completionAllowed: boolean;
            continuesBefore: boolean;
            continuesAfter: boolean;
            /** @enum {string|null} */
            priority: "low" | "normal" | "high" | null;
        };
        DaySummary: {
            /** Format: date */
            localDate: string;
            eventCount: number;
            occupiedMinutes: number;
            plannedTaskCount: number;
            completedTaskCount: number;
            remainingTaskCount: number;
            plannedReadingCount: number;
            plannedReadingMinutes: number;
        };
        ScheduleResponse: {
            /** Format: date-time */
            from: string;
            /** Format: date-time */
            to: string;
            /** @enum {string} */
            timezone: "Asia/Tehran";
            revision: number;
            events: components["schemas"]["ScheduleEvent"][];
            days: components["schemas"]["DaySummary"][];
        };
        ReadingTotals: {
            minutes: number;
            pages: number;
            sessions: number;
        };
        WeeklyReport: {
            /** Format: date */
            weekStart: string;
            /** Format: date-time */
            from: string;
            /** Format: date-time */
            to: string;
            inProgress: boolean;
            eventCount: number;
            plannedTaskCount: number;
            completedTaskCount: number;
            remainingTaskCount: number;
            unscheduledCompletedTaskCount: number;
            occupiedMinutes: number;
            plannedReadingMinutes: number;
            actualReading: components["schemas"]["ReadingTotals"];
            goal: components["schemas"]["GoalState"];
            days: components["schemas"]["DaySummary"][];
            dailyReading: {
                /** Format: date */
                localDate: string;
                minutes: number;
                pages: number;
                sessions: number;
            }[];
        };
        TaskPage: {
            items: components["schemas"]["Task"][];
            nextCursor: string | null;
        };
        TaskSeriesPage: {
            items: components["schemas"]["TaskSeries"][];
            nextCursor: string | null;
        };
        FixedSeriesPage: {
            items: components["schemas"]["FixedSeries"][];
            nextCursor: string | null;
        };
        BookPage: {
            items: components["schemas"]["Book"][];
            nextCursor: string | null;
        };
        ReadingSessionPage: {
            items: components["schemas"]["ReadingSession"][];
            nextCursor: string | null;
        };
        OccurrenceExceptionPage: {
            items: components["schemas"]["OccurrenceException"][];
            nextCursor: string | null;
        };
        RecurrencePreviewRequest: {
            rule: components["schemas"]["TaskRulePreview"] | components["schemas"]["FixedRulePreview"];
            /** Format: date-time */
            from: string;
            /** Format: date-time */
            to: string;
        };
        RecurrencePreview: {
            events: components["schemas"]["ScheduleEvent"][];
            conflicts: components["schemas"]["ConflictItem"][];
        };
        /** @description Versioned complete owner export, streamed if large. Never include sessions, CSRF material, password hashes, or credentials. */
        Export: {
            /** @enum {integer} */
            schemaVersion: 1;
            /** Format: date-time */
            exportedAt: string;
            /** @enum {string} */
            timezone: "Asia/Tehran";
            tasks: components["schemas"]["Task"][];
            taskOccurrences: components["schemas"]["ScheduledTaskOccurrence"][];
            taskSeries: components["schemas"]["TaskSeries"][];
            fixedSeries: components["schemas"]["FixedSeries"][];
            exceptions: components["schemas"]["OccurrenceException"][];
            books: components["schemas"]["Book"][];
            readingSessions: components["schemas"]["ReadingSession"][];
            weeklyGoals: components["schemas"]["WeeklyGoal"][];
            dailyPriorities: components["schemas"]["DailyPriorities"][];
            settings: components["schemas"]["Settings"];
        };
        TaskSeriesMutation: {
            /** @enum {string} */
            scope: "this";
            occurrence: components["schemas"]["ScheduledTaskOccurrence"];
        } | {
            /** @enum {string} */
            scope: "future";
            series: components["schemas"]["TaskSeries"];
        };
        FixedSeriesMutation: {
            /** @enum {string} */
            scope: "this";
            exception: components["schemas"]["OccurrenceException"];
        } | {
            /** @enum {string} */
            scope: "future";
            series: components["schemas"]["FixedSeries"];
        };
        TaskRulePreview: {
            template: components["schemas"]["TaskDefinition"];
            weekdays: number[];
            /** @enum {string} */
            timezone: "Asia/Tehran";
            /** Format: date */
            effectiveFrom: string;
            /** Format: date */
            effectiveUntil?: string | null;
            localStartTime: string;
            durationMinutes: number;
        };
        /** @description everyWeeks=2 requires a Saturday anchor and explicit parity. Weekdays are ISO; effective dates inclusive. Weekday/time/parity conflict checking covers all intersecting effective ranges, not just the visible week. */
        FixedRulePreview: {
            /** @enum {string} */
            kind: "work" | "class";
            title: string;
            notes?: string | null;
            location?: string | null;
            weekdays: number[];
            /** @enum {string} */
            timezone: "Asia/Tehran";
            /** Format: date */
            effectiveFrom: string;
            /** Format: date */
            effectiveUntil?: string | null;
            localStartTime: string;
            localEndTime: string;
            endsNextDay: boolean;
            everyWeeks: number;
            /** Format: date */
            anchorWeekStart?: string | null;
            parity?: number | null;
        };
        DefaultGoalRuleWrite: {
            /** Format: date */
            effectiveFromWeek: string;
            goal: {
                /** @enum {string} */
                unit: "minutes" | "pages" | "sessions";
                target: number;
            } | null;
        };
        TaskOccurrencePage: {
            items: components["schemas"]["ScheduledTaskOccurrence"][];
            nextCursor: string | null;
        };
    };
    responses: {
        /** @description Invalid input */
        Error400: {
            headers: {
                "X-Request-Id"?: string;
                /** @description private, no-store for private resources */
                "Cache-Control"?: string;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ApiError"];
            };
        };
        /** @description Authentication required or failed */
        Error401: {
            headers: {
                "X-Request-Id"?: string;
                /** @description private, no-store for private resources */
                "Cache-Control"?: string;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ApiError"];
            };
        };
        /** @description Origin, CSRF, or authorization rejected */
        Error403: {
            headers: {
                "X-Request-Id"?: string;
                /** @description private, no-store for private resources */
                "Cache-Control"?: string;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ApiError"];
            };
        };
        /** @description Not found */
        Error404: {
            headers: {
                "X-Request-Id"?: string;
                /** @description private, no-store for private resources */
                "Cache-Control"?: string;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ApiError"];
            };
        };
        /** @description Conflict; no mutation applied */
        Error409: {
            headers: {
                "X-Request-Id"?: string;
                /** @description private, no-store for private resources */
                "Cache-Control"?: string;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ApiError"];
            };
        };
        /** @description Request too large */
        Error413: {
            headers: {
                "X-Request-Id"?: string;
                /** @description private, no-store for private resources */
                "Cache-Control"?: string;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ApiError"];
            };
        };
        /** @description Rate limited */
        Error429: {
            headers: {
                "X-Request-Id"?: string;
                /** @description private, no-store for private resources */
                "Cache-Control"?: string;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ApiError"];
            };
        };
        /** @description Temporarily unavailable */
        Error503: {
            headers: {
                "X-Request-Id"?: string;
                /** @description private, no-store for private resources */
                "Cache-Control"?: string;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ApiError"];
            };
        };
        /** @description If-Match required */
        Error428: {
            headers: {
                "X-Request-Id"?: string;
                /** @description private, no-store for private resources */
                "Cache-Control"?: string;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ApiError"];
            };
        };
    };
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    getCsrf: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CsrfToken"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginRequest"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Session"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    getSession: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Session"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Completed; no response body */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    revokeAllSessions: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Completed; no response body */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    changePassword: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PasswordChange"];
            };
        };
        responses: {
            /** @description Completed; no response body */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    listTasks: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string;
                status?: "incomplete" | "completed";
                category?: "personal" | "reading" | "work" | "university" | "other";
                priority?: "low" | "normal" | "high";
                q?: string;
                view?: "all" | "unscheduled" | "scheduled" | "overdue" | "completed";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TaskPage"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    createTask: {
        parameters: {
            query?: never;
            header: {
                /** @description Owner+operation-scoped UUID. Same key and normalized payload replay the successful response for >=24h; different payload is 409. */
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TaskCreate"];
            };
        };
        responses: {
            /** @description Success */
            201: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Task"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    getTask: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Task"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    deleteTask: {
        parameters: {
            query?: never;
            header: {
                /** @description Quoted resource version. Use "0" only when creating an absent weekly goal or initial daily-priority collection. */
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MutationReceipt"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            428: components["responses"]["Error428"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    updateTask: {
        parameters: {
            query?: never;
            header: {
                /** @description Quoted resource version. Use "0" only when creating an absent weekly goal or initial daily-priority collection. */
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TaskPatch"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Task"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            428: components["responses"]["Error428"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    getTaskOccurrence: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScheduledTaskOccurrence"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    deleteTaskOccurrence: {
        parameters: {
            query?: never;
            header: {
                /** @description Quoted resource version. Use "0" only when creating an absent weekly goal or initial daily-priority collection. */
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MutationReceipt"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            428: components["responses"]["Error428"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    updateTaskOccurrence: {
        parameters: {
            query?: never;
            header: {
                /** @description Quoted resource version. Use "0" only when creating an absent weekly goal or initial daily-priority collection. */
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OccurrencePatch"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScheduledTaskOccurrence"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            428: components["responses"]["Error428"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    listTaskSeries: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TaskSeriesPage"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    createTaskSeries: {
        parameters: {
            query?: never;
            header: {
                /** @description Owner+operation-scoped UUID. Same key and normalized payload replay the successful response for >=24h; different payload is 409. */
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TaskSeriesCreate"];
            };
        };
        responses: {
            /** @description Success */
            201: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TaskSeries"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    deleteTaskSeries: {
        parameters: {
            query?: never;
            header: {
                /** @description Quoted resource version. Use "0" only when creating an absent weekly goal or initial daily-priority collection. */
                "If-Match": string;
                /** @description Owner+operation-scoped UUID. Same key and normalized payload replay the successful response for >=24h; different payload is 409. */
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SeriesDelete"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MutationReceipt"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            428: components["responses"]["Error428"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    updateTaskSeries: {
        parameters: {
            query?: never;
            header: {
                /** @description Quoted resource version. Use "0" only when creating an absent weekly goal or initial daily-priority collection. */
                "If-Match": string;
                /** @description Owner+operation-scoped UUID. Same key and normalized payload replay the successful response for >=24h; different payload is 409. */
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TaskSeriesPatch"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TaskSeriesMutation"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            428: components["responses"]["Error428"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    getSchedule: {
        parameters: {
            query: {
                /** @description Inclusive start, timezone-aware; maximum 93 local days. */
                from: string;
                /** @description Exclusive end after from; bounded result, never silently truncated. */
                to: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScheduleResponse"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    previewRecurrence: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RecurrencePreviewRequest"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RecurrencePreview"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    listFixedSchedules: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FixedSeriesPage"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    createFixedSchedule: {
        parameters: {
            query?: never;
            header: {
                /** @description Owner+operation-scoped UUID. Same key and normalized payload replay the successful response for >=24h; different payload is 409. */
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FixedSeriesCreate"];
            };
        };
        responses: {
            /** @description Success */
            201: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FixedSeries"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    deleteFixedSchedule: {
        parameters: {
            query?: never;
            header: {
                /** @description Quoted resource version. Use "0" only when creating an absent weekly goal or initial daily-priority collection. */
                "If-Match": string;
                /** @description Owner+operation-scoped UUID. Same key and normalized payload replay the successful response for >=24h; different payload is 409. */
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SeriesDelete"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MutationReceipt"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            428: components["responses"]["Error428"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    updateFixedSchedule: {
        parameters: {
            query?: never;
            header: {
                /** @description Quoted resource version. Use "0" only when creating an absent weekly goal or initial daily-priority collection. */
                "If-Match": string;
                /** @description Owner+operation-scoped UUID. Same key and normalized payload replay the successful response for >=24h; different payload is 409. */
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FixedSeriesPatch"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FixedSeriesMutation"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            428: components["responses"]["Error428"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    listExceptions: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OccurrenceExceptionPage"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    createException: {
        parameters: {
            query?: never;
            header: {
                /** @description Owner+operation-scoped UUID. Same key and normalized payload replay the successful response for >=24h; different payload is 409. */
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ExceptionCreate"];
            };
        };
        responses: {
            /** @description Success */
            201: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OccurrenceException"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    removeException: {
        parameters: {
            query?: {
                conflictSnapshot?: string;
            };
            header: {
                /** @description Quoted resource version. Use "0" only when creating an absent weekly goal or initial daily-priority collection. */
                "If-Match": string;
            };
            path: {
                id: string;
                exceptionId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": {
                    conflictSnapshot?: string;
                };
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MutationReceipt"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            428: components["responses"]["Error428"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    updateException: {
        parameters: {
            query?: never;
            header: {
                /** @description Quoted resource version. Use "0" only when creating an absent weekly goal or initial daily-priority collection. */
                "If-Match": string;
            };
            path: {
                id: string;
                exceptionId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ExceptionPatch"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OccurrenceException"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            428: components["responses"]["Error428"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    getDailyPriorities: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                date: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DailyPriorities"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    setDailyPriorities: {
        parameters: {
            query?: never;
            header: {
                /** @description Quoted resource version. Use "0" only when creating an absent weekly goal or initial daily-priority collection. */
                "If-Match": string;
            };
            path: {
                date: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DailyPriorityWrite"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DailyPriorities"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            428: components["responses"]["Error428"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    listBooks: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string;
                status?: "reading" | "finished" | "archived";
                q?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BookPage"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    createBook: {
        parameters: {
            query?: never;
            header: {
                /** @description Owner+operation-scoped UUID. Same key and normalized payload replay the successful response for >=24h; different payload is 409. */
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BookCreate"];
            };
        };
        responses: {
            /** @description Success */
            201: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Book"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    deleteBook: {
        parameters: {
            query?: never;
            header: {
                /** @description Quoted resource version. Use "0" only when creating an absent weekly goal or initial daily-priority collection. */
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MutationReceipt"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            428: components["responses"]["Error428"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    updateBook: {
        parameters: {
            query?: never;
            header: {
                /** @description Quoted resource version. Use "0" only when creating an absent weekly goal or initial daily-priority collection. */
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BookPatch"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Book"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            428: components["responses"]["Error428"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    listReadingSessions: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string;
                from?: string;
                to?: string;
                bookId?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReadingSessionPage"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    createReadingSession: {
        parameters: {
            query?: never;
            header: {
                /** @description Owner+operation-scoped UUID. Same key and normalized payload replay the successful response for >=24h; different payload is 409. */
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReadingSessionCreate"];
            };
        };
        responses: {
            /** @description Success */
            201: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReadingSession"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    deleteReadingSession: {
        parameters: {
            query?: never;
            header: {
                /** @description Quoted resource version. Use "0" only when creating an absent weekly goal or initial daily-priority collection. */
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MutationReceipt"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            428: components["responses"]["Error428"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    updateReadingSession: {
        parameters: {
            query?: never;
            header: {
                /** @description Quoted resource version. Use "0" only when creating an absent weekly goal or initial daily-priority collection. */
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReadingSessionPatch"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReadingSession"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            428: components["responses"]["Error428"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    quickReading: {
        parameters: {
            query?: never;
            header: {
                /** @description Owner+operation-scoped UUID. Same key and normalized payload replay the successful response for >=24h; different payload is 409. */
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["QuickReadingCreate"];
            };
        };
        responses: {
            /** @description Success */
            201: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReadingSession"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    getWeeklyGoal: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                weekStart: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GoalState"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    setWeeklyGoal: {
        parameters: {
            query?: never;
            header: {
                /** @description Quoted resource version. Use "0" only when creating an absent weekly goal or initial daily-priority collection. */
                "If-Match": string;
            };
            path: {
                weekStart: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WeeklyGoalWrite"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WeeklyGoal"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            428: components["responses"]["Error428"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    deleteWeeklyGoal: {
        parameters: {
            query?: never;
            header: {
                /** @description Quoted resource version. Use "0" only when creating an absent weekly goal or initial daily-priority collection. */
                "If-Match": string;
            };
            path: {
                weekStart: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MutationReceipt"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            428: components["responses"]["Error428"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    getWeeklyReport: {
        parameters: {
            query: {
                /** @description Must be a Saturday in the owner timezone. */
                weekStart: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WeeklyReport"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    getSettings: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Settings"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    updateSettings: {
        parameters: {
            query?: never;
            header: {
                /** @description Quoted resource version. Use "0" only when creating an absent weekly goal or initial daily-priority collection. */
                "If-Match": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SettingsPatch"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Settings"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            428: components["responses"]["Error428"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    completeOnboarding: {
        parameters: {
            query?: never;
            header: {
                /** @description Owner+operation-scoped UUID. Same key and normalized payload replay the successful response for >=24h; different payload is 409. */
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OnboardingWrite"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Settings"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    exportData: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Export"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    health: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Health"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    liveness: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Health"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
    listTaskOccurrences: {
        parameters: {
            query: {
                limit?: number;
                cursor?: string;
                view?: "all" | "unscheduled" | "scheduled" | "overdue" | "completed";
                taskId: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    "X-Request-Id"?: string;
                    /** @description private, no-store for private resources */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TaskOccurrencePage"];
                };
            };
            400: components["responses"]["Error400"];
            401: components["responses"]["Error401"];
            403: components["responses"]["Error403"];
            404: components["responses"]["Error404"];
            409: components["responses"]["Error409"];
            413: components["responses"]["Error413"];
            429: components["responses"]["Error429"];
            503: components["responses"]["Error503"];
        };
    };
}
