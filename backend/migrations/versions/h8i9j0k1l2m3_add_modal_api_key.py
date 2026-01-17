"""add modal api key

Revision ID: h8i9j0k1l2m3
Revises: g7h8i9j0k1l2
Create Date: 2026-01-16 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'h8i9j0k1l2m3'
down_revision: Union[str, None] = 'g7h8i9j0k1l2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    user_settings_columns = [c['name'] for c in inspector.get_columns('user_settings')]

    if 'modal_api_key' not in user_settings_columns:
        op.add_column('user_settings', sa.Column('modal_api_key', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('user_settings', 'modal_api_key')
