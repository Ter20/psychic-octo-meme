from aix_mission_control.connectors.omniroute import OmniRouteConnector


def test_unconfigured_connector_reports_status_instead_of_pretending():
    connector = OmniRouteConnector(base_url="", api_key="")
    assert connector.configured is False
    assert "not configured" in connector.handle("do something").lower()


def test_configured_flag_true_once_api_key_present():
    connector = OmniRouteConnector(base_url="https://example.com", api_key="key")
    assert connector.configured is True


def test_defaults_to_omniroutes_documented_local_port():
    connector = OmniRouteConnector(base_url="", api_key="key")
    assert connector.base_url == "http://localhost:20128"
