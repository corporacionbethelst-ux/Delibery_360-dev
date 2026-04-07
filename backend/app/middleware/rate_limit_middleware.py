"""Rate Limiting Middleware"""
from fastapi import Request, HTTPException, status
from collections import defaultdict
import time

class RateLimitMiddleware:
    def __init__(self, app):
        self.app = app
        self.requests = defaultdict(list)
        self.limit = 100  # requests per minute
        self.window = 60  # seconds
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive=receive)
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        # Clean old requests
        self.requests[client_ip] = [
            t for t in self.requests[client_ip]
            if current_time - t < self.window
        ]
        
        # Check limit
        if len(self.requests[client_ip]) >= self.limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Demasiadas solicitudes. Intente más tarde."
            )
        
        self.requests[client_ip].append(current_time)
        await self.app(scope, receive, send)
