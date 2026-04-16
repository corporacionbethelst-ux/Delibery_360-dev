"""
Conector para sistemas POS (Point of Sale)
"""
import httpx
from typing import Dict, Any, Optional


class POSConnector:
    
    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        self.base_url = base_url or "https://api.pos-example.com"
        self.api_key = api_key
        self.timeout = 30
    
    async def send_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}" if self.api_key else ""
            }
            
            try:
                response = await client.post(
                    f"{self.base_url}/orders",
                    json=order_data,
                    headers=headers
                )
                response.raise_for_status()
                return {
                    "success": True,
                    "data": response.json(),
                    "status_code": response.status_code
                }
            except httpx.HTTPError as e:
                return {
                    "success": False,
                    "error": str(e),
                    "status_code": getattr(e, "status_code", 500)
                }
    
    async def get_order_status(self, order_id: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
            
            try:
                response = await client.get(
                    f"{self.base_url}/orders/{order_id}",
                    headers=headers
                )
                response.raise_for_status()
                return {
                    "success": True,
                    "data": response.json()
                }
            except Exception as e:
                return {"success": False, "error": str(e)}
    
    async def cancel_order(self, order_id: str, reason: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
            
            try:
                response = await client.request(
                    "DELETE",
                    f"{self.base_url}/orders/{order_id}",
                    json={"reason": reason},
                    headers=headers
                )
                response.raise_for_status()
                return {"success": True, "data": response.json()}
            except Exception as e:
                return {"success": False, "error": str(e)}
    
    async def test_connection(self, config: Dict[str, Any]) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=10) as client:
            try:
                response = await client.get(f"{config.get('base_url', self.base_url)}/health")
                response.raise_for_status()
                return {"success": True, "message": "Conexión exitosa con POS"}
            except Exception as e:
                return {"success": False, "error": str(e)}
