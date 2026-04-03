from flask import jsonify

class ApiResponse:
    """
    统一 API 响应格式封装
    """
    @staticmethod
    def success(data=None, message="Success", code=200):
        """
        成功响应
        :param data: 响应数据
        :param message: 响应消息
        :param code: HTTP 状态码
        :return: JSON 响应对象
        """
        return jsonify({
            "code": code,
            "message": message,
            "data": data
        }), code

    @staticmethod
    def error(message="Error", code=400, data=None):
        """
        错误响应
        :param message: 错误消息
        :param code: HTTP 状态码
        :param data: 附加数据
        :return: JSON 响应对象
        """
        return jsonify({
            "code": code,
            "message": message,
            "data": data
        }), code

    @staticmethod
    def unauthorized(message="Unauthorized"):
        """
        未授权响应 (401)
        :param message: 错误消息
        :return: JSON 响应对象
        """
        return jsonify({
            "code": 401,
            "message": message
        }), 401

    @staticmethod
    def forbidden(message="Forbidden"):
        """
        禁止访问响应 (403)
        :param message: 错误消息
        :return: JSON 响应对象
        """
        return jsonify({
            "code": 403,
            "message": message
        }), 403

    @staticmethod
    def not_found(message="Not Found"):
        """
        资源未找到响应 (404)
        :param message: 错误消息
        :return: JSON 响应对象
        """
        return jsonify({
            "code": 404,
            "message": message
        }), 404
