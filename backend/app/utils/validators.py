from __future__ import annotations

from typing import TYPE_CHECKING

from app.models.types import JSONList
from app.services.provider import ProviderService

if TYPE_CHECKING:
    from app.models.db_models import UserSettings


class APIKeyValidationError(ValueError):
    pass


def normalize_json_list(value: JSONList | None) -> JSONList:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    raise ValueError(f"Expected list or None, got {type(value).__name__}")


def validate_model_api_keys(
    user_settings: "UserSettings",
    model_id: str,
) -> None:
    provider_service = ProviderService()
    provider, actual_model_id = provider_service.get_provider_for_model(
        user_settings, model_id
    )

    if not provider:
        if ":" in model_id:
            provider_id = model_id.split(":", 1)[0]
            raise APIKeyValidationError(
                f"Provider '{provider_id}' not found. "
                "Please configure it in Settings > Providers."
            )
        raise APIKeyValidationError(
            f"No provider configured for model '{model_id}'. "
            "Please configure a provider in Settings > Providers."
        )

    if not provider.get("enabled", True):
        raise APIKeyValidationError(f"Provider '{provider.get('name')}' is disabled.")

    if not provider.get("auth_token"):
        raise APIKeyValidationError(
            f"API key is required for provider '{provider.get('name')}'. "
            "Please configure it in Settings."
        )

    provider_type = provider.get("provider_type", "custom")
    if provider_type == "custom" and not provider.get("base_url"):
        raise APIKeyValidationError(
            f"Base URL is required for custom provider '{provider.get('name')}'."
        )
