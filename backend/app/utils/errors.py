"""
业务异常定义。

用于在 Service/DAO 层抛出“可控业务错误”，并由全局异常处理器统一转为 ApiResponse。
"""

class AppError(Exception):
    """
    业务异常基类。

    :param message: 给前端展示的错误信息
    :param status_code: HTTP 状态码
    :param error_code: 业务错误码（可选）
    :param data: 附加数据（可选，比如字段级校验信息）
    """
    def __init__(self, message: str, status_code: int = 400, error_code: str | None = None, data=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.data = data


class ValidationError(AppError):
    """
    参数/业务校验失败（400）。
    """
    def __init__(self, message: str = "Validation error", error_code: str | None = None, data=None):
        super().__init__(message, status_code=400, error_code=error_code, data=data)


class UnauthorizedError(AppError):
    """
    未认证（401）。
    """
    def __init__(self, message: str = "Unauthorized", error_code: str | None = None, data=None):
        super().__init__(message, status_code=401, error_code=error_code, data=data)


class ForbiddenError(AppError):
    """
    无权限（403）。
    """
    def __init__(self, message: str = "Forbidden", error_code: str | None = None, data=None):
        super().__init__(message, status_code=403, error_code=error_code, data=data)


class NotFoundError(AppError):
    """
    资源不存在（404）。
    """
    def __init__(self, message: str = "Not found", error_code: str | None = None, data=None):
        super().__init__(message, status_code=404, error_code=error_code, data=data)


class ConflictError(AppError):
    """
    资源冲突（409），例如唯一键重复。
    """
    def __init__(self, message: str = "Conflict", error_code: str | None = None, data=None):
        super().__init__(message, status_code=409, error_code=error_code, data=data)
