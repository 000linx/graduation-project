import pytest
import json
from app import create_app

@pytest.fixture
def app():
    app = create_app('development')
    app.config.update({
        "TESTING": True,
    })
    yield app

@pytest.fixture
def client(app):
    return app.test_client()

def test_product_list(client):
    response = client.get('/api/product/list')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "products" in data["data"]

def test_search(client):
    response = client.get('/api/search/query?q=test')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "results" in data["data"]
