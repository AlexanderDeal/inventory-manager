"""add image_url to items

Revision ID: a3f92c1b8e47
Revises: 49f1437754b9
Create Date: 2026-06-23 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a3f92c1b8e47'
down_revision: Union[str, None] = '49f1437754b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('items', sa.Column('image_url', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('items', 'image_url')
