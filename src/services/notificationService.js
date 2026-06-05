/**
 * Real-time Notification Service
 * Handles live updates for attendance marking events
 */

class NotificationService {
    constructor() {
        // Store active SSE connections
        this.connections = new Map();
        this.eventHistory = [];
        this.maxHistorySize = 50;
        this.heartbeatInterval = 30000; // 30 seconds
        this.connectionTimeout = 5 * 60 * 1000; // 5 minutes of inactivity
    }

    /**
     * Add a new SSE connection
     */
    addConnection(userId, userRole, res, req) {
        const connectionId = `${userRole}_${userId}_${Date.now()}`;

        // Set up SSE headers with timeout prevention
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // Disable nginx buffering
            'Access-Control-Allow-Origin': '*'
        });

        // Send initial connection message
        try {
            res.write(`data: ${JSON.stringify({
                type: 'connected',
                message: 'Connected to live updates',
                timestamp: new Date().toISOString()
            })}\n\n`);
        } catch (error) {
            console.error('Failed to send initial connection message:', error);
            return null;
        }

        // Setup heartbeat to keep connection alive and detect dead connections
        const heartbeat = setInterval(() => {
            try {
                res.write(`:heartbeat ${Date.now()}\n\n`);
            } catch (error) {
                // Connection is dead, clean up
                this.removeConnection(connectionId);
            }
        }, this.heartbeatInterval);

        // Store connection with cleanup data
        this.connections.set(connectionId, {
            userId,
            userRole,
            res,
            req,
            connectedAt: Date.now(),
            lastActivity: Date.now(),
            heartbeat,
            closed: false
        });

        // Send recent event history
        this.eventHistory.slice(-5).forEach(event => {
            try {
                res.write(`data: ${JSON.stringify(event)}\n\n`);
            } catch (error) {
                // Skip if connection already closed
            }
        });

        // Handle client disconnect - multiple event handlers for reliability
        req.on('close', () => {
            this.removeConnection(connectionId);
        });

        req.on('end', () => {
            this.removeConnection(connectionId);
        });

        res.on('close', () => {
            this.removeConnection(connectionId);
        });

        res.on('finish', () => {
            this.removeConnection(connectionId);
        });

        console.log(`✅ SSE Connection established: ${connectionId} (Total: ${this.connections.size})`);

        return connectionId;
    }

    /**
     * Remove a specific connection and cleanup resources
     */
    removeConnection(connectionId) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;

        // Prevent double cleanup
        if (connection.closed) return;
        connection.closed = true;

        // Clear heartbeat interval
        if (connection.heartbeat) {
            clearInterval(connection.heartbeat);
        }

        // Try to close the response stream gracefully
        try {
            connection.res.end();
        } catch (error) {
            // Connection already closed
        }

        // Remove from connections map
        this.connections.delete(connectionId);
        console.log(`🔌 SSE Connection closed: ${connectionId} (Remaining: ${this.connections.size})`);
    }

    /**
     * Disconnect all connections for a specific user (useful for logout)
     */
    disconnectUser(userId) {
        let count = 0;
        this.connections.forEach((connection, connectionId) => {
            if (connection.userId === userId) {
                this.removeConnection(connectionId);
                count++;
            }
        });
        console.log(`🔌 Disconnected ${count} connection(s) for user ${userId}`);
        return count;
    }

    /**
     * Broadcast event to all connected clients
     */
    broadcast(event) {
        // Add to history
        this.eventHistory.push({
            ...event,
            timestamp: new Date().toISOString(),
            id: Date.now()
        });

        // Keep history size manageable
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }

        // Send to all connected clients
        const data = JSON.stringify(event);
        const deadConnections = [];

        this.connections.forEach((connection, connectionId) => {
            // Skip closed connections
            if (connection.closed) {
                deadConnections.push(connectionId);
                return;
            }

            try {
                // Check if user should receive this event
                if (this.shouldReceiveEvent(connection, event)) {
                    connection.res.write(`data: ${data}\n\n`);
                    connection.lastActivity = Date.now();
                }
            } catch (error) {
                console.error(`Error sending to connection ${connectionId}:`, error);
                deadConnections.push(connectionId);
            }
        });

        // Clean up dead connections
        deadConnections.forEach(connectionId => {
            this.removeConnection(connectionId);
        });
    }

    /**
     * Determine if a user should receive an event
     */
    shouldReceiveEvent(connection, event) {
        const { userRole, userId } = connection;

        // Admins see everything
        if (userRole === 'admin') return true;

        // Teachers see their own events and public events
        if (userRole === 'teacher') {
            return event.public || event.teacherId === userId;
        }

        // Students see their own events
        if (userRole === 'student') {
            return event.public || event.studentId === userId;
        }

        return false;
    }

    /**
     * Send attendance marked notification
     */
    notifyAttendanceMarked(data) {
        this.broadcast({
            type: 'attendance_marked',
            subject: data.subject,
            stream: data.stream,
            division: data.division,
            year: data.year,
            teacherId: data.teacherId,
            teacherName: data.teacherName,
            present: data.present,
            absent: data.absent,
            total: data.total,
            sessionId: data.sessionId,
            public: true, // Visible to all
            message: `${data.teacherName} marked attendance for ${data.subject} - ${data.stream} ${data.division}`
        });
    }

    /**
     * Send defaulter list generated notification
     */
    notifyDefaulterGenerated(data) {
        this.broadcast({
            type: 'defaulter_generated',
            count: data.count,
            threshold: data.threshold,
            filters: data.filters,
            generatedBy: data.generatedBy,
            role: data.role,
            public: false,
            message: `Defaulter list generated with ${data.count} students below ${data.threshold}%`
        });
    }

    /**
     * Send data import notification
     */
    notifyDataImport(data) {
        this.broadcast({
            type: 'data_import',
            dataType: data.dataType, // 'students' or 'teachers'
            count: data.count,
            importedBy: data.importedBy,
            public: true,
            message: `${data.count} ${data.dataType} imported successfully`
        });
    }

    /**
     * Send stats update notification
     */
    notifyStatsUpdate(data) {
        this.broadcast({
            type: 'stats_update',
            stats: data.stats,
            public: true,
            message: 'Dashboard statistics updated'
        });
    }

    /**
     * Get connection count
     */
    getConnectionCount() {
        return this.connections.size;
    }

    /**
     * Get connections by role
     */
    getConnectionsByRole(role) {
        return Array.from(this.connections.values())
            .filter(conn => conn.userRole === role).length;
    }

    /**
     * Cleanup stale and inactive connections
     */
    cleanup() {
        const now = Date.now();
        const deadConnections = [];

        this.connections.forEach((connection, connectionId) => {
            // Remove connections that have been inactive for too long
            const inactiveTime = now - connection.lastActivity;
            
            if (inactiveTime > this.connectionTimeout) {
                console.log(`⏰ Removing inactive connection ${connectionId} (inactive for ${Math.round(inactiveTime / 1000)}s)`);
                deadConnections.push(connectionId);
                return;
            }

            // Test if connection is still alive by trying to write
            try {
                connection.res.write(`:ping ${now}\n\n`);
                connection.lastActivity = now;
            } catch (error) {
                console.log(`💀 Removing dead connection ${connectionId}`);
                deadConnections.push(connectionId);
            }
        });

        // Remove all dead connections
        deadConnections.forEach(connectionId => {
            this.removeConnection(connectionId);
        });

        if (deadConnections.length > 0) {
            console.log(`🧹 Cleanup: Removed ${deadConnections.length} stale connection(s). Active: ${this.connections.size}`);
        }
    }

    /**
     * Get all active connection statistics
     */
    getStats() {
        return {
            total: this.connections.size,
            byRole: {
                admin: this.getConnectionsByRole('admin'),
                teacher: this.getConnectionsByRole('teacher'),
                student: this.getConnectionsByRole('student')
            }
        };
    }

    /**
     * Shutdown all connections (useful for server shutdown)
     */
    shutdownAll() {
        console.log(`🛑 Shutting down all ${this.connections.size} SSE connections...`);
        this.connections.forEach((connection, connectionId) => {
            this.removeConnection(connectionId);
        });
    }
}

// Singleton instance
const notificationService = new NotificationService();

// Cleanup stale connections every 2 minutes
setInterval(() => {
    notificationService.cleanup();
}, 2 * 60 * 1000);

// Graceful shutdown on process termination
process.on('SIGTERM', () => {
    notificationService.shutdownAll();
});

process.on('SIGINT', () => {
    notificationService.shutdownAll();
    process.exit(0);
});

export default notificationService;
