"""
统一 API 响应封装。

职责：
- 以统一结构返回 JSON：{ code, message, data }
- 与 Flask errorhandler 配合，保证 /api/* 返回一致格式

Author: Graduation Project Team
Created: 2026-04-26
Dependencies:
- flask.jsonify
"""

from flask import jsonify

class ApiResponse:
    """
    统一 API 响应格式封装
    """
    @staticmethod
    def success(data=None, message="Success", code=200):
        """
        成功响应。

        Args:
            data: 响应数据（可为 dict/list/str 等可 JSON 序列化对象）。
            message: 响应消息。
            code: HTTP 状态码。

        Returns:
            tuple: (flask.Response, int) 形式的 JSON 响应与状态码。
        """
        return jsonify({
            "code": code,
            "msg": message,
            "message": message,
            "data": data
        }), code

    @staticmethod
    def error(message="Error", code=400, data=None):
        """
        错误响应。

        Args:
            message: 错误消息。
            code: HTTP 状态码。
            data: 附加数据（可选，用于携带错误详情）。

        Returns:
            tuple: (flask.Response, int) 形式的 JSON 响应与状态码。
        """
        return jsonify({
            "code": code,
            "msg": message,
            "message": message,
            "data": data
        }), code

    @staticmethod
    def unauthorized(message="Unauthorized"):
        """
        未授权响应（401）。

        Args:
            message: 错误消息。

        Returns:
            tuple: (flask.Response, 401)
        """
        return jsonify({
            "code": 401,
            "msg": message,
            "message": message
        }), 401

    @staticmethod
    def forbidden(message="Forbidden"):
        """
        禁止访问响应（403）。

        Args:
            message: 错误消息。

        Returns:
            tuple: (flask.Response, 403)
        """
        return jsonify({
            "code": 403,
            "msg": message,
            "message": message
        }), 403

    @staticmethod
    def not_found(message="Not Found"):
        """
        资源未找到响应（404）。

        Args:
            message: 错误消息。

        Returns:
            tuple: (flask.Response, 404)
        """
        return jsonify({
            "code": 404,
            "msg": message,
            "message": message
        }), 404
