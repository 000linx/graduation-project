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
