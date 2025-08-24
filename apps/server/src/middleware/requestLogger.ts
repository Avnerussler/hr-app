import { Request, Response, NextFunction } from 'express'
import logger from '../config/logger'

// Extended Request interface to include timing
interface RequestWithTiming extends Request {
    startTime?: number
}

// Request logging middleware
export const requestLogger = (req: RequestWithTiming, res: Response, next: NextFunction) => {
    // Record start time
    req.startTime = Date.now()

    // Extract useful information from request
    const requestInfo = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown',
        contentType: req.get('Content-Type'),
        contentLength: req.get('Content-Length'),
        referer: req.get('Referer'),
        timestamp: new Date().toISOString()
    }

    // Log incoming request
    logger.info('Incoming Request', requestInfo)

    // Override res.json to log responses
    const originalJson = res.json.bind(res)
    res.json = function(obj: any) {
        const responseTime = req.startTime ? Date.now() - req.startTime : 0
        
        const responseInfo = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            contentLength: JSON.stringify(obj).length,
            timestamp: new Date().toISOString()
        }

        // Log response based on status code
        if (res.statusCode >= 400) {
            logger.warn('Request Error', {
                ...responseInfo,
                error: obj.message || 'Unknown error',
                code: obj.code
            })
        } else {
            logger.info('Request Success', responseInfo)
        }

        return originalJson(obj)
    }

    // Override res.send to log non-JSON responses
    const originalSend = res.send.bind(res)
    res.send = function(body: any) {
        const responseTime = req.startTime ? Date.now() - req.startTime : 0
        
        const responseInfo = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            contentLength: typeof body === 'string' ? body.length : JSON.stringify(body).length,
            timestamp: new Date().toISOString()
        }

        if (res.statusCode >= 400) {
            logger.warn('Request Error', responseInfo)
        } else {
            logger.info('Request Success', responseInfo)
        }

        return originalSend(body)
    }

    next()
}

// Rate limiting logging middleware
export const rateLimitLogger = (windowMs: number, max: number) => {
    const requests = new Map<string, { count: number; resetTime: number }>()

    return (req: Request, res: Response, next: NextFunction): void => {
        const key = req.ip || 'unknown'
        const now = Date.now()
        const windowStart = now - windowMs

        // Clean old entries
        for (const [ip, data] of requests.entries()) {
            if (data.resetTime < now) {
                requests.delete(ip)
            }
        }

        // Get or create request data for this IP
        let requestData = requests.get(key)
        if (!requestData || requestData.resetTime < now) {
            requestData = { count: 0, resetTime: now + windowMs }
            requests.set(key, requestData)
        }

        requestData.count++

        // Log rate limit warnings
        if (requestData.count > max * 0.8) { // Log when reaching 80% of limit
            logger.warn('Rate Limit Warning', {
                ip: key,
                count: requestData.count,
                limit: max,
                url: req.originalUrl,
                method: req.method,
                userAgent: req.get('User-Agent')
            })
        }

        if (requestData.count > max) {
            logger.error('Rate Limit Exceeded', {
                ip: key,
                count: requestData.count,
                limit: max,
                url: req.originalUrl,
                method: req.method,
                userAgent: req.get('User-Agent')
            })

            res.status(429).json({
                status: 'error',
                message: 'Too many requests',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
            })
            return
        }

        next()
    }
}

// Security logging middleware
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
    const suspiciousPatterns = [
        /\.\./,  // Directory traversal
        /<script/i,  // XSS attempts
        /union.*select/i,  // SQL injection
        /javascript:/i,  // JavaScript protocol
        /on\w+=/i,  // Event handlers
    ]

    const checkSuspicious = (value: string): boolean => {
        return suspiciousPatterns.some(pattern => pattern.test(value))
    }

    let suspicious = false
    const suspiciousFields: string[] = []

    // Check URL
    if (checkSuspicious(req.originalUrl)) {
        suspicious = true
        suspiciousFields.push('URL')
    }

    // Check query parameters
    for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string' && checkSuspicious(value)) {
            suspicious = true
            suspiciousFields.push(`query.${key}`)
        }
    }

    // Check body parameters
    if (req.body && typeof req.body === 'object') {
        for (const [key, value] of Object.entries(req.body)) {
            if (typeof value === 'string' && checkSuspicious(value)) {
                suspicious = true
                suspiciousFields.push(`body.${key}`)
            }
        }
    }

    // Log suspicious activity
    if (suspicious) {
        logger.error('Suspicious Request Detected', {
            ip: req.ip,
            url: req.originalUrl,
            method: req.method,
            userAgent: req.get('User-Agent'),
            suspiciousFields,
            referer: req.get('Referer'),
            timestamp: new Date().toISOString()
        })
    }

    next()
}

// Performance monitoring middleware
export const performanceLogger = (req: RequestWithTiming, res: Response, next: NextFunction) => {
    req.startTime = Date.now()

    // Override res.end to capture final timing
    const originalEnd = res.end.bind(res)
    res.end = function(chunk?: any, encoding?: BufferEncoding | (() => void), cb?: () => void) {
        const responseTime = req.startTime ? Date.now() - req.startTime : 0

        // Log slow requests
        if (responseTime > 1000) { // Log requests taking more than 1 second
            logger.warn('Slow Request', {
                method: req.method,
                url: req.originalUrl,
                responseTime: `${responseTime}ms`,
                statusCode: res.statusCode,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            })
        }

        // Log memory usage for very slow requests
        if (responseTime > 5000) { // Log memory for requests taking more than 5 seconds
            const memUsage = process.memoryUsage()
            logger.error('Very Slow Request', {
                method: req.method,
                url: req.originalUrl,
                responseTime: `${responseTime}ms`,
                statusCode: res.statusCode,
                memoryUsage: {
                    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
                    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
                    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
                }
            })
        }

        return originalEnd.call(this, chunk, encoding as BufferEncoding, cb)
    }

    next()
}