"""unified providers

Revision ID: i9j0k1l2m3n4
Revises: h8i9j0k1l2m3
Create Date: 2026-01-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'i9j0k1l2m3n4'
down_revision: Union[str, None] = 'h8i9j0k1l2m3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    user_settings_columns = [c['name'] for c in inspector.get_columns('user_settings')]

    if 'custom_providers' not in user_settings_columns:
        op.add_column('user_settings', sa.Column('custom_providers', sa.JSON(), nullable=True))

    # Migrate existing API keys to custom_providers JSON
    conn.execute(sa.text("""
        UPDATE user_settings
        SET custom_providers = (
            SELECT COALESCE(json_agg(provider), '[]'::json)
            FROM (
                SELECT json_build_object(
                    'id', gen_random_uuid()::text,
                    'name', 'Anthropic',
                    'provider_type', 'anthropic',
                    'base_url', null,
                    'auth_token', us2.claude_code_oauth_token,
                    'enabled', true,
                    'models', json_build_array(
                        json_build_object('model_id', 'claude-opus-4-5', 'name', 'Claude Opus 4.5', 'enabled', true),
                        json_build_object('model_id', 'claude-sonnet-4-5', 'name', 'Claude Sonnet 4.5', 'enabled', true),
                        json_build_object('model_id', 'claude-haiku-4-5', 'name', 'Claude Haiku 4.5', 'enabled', true)
                    )
                ) as provider
                FROM user_settings us2
                WHERE us2.id = user_settings.id
                  AND us2.claude_code_oauth_token IS NOT NULL
                  AND us2.claude_code_oauth_token != ''

                UNION ALL

                SELECT json_build_object(
                    'id', gen_random_uuid()::text,
                    'name', 'OpenRouter',
                    'provider_type', 'openrouter',
                    'base_url', null,
                    'auth_token', us2.openrouter_api_key,
                    'enabled', true,
                    'models', json_build_array(
                        json_build_object('model_id', 'openai/gpt-5.2', 'name', 'GPT-5.2', 'enabled', true),
                        json_build_object('model_id', 'openai/gpt-5.1-codex', 'name', 'GPT-5.1 Codex', 'enabled', true),
                        json_build_object('model_id', 'x-ai/grok-code-fast-1', 'name', 'Grok Code Fast', 'enabled', true),
                        json_build_object('model_id', 'moonshotai/kimi-k2-thinking', 'name', 'Kimi K2 Thinking', 'enabled', true),
                        json_build_object('model_id', 'minimax/minimax-m2', 'name', 'Minimax M2', 'enabled', true),
                        json_build_object('model_id', 'deepseek/deepseek-v3.2', 'name', 'Deepseek V3.2', 'enabled', true)
                    )
                ) as provider
                FROM user_settings us2
                WHERE us2.id = user_settings.id
                  AND us2.openrouter_api_key IS NOT NULL
                  AND us2.openrouter_api_key != ''
            ) providers
        )
        WHERE claude_code_oauth_token IS NOT NULL
           OR openrouter_api_key IS NOT NULL
    """))

    if 'claude_code_oauth_token' in user_settings_columns:
        op.drop_column('user_settings', 'claude_code_oauth_token')

    if 'openrouter_api_key' in user_settings_columns:
        op.drop_column('user_settings', 'openrouter_api_key')

    if 'z_ai_api_key' in user_settings_columns:
        op.drop_column('user_settings', 'z_ai_api_key')

    tables = inspector.get_table_names()
    if 'ai_models' in tables:
        indexes = inspector.get_indexes('ai_models')
        for index in indexes:
            op.drop_index(index['name'], table_name='ai_models')
        op.drop_table('ai_models')


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    user_settings_columns = [c['name'] for c in inspector.get_columns('user_settings')]

    if 'claude_code_oauth_token' not in user_settings_columns:
        op.add_column('user_settings', sa.Column('claude_code_oauth_token', sa.String(), nullable=True))

    if 'openrouter_api_key' not in user_settings_columns:
        op.add_column('user_settings', sa.Column('openrouter_api_key', sa.String(), nullable=True))

    if 'z_ai_api_key' not in user_settings_columns:
        op.add_column('user_settings', sa.Column('z_ai_api_key', sa.String(), nullable=True))

    # Extract tokens back from custom_providers
    conn.execute(sa.text("""
        UPDATE user_settings
        SET claude_code_oauth_token = (
            SELECT p->>'auth_token'
            FROM json_array_elements(custom_providers) p
            WHERE p->>'provider_type' = 'anthropic'
            LIMIT 1
        ),
        openrouter_api_key = (
            SELECT p->>'auth_token'
            FROM json_array_elements(custom_providers) p
            WHERE p->>'provider_type' = 'openrouter'
            LIMIT 1
        )
        WHERE custom_providers IS NOT NULL
    """))

    if 'custom_providers' in user_settings_columns:
        op.drop_column('user_settings', 'custom_providers')

    # Recreate ai_models table
    op.create_table(
        'ai_models',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('model_id', sa.String(100), nullable=False, unique=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('provider', sa.String(50), nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True, nullable=False),
        sa.Column('sort_order', sa.Integer(), default=0, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('idx_ai_models_provider_active', 'ai_models', ['provider', 'is_active'])
    op.create_index('idx_ai_models_sort_order', 'ai_models', ['sort_order'])
