"""
Custom exception classes for the application
"""
from fastapi import HTTPException, status


class WarehouseException(HTTPException):
    """Base exception for warehouse-related errors"""
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)


class NotFoundException(WarehouseException):
    """Exception raised when a resource is not found"""
    def __init__(self, resource: str, resource_id: str = None):
        detail = f"{resource} not found"
        if resource_id:
            detail += f" with id: {resource_id}"
        super().__init__(detail=detail, status_code=status.HTTP_404_NOT_FOUND)


class UnauthorizedException(WarehouseException):
    """Exception raised when user is not authorized"""
    def __init__(self, detail: str = "Unauthorized access"):
        super().__init__(detail=detail, status_code=status.HTTP_401_UNAUTHORIZED)


class ForbiddenException(WarehouseException):
    """Exception raised when user is forbidden from accessing a resource"""
    def __init__(self, detail: str = "Forbidden access"):
        super().__init__(detail=detail, status_code=status.HTTP_403_FORBIDDEN)


class ValidationException(WarehouseException):
    """Exception raised when validation fails"""
    def __init__(self, detail: str):
        super().__init__(detail=detail, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)


class DatabaseException(WarehouseException):
    """Exception raised when database operations fail"""
    def __init__(self, detail: str = "Database operation failed"):
        super().__init__(detail=detail, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)