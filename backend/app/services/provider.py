from typing import TYPE_CHECKING, Any, cast

if TYPE_CHECKING:
    from app.models.db_models import UserSettings


def _get_attr(obj: Any, key: str, default: Any = None) -> Any:
    if hasattr(obj, key):
        return getattr(obj, key)
    if isinstance(obj, dict):
        return obj.get(key, default)
    return default


class ProviderService:
    def get_all_models(self, user_settings: "UserSettings") -> list[dict[str, Any]]:
        result: list[dict[str, Any]] = []
        for provider in user_settings.custom_providers or []:
            if not _get_attr(provider, "enabled", True) or not _get_attr(
                provider, "auth_token"
            ):
                continue
            provider_id = _get_attr(provider, "id")
            provider_name = _get_attr(provider, "name")
            provider_type = _get_attr(provider, "provider_type", "custom")
            if hasattr(provider_type, "value"):
                provider_type = provider_type.value
            for model in _get_attr(provider, "models", []):
                if _get_attr(model, "enabled", True):
                    result.append(
                        {
                            "model_id": f"{provider_id}:{_get_attr(model, 'model_id')}",
                            "name": _get_attr(model, "name"),
                            "provider_id": provider_id,
                            "provider_name": provider_name,
                            "provider_type": provider_type,
                        }
                    )
        return result

    def find_provider_by_id(
        self, user_settings: "UserSettings", provider_id: str
    ) -> dict[str, Any] | None:
        for provider in user_settings.custom_providers or []:
            if _get_attr(provider, "id") == provider_id:
                return cast(dict[str, Any], provider)
        return None

    def get_provider_for_model(
        self, user_settings: "UserSettings", model_id: str
    ) -> tuple[dict[str, Any] | None, str]:
        if ":" not in model_id:
            return None, model_id
        provider_id, actual_model_id = model_id.split(":", 1)
        provider = self.find_provider_by_id(user_settings, provider_id)
        return provider, actual_model_id
