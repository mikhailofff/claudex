from fastapi import APIRouter, Depends

from app.core.deps import get_provider_service, get_user_service
from app.core.security import get_current_user
from app.models.db_models import User
from app.models.schemas import AIModelResponse
from app.services.provider import ProviderService
from app.services.user import UserService
from app.utils.redis import redis_connection

router = APIRouter()


@router.get("/", response_model=list[AIModelResponse])
async def list_models(
    current_user: User = Depends(get_current_user),
    provider_service: ProviderService = Depends(get_provider_service),
    user_service: UserService = Depends(get_user_service),
) -> list[AIModelResponse]:
    async with redis_connection() as redis:
        user_settings = await user_service.get_user_settings(
            current_user.id, redis=redis
        )
        models = provider_service.get_all_models(user_settings)
        return [AIModelResponse(**model) for model in models]
