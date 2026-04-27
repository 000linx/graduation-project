"""
听力评估服务（简化实现）。

职责：
- 根据听力测试结果给出听损分级与建议

Author: Graduation Project Team
Created: 2026-04-26
Dependencies:
- 无外部依赖（纯计算）
"""

class HearingEvalService:
    """
    听力评估服务，分析听力测试结果
    """
    @staticmethod
    def evaluate(test_results):
        """
        评估听力测试结果并给出建议。

        Args:
            test_results: 测试结果字典（示例：{频率: 分贝数}）。

        Returns:
            dict: 评估报告，包括 average_loss_db、degree 与 recommendation。

        Notes:
            当前实现为简化规则：使用平均听阈(dB HL)做分级。
        """
        # 复杂听力测试分析占位符
        # 目前基于平均分贝数 (dB HL) 进行简单分类
        # 26-40 dB: 轻度, 41-55 dB: 中度, 56-70 dB: 中重度, 71-90 dB: 重度, >90 dB: 极重度
        avg_loss = sum(test_results.values()) / len(test_results) if test_results else 0
        
        if avg_loss <= 25:
            degree = "normal"
        elif avg_loss <= 40:
            degree = "mild"
        elif avg_loss <= 55:
            degree = "moderate"
        elif avg_loss <= 70:
            degree = "moderately severe"
        elif avg_loss <= 90:
            degree = "severe"
        else:
            degree = "profound"
            
        return {
            "average_loss_db": avg_loss,
            "degree": degree,
            "recommendation": f"You have {degree} hearing loss. Please consult a specialist or consider suitable hearing aids."
        }
