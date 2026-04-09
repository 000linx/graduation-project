import pytest
import json
from app import create_app

@pytest.fixture
def client():
    app = create_app('development')
    app.config['TESTING'] = True
    return app.test_client()

def test_order_history_unauthorized(client):
    response = client.get('/api/order/history')
    # Should be 401 because it's jwt_required
    assert response.status_code == 401

def test_order_create_unauthorized(client):
    response = client.post('/api/order/create', json={"items": [], "shipping_address": "x"})
    assert response.status_code == 401

def test_order_pay_unauthorized(client):
    response = client.post('/api/order/000000000000000000000000/pay', json={"payment_method": "wechat"})
    assert response.status_code == 401
